package com.cslm.service;

import com.cslm.dto.CertificateDtos.CertificateParseResponse;
import com.cslm.exception.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.naming.InvalidNameException;
import javax.naming.ldap.LdapName;
import javax.naming.ldap.Rdn;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.security.PublicKey;
import java.security.cert.Certificate;
import java.security.cert.CertificateEncodingException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.interfaces.DSAPublicKey;
import java.security.interfaces.ECPublicKey;
import java.security.interfaces.RSAPublicKey;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Collection;
import java.util.Date;

/**
 * Reads a public X.509 certificate file (PEM, DER, CRT, CER) uploaded by the user and
 * extracts its metadata, so the certificate creation form can be pre-filled automatically.
 * No private key material is ever read or stored - only public certificate fields.
 */
@Service
public class CertificateParsingService {

    public CertificateParseResponse parse(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Debe adjuntar un archivo de certificado.");
        }
        X509Certificate cert = readLeafCertificate(file);

        String subject = cert.getSubjectX500Principal().getName();
        String issuer = cert.getIssuerX500Principal().getName();
        String commonName = extractCommonName(subject);

        return new CertificateParseResponse(
                commonName,
                subject,
                issuer,
                cert.getSerialNumber().toString(16).toUpperCase(),
                cert.getSigAlgName(),
                resolveKeySize(cert.getPublicKey()),
                toLocalDate(cert.getNotBefore()),
                toLocalDate(cert.getNotAfter()),
                commonName,
                toPem(cert)
        );
    }

    // Normalizes the certificate to PEM regardless of the original upload encoding (PEM or DER).
    private String toPem(X509Certificate cert) {
        try {
            String base64 = Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(cert.getEncoded());
            return "-----BEGIN CERTIFICATE-----\n" + base64 + "\n-----END CERTIFICATE-----\n";
        } catch (CertificateEncodingException e) {
            throw new BadRequestException("No se pudo procesar el contenido del certificado.");
        }
    }

    private X509Certificate readLeafCertificate(MultipartFile file) {
        try {
            CertificateFactory factory = CertificateFactory.getInstance("X.509");
            Collection<? extends Certificate> certs =
                    factory.generateCertificates(new ByteArrayInputStream(file.getBytes()));
            if (certs.isEmpty()) {
                throw new BadRequestException("El archivo no contiene un certificado X.509 válido.");
            }
            return (X509Certificate) certs.iterator().next();
        } catch (CertificateException | IOException e) {
            throw new BadRequestException("No se pudo leer el certificado. Formatos soportados: PEM, CRT, CER, DER.");
        }
    }

    private String extractCommonName(String distinguishedName) {
        if (distinguishedName == null || distinguishedName.isBlank()) {
            return null;
        }
        try {
            LdapName ldapName = new LdapName(distinguishedName);
            for (Rdn rdn : ldapName.getRdns()) {
                if ("CN".equalsIgnoreCase(rdn.getType())) {
                    return String.valueOf(rdn.getValue());
                }
            }
        } catch (InvalidNameException ignored) {
            // Not a parseable DN - leave common name unset rather than failing the whole upload.
        }
        return null;
    }

    private Integer resolveKeySize(PublicKey publicKey) {
        if (publicKey instanceof RSAPublicKey rsaPublicKey) {
            return rsaPublicKey.getModulus().bitLength();
        }
        if (publicKey instanceof ECPublicKey ecPublicKey) {
            return ecPublicKey.getParams().getCurve().getField().getFieldSize();
        }
        if (publicKey instanceof DSAPublicKey dsaPublicKey) {
            return dsaPublicKey.getParams().getP().bitLength();
        }
        return null;
    }

    private LocalDate toLocalDate(Date date) {
        return date == null ? null : date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    }
}
