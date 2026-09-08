package com.cslm;

import com.cslm.domain.*;
import com.cslm.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Exercises the acceptance flow from CLAUDE.md section 26: create application, environment,
 * certificate, link them, read it back, update its expiration and confirm the change is audited.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CertificateLifecycleIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private String token;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ADMIN").description("Admin").build()));

        if (userRepository.findByUsername("it-admin").isEmpty()) {
            userRepository.save(User.builder()
                    .username("it-admin")
                    .email("it-admin@cslm.example.com")
                    .fullName("IT Admin")
                    .passwordHash(passwordEncoder.encode("Test123!"))
                    .active(true)
                    .roles(Set.of(adminRole))
                    .build());
        }

        ResponseEntity<Map> loginResponse = restTemplate.postForEntity(
                url("/api/auth/login"),
                Map.of("username", "it-admin", "password", "Test123!"),
                Map.class);
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        token = (String) loginResponse.getBody().get("token");
        assertThat(token).isNotBlank();
    }

    @Test
    void fullLifecycleFlow() {
        // 1. Create application
        Map<String, Object> appPayload = Map.of(
                "name", "Test Banking App", "code", "TEST-APP-" + System.nanoTime(),
                "criticality", "HIGH", "status", "ACTIVE");
        ResponseEntity<Map> appResponse = postJson("/api/applications", appPayload);
        assertThat(appResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long applicationId = ((Number) appResponse.getBody().get("id")).longValue();

        // 2. Create environment
        Map<String, Object> envPayload = Map.of("name", "Production IT", "code", "PROD-IT-" + System.nanoTime());
        ResponseEntity<Map> envResponse = postJson("/api/environments", envPayload);
        assertThat(envResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long environmentId = ((Number) envResponse.getBody().get("id")).longValue();

        // 3. Register certificate
        Map<String, Object> certPayload = Map.of(
                "name", "it-test-cert",
                "expirationDate", LocalDate.now().plusDays(15).toString(),
                "environmentId", environmentId,
                "owner", "Test Owner",
                "contactEmail", "owner@example.com",
                "applicationIds", List.of(applicationId));
        ResponseEntity<Map> certResponse = postJson("/api/certificates", certPayload);
        assertThat(certResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long certificateId = ((Number) certResponse.getBody().get("id")).longValue();

        // 4/5. Certificate should already be associated to the application and environment
        assertThat((List) certResponse.getBody().get("applications")).hasSize(1);
        assertThat(certResponse.getBody().get("semaphoreStatus")).isEqualTo("ORANGE"); // 15 days remaining

        // 7/8/9. Consult it from Certificates and verify expiration + semaphore
        ResponseEntity<Map> getResponse = getJson("/api/certificates/" + certificateId);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody().get("daysRemaining")).isEqualTo(15);

        // 10/11. Open the dependency graph: Certificate -> Application
        ResponseEntity<Map> graphResponse = getJson("/api/certificates/" + certificateId + "/dependencies");
        assertThat(graphResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> nodes = (List<Map<String, Object>>) graphResponse.getBody().get("nodes");
        assertThat(nodes).anyMatch(n -> "APPLICATION".equals(n.get("type")));

        // 12/13. Open the application and see Certificates + Secrets grouped by environment
        ResponseEntity<Map> assetsResponse = getJson("/api/applications/" + applicationId + "/assets");
        assertThat(assetsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> environments = (List<Map<String, Object>>) assetsResponse.getBody().get("environments");
        assertThat(environments).hasSize(1);

        // 14. Modify the expiration date
        Map<String, Object> updatePayload = Map.of(
                "name", "it-test-cert",
                "expirationDate", LocalDate.now().plusDays(200).toString(),
                "environmentId", environmentId,
                "owner", "Test Owner",
                "contactEmail", "owner@example.com");
        HttpHeaders headers = authHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> updateResponse = restTemplate.exchange(
                url("/api/certificates/" + certificateId), HttpMethod.PUT,
                new HttpEntity<>(updatePayload, headers), Map.class);
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResponse.getBody().get("semaphoreStatus")).isEqualTo("GREEN");

        // 15. Registered in audit log
        ResponseEntity<Map> auditResponse = getJson("/api/audit-log?entityName=Certificate&entityId=" + certificateId);
        assertThat(auditResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> auditEntries = (List<Map<String, Object>>) auditResponse.getBody().get("content");
        assertThat(auditEntries).anyMatch(e -> "expirationDate".equals(e.get("fieldName")));

        // 16/17/18. Trigger a manual test notification and confirm it is recorded in history
        Map<String, Object> testNotificationPayload = Map.of("assetType", "CERTIFICATE", "assetId", certificateId);
        ResponseEntity<Map> notificationResponse = postJson("/api/notifications/test", testNotificationPayload);
        assertThat(notificationResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> historyResponse = getJson("/api/notifications");
        assertThat(historyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> historyEntries = (List<Map<String, Object>>) historyResponse.getBody().get("content");
        assertThat(historyEntries).anyMatch(e -> certificateId.equals(((Number) e.get("assetId")).longValue()));
    }

    private ResponseEntity<Map> postJson(String path, Object payload) {
        HttpHeaders headers = authHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return restTemplate.postForEntity(url(path), new HttpEntity<>(payload, headers), Map.class);
    }

    private ResponseEntity<Map> getJson(String path) {
        HttpHeaders headers = authHeaders();
        return restTemplate.exchange(url(path), HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        if (token != null) {
            headers.setBearerAuth(token);
        }
        return headers;
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
