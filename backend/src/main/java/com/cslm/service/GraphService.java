package com.cslm.service;

import com.cslm.domain.*;
import com.cslm.dto.GraphDtos.GraphEdge;
import com.cslm.dto.GraphDtos.GraphNode;
import com.cslm.dto.GraphDtos.GraphResponse;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GraphService {

    private final CertificateRepository certificateRepository;
    private final SecretRepository secretRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationAssetRepository applicationAssetRepository;
    private final AssetDeploymentRepository assetDeploymentRepository;
    private final SemaphoreService semaphoreService;

    public GraphResponse certificateDependencies(Long certificateId) {
        Certificate cert = certificateRepository.findById(certificateId)
                .orElseThrow(() -> ResourceNotFoundException.of("Certificate", certificateId));
        return assetDependencies(AssetCategory.CERTIFICATE, cert.getId(), "cert-" + cert.getId(), cert.getName(),
                cert.getEnvironment(), cert.getStatus(), semaphoreService.statusFor(cert.getExpirationDate()).name(),
                semaphoreService.daysRemaining(cert.getExpirationDate()), cert.getExpirationDate() == null ? null : cert.getExpirationDate().toString());
    }

    public GraphResponse secretDependencies(Long secretId) {
        Secret secret = secretRepository.findById(secretId)
                .orElseThrow(() -> ResourceNotFoundException.of("Secret", secretId));
        return assetDependencies(AssetCategory.SECRET, secret.getId(), "secret-" + secret.getId(), secret.getName(),
                secret.getEnvironment(), secret.getStatus(), semaphoreService.statusFor(secret.getExpirationDate()).name(),
                semaphoreService.daysRemaining(secret.getExpirationDate()),
                secret.getExpirationDate() == null ? null : secret.getExpirationDate().toString());
    }

    private GraphResponse assetDependencies(AssetCategory category, Long assetId, String rootNodeId, String rootLabel,
                                             Environment environment, String status, String semaphore, long daysRemaining,
                                             String expirationDate) {
        List<GraphNode> nodes = new ArrayList<>();
        List<GraphEdge> edges = new ArrayList<>();

        String assetType = category.name();
        nodes.add(new GraphNode(rootNodeId, rootLabel, assetType, Map.of(
                "status", status == null ? "" : status,
                "semaphore", semaphore,
                "daysRemaining", daysRemaining,
                "expirationDate", expirationDate == null ? "" : expirationDate
        )));

        for (ApplicationAsset link : applicationAssetRepository.findByAssetTypeAndAssetId(category, assetId)) {
            Application app = link.getApplication();
            String appNodeId = "app-" + app.getId();
            nodes.add(new GraphNode(appNodeId, app.getName(), "APPLICATION", Map.of(
                    "code", app.getCode(), "criticality", app.getCriticality()
            )));
            edges.add(new GraphEdge(rootNodeId + "-" + appNodeId, rootNodeId, appNodeId, "used by"));
        }

        String envNodeId = "env-" + environment.getId();
        nodes.add(new GraphNode(envNodeId, environment.getName(), "ENVIRONMENT", Map.of("code", environment.getCode())));
        edges.add(new GraphEdge(rootNodeId + "-" + envNodeId, rootNodeId, envNodeId, "in"));

        for (AssetDeployment deployment : assetDeploymentRepository.findByAssetTypeAndAssetId(category, assetId)) {
            DeploymentLocation loc = deployment.getDeploymentLocation();
            String locNodeId = "loc-" + loc.getId();
            nodes.add(new GraphNode(locNodeId, loc.getName(), "LOCATION", Map.of(
                    "type", loc.getLocationType().getCode(),
                    "cluster", loc.getCluster() == null ? "" : loc.getCluster(),
                    "namespace", loc.getNamespace() == null ? "" : loc.getNamespace(),
                    "reference", deployment.getReference() == null ? "" : deployment.getReference()
            )));
            edges.add(new GraphEdge(envNodeId + "-" + locNodeId, envNodeId, locNodeId, "deployed on"));
        }

        return new GraphResponse(dedupeNodes(nodes), edges);
    }

    public GraphResponse applicationGraph(Long applicationId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ResourceNotFoundException.of("Application", applicationId));

        List<GraphNode> nodes = new ArrayList<>();
        List<GraphEdge> edges = new ArrayList<>();

        String appNodeId = "app-" + app.getId();
        nodes.add(new GraphNode(appNodeId, app.getName(), "APPLICATION", Map.of(
                "code", app.getCode(), "criticality", app.getCriticality()
        )));

        for (ApplicationAsset link : applicationAssetRepository.findByApplicationId(applicationId)) {
            if (link.getAssetType() == AssetCategory.CERTIFICATE) {
                certificateRepository.findById(link.getAssetId()).ifPresent(cert -> {
                    String envNodeId = "env-" + cert.getEnvironment().getId();
                    addEnvironmentNodeOnce(nodes, envNodeId, cert.getEnvironment());
                    addEdgeOnce(edges, appNodeId + "-" + envNodeId, appNodeId, envNodeId, "has environment");

                    String certNodeId = "cert-" + cert.getId();
                    nodes.add(new GraphNode(certNodeId, cert.getName(), "CERTIFICATE", Map.of(
                            "status", cert.getStatus(),
                            "semaphore", semaphoreService.statusFor(cert.getExpirationDate()).name(),
                            "daysRemaining", semaphoreService.daysRemaining(cert.getExpirationDate()),
                            "expirationDate", cert.getExpirationDate().toString()
                    )));
                    edges.add(new GraphEdge(envNodeId + "-" + certNodeId, envNodeId, certNodeId, "certificate"));
                });
            } else {
                secretRepository.findById(link.getAssetId()).ifPresent(secret -> {
                    String envNodeId = "env-" + secret.getEnvironment().getId();
                    addEnvironmentNodeOnce(nodes, envNodeId, secret.getEnvironment());
                    addEdgeOnce(edges, appNodeId + "-" + envNodeId, appNodeId, envNodeId, "has environment");

                    String secretNodeId = "secret-" + secret.getId();
                    nodes.add(new GraphNode(secretNodeId, secret.getName(), "SECRET", Map.of(
                            "status", secret.getStatus(),
                            "semaphore", semaphoreService.statusFor(secret.getExpirationDate()).name(),
                            "daysRemaining", semaphoreService.daysRemaining(secret.getExpirationDate()),
                            "expirationDate", secret.getExpirationDate() == null ? "" : secret.getExpirationDate().toString()
                    )));
                    edges.add(new GraphEdge(envNodeId + "-" + secretNodeId, envNodeId, secretNodeId, "secret"));
                });
            }
        }

        return new GraphResponse(dedupeNodes(nodes), edges);
    }

    private void addEnvironmentNodeOnce(List<GraphNode> nodes, String envNodeId, Environment environment) {
        if (nodes.stream().noneMatch(n -> n.id().equals(envNodeId))) {
            nodes.add(new GraphNode(envNodeId, environment.getName(), "ENVIRONMENT", Map.of("code", environment.getCode())));
        }
    }

    private void addEdgeOnce(List<GraphEdge> edges, String id, String source, String target, String label) {
        if (edges.stream().noneMatch(e -> e.id().equals(id))) {
            edges.add(new GraphEdge(id, source, target, label));
        }
    }

    private List<GraphNode> dedupeNodes(List<GraphNode> nodes) {
        return nodes.stream().filter(distinctByKey(GraphNode::id)).toList();
    }

    private static <T> java.util.function.Predicate<T> distinctByKey(java.util.function.Function<? super T, ?> keyExtractor) {
        var seen = java.util.concurrent.ConcurrentHashMap.newKeySet();
        return t -> seen.add(keyExtractor.apply(t));
    }
}
