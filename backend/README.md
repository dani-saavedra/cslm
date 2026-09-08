# CSLM Backend — Certificate & Secret Lifecycle Manager

API REST que centraliza el inventario y el ciclo de vida de certificados digitales y secretos de
una organización: propietarios, aplicaciones, ambientes, ubicaciones de despliegue, cálculo de
riesgo por vencimiento (semáforo), grafo de dependencias, notificaciones por correo y auditoría
de cambios.

## Stack

- **Java 21** + **Spring Boot 3.3** (Web, Data JPA / Hibernate, Bean Validation, Security, Mail)
- **MySQL 8** como base de datos; **Flyway** gestiona el esquema (`V1__init_schema.sql`) y los
  datos de ejemplo (`V2__seed_data.sql`)
- **JWT** propio para autenticación (`/api/auth/login`); roles `ADMIN`, `OPERATOR`, `VIEWER`
- **springdoc-openapi** para la documentación Swagger
- **Spring Scheduler** para el job diario de notificaciones de vencimiento
- Build con **Gradle** (wrapper incluido)

Arquitectura por capas / features: `config`, `security`, `domain`, `repository`, `dto`, `service`,
`controller`, `exception`, `scheduler`, `audit`. Los controladores nunca exponen entidades JPA:
todo pasa por DTOs.

## Requisitos

- JDK 21 (solo si se ejecuta sin Docker; el `Dockerfile` ya lo trae)
- Una instancia de MySQL 8 accesible (o usar Docker Compose, que la incluye)

## Cómo iniciar en local

### Opción A — Docker Compose (recomendada)

Desde la raíz del repositorio (`../`), que levanta backend + frontend + MySQL + MailHog:

```bash
cp ../.env.example ../.env      # valores por defecto funcionan tal cual
docker compose up --build backend
```

El contenedor espera a que MySQL esté sano, aplica las migraciones Flyway y arranca en el
puerto **8080**.

### Opción B — Solo el backend con Gradle

Necesita un MySQL 8 con una base de datos vacía llamada `cslm`. Levantar solo la base con el
compose de la raíz:

```bash
docker compose up -d mysql mailhog
```

Y luego, desde este directorio:

```bash
./gradlew bootRun
```

Variables por defecto (ver `src/main/resources/application.yml`): `DB_HOST=localhost`,
`DB_PORT=3306`, `DB_NAME=cslm`, `DB_USERNAME=cslm`, `DB_PASSWORD=cslm`, SMTP apuntando a
`localhost:1025` (MailHog). Para sobreescribirlas:

```bash
DB_HOST=localhost DB_NAME=cslm DB_USERNAME=cslm DB_PASSWORD=cslm ./gradlew bootRun
```

### Verificación

- API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs
- Health: http://localhost:8080/actuator/health
- Correos enviados (MailHog): http://localhost:8025

### Usuarios de ejemplo (sembrados por Flyway)

| Usuario  | Contraseña   | Rol      |
|----------|--------------|----------|
| admin    | Admin123!    | ADMIN    |
| operator | Operator123! | OPERATOR |
| viewer   | Viewer123!   | VIEWER   |

Ejemplo de login:

```bash
curl -s http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin123!"}'
```

## Variables de entorno

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `SERVER_PORT` | `8080` | Puerto HTTP |
| `DB_HOST` / `DB_PORT` | `localhost` / `3306` | Host y puerto de MySQL |
| `DB_NAME` / `DB_USERNAME` / `DB_PASSWORD` | `cslm` / `cslm` / `cslm` | Credenciales de la base |
| `SMTP_HOST` / `SMTP_PORT` | `localhost` / `1025` | Servidor SMTP saliente |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | *(vacío)* | Credenciales SMTP |
| `SMTP_AUTH` / `SMTP_STARTTLS` | `false` / `false` | Flags SMTP |
| `SMTP_FROM` | `cslm-noreply@example.com` | Remitente de las notificaciones |
| `JWT_SECRET` | *(valor de dev)* | Clave de firma del JWT — **cambiar en producción** |
| `JWT_EXPIRATION_MINUTES` | `480` | Vigencia del token |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Orígenes permitidos (separados por coma) |
| `NOTIFICATIONS_ENABLED` | `true` | Activa/desactiva el job de notificaciones |
| `NOTIFICATIONS_CRON` | `0 0 7 * * *` | Cron del job diario de vencimientos |

Ningún valor sensible está incrustado en el código ni en la imagen.

## Migraciones y datos de ejemplo

Flyway se ejecuta automáticamente al arrancar. El seed incluye 4 aplicaciones (Corporate Banking,
Mobile Banking, Payments, Treasury), 6 ambientes y certificados/secretos con fechas de expiración
que cubren todos los estados del semáforo (verde / amarillo / naranja / rojo / vencido).

## Tests

```bash
./gradlew test
```

Incluye un test unitario del cálculo de semáforo (`SemaphoreServiceTest`) y un test de
integración `@SpringBootTest` que recorre el flujo de aceptación completo contra una base H2 en
memoria (`CertificateLifecycleIntegrationTest`).

## Docker

```bash
docker build -t cslm-backend .
docker run --rm -p 8080:8080 \
  -e DB_HOST=host.docker.internal -e DB_NAME=cslm \
  -e DB_USERNAME=cslm -e DB_PASSWORD=cslm \
  cslm-backend
```

El `Dockerfile` usa multi-stage (build con `eclipse-temurin:21-jdk-alpine`, runtime con
`21-jre-alpine`) y ejecuta como usuario no root.
