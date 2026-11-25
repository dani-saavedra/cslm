> Apéndice A. Diccionario de datos completo

Este apéndice reproduce, tabla por tabla, la totalidad del esquema relacional de CSLM tal como fue implementado en el script de migración `V1__init_schema.sql` (capítulo 5, sección 5.4), agrupado en los seis dominios funcionales introducidos en la sección 4.4. Todas las tablas utilizan el motor de almacenamiento InnoDB y una clave primaria `id` de tipo `BIGINT AUTO_INCREMENT`, omitida de las filas siguientes para evitar repetición.

### A.1 Seguridad

TABLE|Tabla 12|Estructura de la tabla `roles`
Columna|Tipo|Nulo|Descripción
name|VARCHAR(50)|No|Nombre del rol (ADMIN, OPERATOR, VIEWER); único
description|VARCHAR(255)|Sí|Descripción del alcance del rol
ENDTABLE

TABLE|Tabla 13|Estructura de la tabla `users`
Columna|Tipo|Nulo|Descripción
username|VARCHAR(100)|No|Nombre de usuario; único
password_hash|VARCHAR(255)|No|Contraseña cifrada con bcrypt
email|VARCHAR(255)|No|Correo electrónico; único
full_name|VARCHAR(255)|Sí|Nombre completo
active|BOOLEAN|No|Bandera de cuenta activa/inactiva (por defecto TRUE)
created_at / updated_at|DATETIME|No|Marcas de creación y última actualización, gestionadas automáticamente
ENDTABLE

TABLE|Tabla 14|Estructura de la tabla `user_roles`
Columna|Tipo|Nulo|Descripción
user_id|BIGINT|No|Clave foránea hacia `users`, con borrado en cascada
role_id|BIGINT|No|Clave foránea hacia `roles`, con borrado en cascada
ENDTABLE

*Nota.* `user_roles` es la tabla de asociación muchos-a-muchos entre `users` y `roles`; su clave primaria es el par `(user_id, role_id)`.

### A.2 Organización

TABLE|Tabla 15|Estructura de la tabla `teams`
Columna|Tipo|Nulo|Descripción
name|VARCHAR(150)|No|Nombre del equipo; único
description|VARCHAR(500)|Sí|Descripción del alcance del equipo
active|BOOLEAN|No|Bandera de equipo activo/inactivo
created_at / updated_at|DATETIME|No|Marcas de creación y actualización
ENDTABLE

TABLE|Tabla 16|Estructura de la tabla `environments`
Columna|Tipo|Nulo|Descripción
name|VARCHAR(100)|No|Nombre visible del ambiente (p. ej. "Producción")
code|VARCHAR(50)|No|Código único del ambiente (p. ej. "PRODUCCION")
description|VARCHAR(255)|Sí|Descripción del ambiente
production|BOOLEAN|No|TRUE si el ambiente es productivo; separa producción de no producción (sección 4.4)
sort_order|INT|No|Orden de presentación configurable por un administrador
active|BOOLEAN|No|Bandera de ambiente activo/inactivo
created_at / updated_at|DATETIME|No|Marcas de creación y actualización
ENDTABLE

TABLE|Tabla 17|Estructura de la tabla `applications`
Columna|Tipo|Nulo|Descripción
name|VARCHAR(200)|No|Nombre de la aplicación
code|VARCHAR(50)|No|Código único de la aplicación
description|VARCHAR(1000)|Sí|Descripción de la aplicación
area|VARCHAR(150)|Sí|Área responsable
team_id|BIGINT|Sí|Clave foránea hacia `teams` (SET NULL al eliminar el equipo)
owner|VARCHAR(200)|Sí|Nombre del propietario
owner_email|VARCHAR(255)|Sí|Correo del propietario
criticality|VARCHAR(20)|No|Criticidad (p. ej. CRITICAL, HIGH, MEDIUM); por defecto MEDIUM
status|VARCHAR(20)|No|Estado de la aplicación; por defecto ACTIVE
created_at / updated_at|DATETIME|No|Marcas de creación y actualización
ENDTABLE

### A.3 Catálogos configurables

TABLE|Tabla 18|Estructura de la tabla `asset_types`
Columna|Tipo|Nulo|Descripción
category|VARCHAR(20)|No|CERTIFICATE o SECRET
code|VARCHAR(50)|No|Código del tipo (único junto con `category`)
name|VARCHAR(150)|No|Nombre visible (p. ej. "TLS Server Certificate")
description|VARCHAR(255)|Sí|Descripción del tipo
active|BOOLEAN|No|Bandera de tipo activo/inactivo
ENDTABLE

TABLE|Tabla 19|Estructura de la tabla `location_types`
Columna|Tipo|Nulo|Descripción
code|VARCHAR(50)|No|Código único del tipo de ubicación (p. ej. KUBERNETES, F5, DATABASE)
name|VARCHAR(150)|No|Nombre visible del tipo de ubicación
description|VARCHAR(255)|Sí|Descripción del tipo
active|BOOLEAN|No|Bandera de tipo activo/inactivo
ENDTABLE

TABLE|Tabla 20|Estructura de la tabla `deployment_locations`
Columna|Tipo|Nulo|Descripción
name|VARCHAR(200)|No|Nombre de la ubicación concreta (p. ej. "OCP-PROD-01")
location_type_id|BIGINT|No|Clave foránea hacia `location_types`
cluster|VARCHAR(150)|Sí|Nombre del clúster, cuando aplica
namespace|VARCHAR(150)|Sí|Espacio de nombres, cuando aplica
description|VARCHAR(500)|Sí|Descripción libre de la ubicación
active|BOOLEAN|No|Bandera de ubicación activa/inactiva
created_at / updated_at|DATETIME|No|Marcas de creación y actualización
ENDTABLE

### A.4 Activos

TABLE|Tabla 21|Estructura de la tabla `certificates`
Columna|Tipo|Nulo|Descripción
name|VARCHAR(200)|No|Nombre interno del certificado
alias|VARCHAR(200)|Sí|Alias operativo
certificate_type_id|BIGINT|Sí|Clave foránea hacia `asset_types` (categoría CERTIFICATE)
common_name|VARCHAR(255)|Sí|Common Name (CN) del Subject X.509
subject|VARCHAR(500)|Sí|Nombre distinguido completo del Subject
issuer|VARCHAR(500)|Sí|Nombre distinguido del emisor
serial_number|VARCHAR(255)|Sí|Número de serie del certificado
algorithm|VARCHAR(100)|Sí|Algoritmo de firma (p. ej. RSA, ECDSA)
key_size|INT|Sí|Tamaño de la clave en bits
issue_date|DATE|Sí|Fecha de emisión
expiration_date|DATE|No|Fecha de vencimiento
environment_id|BIGINT|No|Clave foránea hacia `environments`
owner|VARCHAR(200)|Sí|Propietario del certificado
team_id|BIGINT|Sí|Clave foránea hacia `teams` (SET NULL al eliminar el equipo)
contact_email|VARCHAR(255)|Sí|Correo de contacto para notificaciones
notes|VARCHAR(2000)|Sí|Observaciones libres
status|VARCHAR(20)|No|ACTIVE, RENEWED, REVOKED o RETIRED; por defecto ACTIVE
created_at / updated_at|DATETIME|No|Marcas de creación y actualización
ENDTABLE

*Nota.* La tabla `certificates` incluye siete índices adicionales sobre `name`, `alias`, `serial_number`, `common_name`, `owner`, `expiration_date` y `environment_id`, que soportan las búsquedas del requerimiento RF-13 y las consultas del tablero de control.

TABLE|Tabla 22|Estructura de la tabla `secrets`
Columna|Tipo|Nulo|Descripción
name|VARCHAR(200)|No|Nombre interno del secreto
secret_type_id|BIGINT|Sí|Clave foránea hacia `asset_types` (categoría SECRET)
description|VARCHAR(1000)|Sí|Descripción del propósito del secreto
storage_system|VARCHAR(150)|Sí|Sistema de almacenamiento externo (p. ej. "HashiCorp Vault")
secret_reference|VARCHAR(500)|Sí|Referencia opaca al valor real (ruta, ARN o URL); nunca el valor
environment_id|BIGINT|No|Clave foránea hacia `environments`
owner|VARCHAR(200)|Sí|Propietario del secreto
team_id|BIGINT|Sí|Clave foránea hacia `teams` (SET NULL al eliminar el equipo)
contact_email|VARCHAR(255)|Sí|Correo de contacto para notificaciones
expiration_date|DATE|Sí|Fecha de expiración, cuando aplica
status|VARCHAR(20)|No|Estado del secreto; por defecto ACTIVE
notes|VARCHAR(2000)|Sí|Observaciones libres
created_at / updated_at|DATETIME|No|Marcas de creación y actualización
ENDTABLE

### A.5 Inventario (relaciones muchos-a-muchos)

TABLE|Tabla 23|Estructura de la tabla `application_assets`
Columna|Tipo|Nulo|Descripción
application_id|BIGINT|No|Clave foránea hacia `applications`, con borrado en cascada
asset_type|VARCHAR(20)|No|Discriminador: CERTIFICATE o SECRET
asset_id|BIGINT|No|Identificador del certificado o secreto asociado
is_primary|BOOLEAN|No|Indica si la aplicación es la propietaria principal del activo; por defecto TRUE
created_at|DATETIME|No|Marca de creación de la asociación
ENDTABLE

*Nota.* La combinación `(application_id, asset_type, asset_id)` es única, evitando asociaciones duplicadas entre la misma aplicación y el mismo activo.

TABLE|Tabla 24|Estructura de la tabla `asset_deployments`
Columna|Tipo|Nulo|Descripción
asset_type|VARCHAR(20)|No|Discriminador: CERTIFICATE o SECRET
asset_id|BIGINT|No|Identificador del certificado o secreto desplegado
deployment_location_id|BIGINT|No|Clave foránea hacia `deployment_locations`
application_id|BIGINT|Sí|Clave foránea hacia `applications` (SET NULL al eliminar la aplicación)
reference|VARCHAR(255)|Sí|Referencia técnica en el punto de despliegue (p. ej. nombre del secreto de Kubernetes)
notes|VARCHAR(1000)|Sí|Observaciones libres
created_at / updated_at|DATETIME|No|Marcas de creación y actualización
ENDTABLE

### A.6 Operación y trazabilidad

TABLE|Tabla 25|Estructura de la tabla `notification_rules`
Columna|Tipo|Nulo|Descripción
name|VARCHAR(150)|No|Nombre descriptivo de la regla
asset_category|VARCHAR(20)|No|CERTIFICATE, SECRET o ALL; por defecto ALL
days_before|INT|No|Días de anticipación respecto del vencimiento (90, 60, 30, 15, 7, 1 o 0; 0 = día de vencimiento)
enabled|BOOLEAN|No|Bandera de regla activa/inactiva, independiente por regla
created_at / updated_at|DATETIME|No|Marcas de creación y actualización
ENDTABLE

TABLE|Tabla 26|Estructura de la tabla `notification_history`
Columna|Tipo|Nulo|Descripción
asset_type|VARCHAR(20)|No|CERTIFICATE o SECRET
asset_id|BIGINT|No|Identificador del activo notificado
rule_id|BIGINT|Sí|Clave foránea hacia `notification_rules` (SET NULL al eliminar la regla)
recipient|VARCHAR(255)|No|Correo del destinatario
subject|VARCHAR(500)|Sí|Asunto del correo enviado
body|TEXT|Sí|Cuerpo del correo enviado
status|VARCHAR(20)|No|SENT o FAILED
error_message|VARCHAR(1000)|Sí|Mensaje de error, cuando el envío falló
sent_at|DATETIME|No|Marca de tiempo del intento de envío
ENDTABLE

TABLE|Tabla 27|Estructura de la tabla `audit_log`
Columna|Tipo|Nulo|Descripción
username|VARCHAR(100)|No|Usuario que realizó la operación
action|VARCHAR(20)|No|CREATE, UPDATE o DELETE
entity_name|VARCHAR(100)|No|Nombre de la entidad afectada (p. ej. "Certificate")
entity_id|VARCHAR(50)|Sí|Identificador de la entidad afectada
field_name|VARCHAR(100)|Sí|Campo modificado (solo para UPDATE)
old_value|VARCHAR(2000)|Sí|Valor anterior del campo
new_value|VARCHAR(2000)|Sí|Valor nuevo del campo
timestamp|DATETIME|No|Marca de tiempo de la operación
ENDTABLE

TABLE|Tabla 28|Estructura de la tabla `system_settings`
Columna|Tipo|Nulo|Descripción
setting_key|VARCHAR(100)|No|Clave única de configuración (p. ej. "SEMAPHORE_RED_MAX_DAYS")
setting_value|VARCHAR(500)|No|Valor de la configuración, almacenado como texto
description|VARCHAR(500)|Sí|Descripción del propósito de la clave
ENDTABLE

> Apéndice B. Catálogo de endpoints REST

Este apéndice reproduce la totalidad de los endpoints REST implementados en el backend de CSLM, organizados por controlador, con su verbo HTTP, su ruta, la restricción de rol aplicada mediante `@PreAuthorize` (cuando existe; su ausencia indica que el endpoint es accesible a cualquier usuario autenticado, incluyendo VIEWER) y una descripción breve de su propósito, verificados por inspección directa del código fuente de cada controlador.

TABLE|Tabla 29|Catálogo completo de endpoints REST de CSLM
Método|Ruta|Rol requerido|Propósito
POST|/api/auth/login|Público (sin autenticación previa)|Autentica un usuario y emite un token JWT
GET|/api/certificates|Cualquier autenticado|Lista certificados, paginado, filtrable y ordenable
GET|/api/certificates/{id}|Cualquier autenticado|Obtiene el detalle de un certificado
GET|/api/certificates/{id}/dependencies|Cualquier autenticado|Obtiene el grafo de dependencias centrado en el certificado
POST|/api/certificates|ADMIN, OPERATOR|Crea un certificado
PUT|/api/certificates/{id}|ADMIN, OPERATOR|Actualiza un certificado
DELETE|/api/certificates/{id}|ADMIN|Elimina un certificado
GET|/api/secrets|Cualquier autenticado|Lista secretos, paginado, filtrable y ordenable
GET|/api/secrets/{id}|Cualquier autenticado|Obtiene el detalle de un secreto (sin el valor real)
GET|/api/secrets/{id}/dependencies|Cualquier autenticado|Obtiene el grafo de dependencias centrado en el secreto
POST|/api/secrets|ADMIN, OPERATOR|Crea un secreto (metadato)
PUT|/api/secrets/{id}|ADMIN, OPERATOR|Actualiza un secreto
DELETE|/api/secrets/{id}|ADMIN|Elimina un secreto
GET|/api/applications|Cualquier autenticado|Lista aplicaciones
GET|/api/applications/{id}|Cualquier autenticado|Obtiene el detalle de una aplicación
GET|/api/applications/{id}/assets|Cualquier autenticado|Obtiene los activos de la aplicación agrupados por ambiente
GET|/api/applications/{id}/graph|Cualquier autenticado|Obtiene el grafo de dependencias centrado en la aplicación
POST|/api/applications|ADMIN, OPERATOR|Crea una aplicación
PUT|/api/applications/{id}|ADMIN, OPERATOR|Actualiza una aplicación
DELETE|/api/applications/{id}|ADMIN|Elimina una aplicación
GET|/api/environments|Cualquier autenticado|Lista ambientes ordenados
GET|/api/environments/{id}|Cualquier autenticado|Obtiene el detalle de un ambiente
POST|/api/environments|ADMIN|Crea un ambiente
PUT|/api/environments/{id}|ADMIN|Actualiza un ambiente
DELETE|/api/environments/{id}|ADMIN|Elimina un ambiente
POST|/api/application-assets|ADMIN, OPERATOR|Asocia un activo a una aplicación
DELETE|/api/application-assets/{id}|ADMIN, OPERATOR|Elimina una asociación activo–aplicación
GET|/api/asset-deployments|Cualquier autenticado|Lista las ubicaciones de despliegue de un activo
POST|/api/asset-deployments|ADMIN, OPERATOR|Registra el despliegue de un activo en una ubicación
DELETE|/api/asset-deployments/{id}|ADMIN, OPERATOR|Elimina un registro de despliegue
GET|/api/deployment-locations|Cualquier autenticado|Lista ubicaciones de despliegue configuradas
GET|/api/deployment-locations/{id}|Cualquier autenticado|Obtiene el detalle de una ubicación
POST|/api/deployment-locations|ADMIN, OPERATOR|Crea una ubicación de despliegue
PUT|/api/deployment-locations/{id}|ADMIN, OPERATOR|Actualiza una ubicación de despliegue
DELETE|/api/deployment-locations/{id}|ADMIN|Elimina una ubicación de despliegue
GET|/api/notifications|Cualquier autenticado|Consulta el historial de notificaciones enviadas
POST|/api/notifications/test|ADMIN, OPERATOR|Envía una notificación de prueba para un activo
GET|/api/notifications/rules|Cualquier autenticado|Lista las reglas de notificación configuradas
POST|/api/notifications/rules|ADMIN|Crea una regla de notificación
PUT|/api/notifications/rules/{id}|ADMIN|Actualiza una regla de notificación
DELETE|/api/notifications/rules/{id}|ADMIN|Elimina una regla de notificación
GET|/api/teams|Cualquier autenticado|Lista equipos responsables
GET|/api/teams/{id}|Cualquier autenticado|Obtiene el detalle de un equipo
POST|/api/teams|ADMIN|Crea un equipo
PUT|/api/teams/{id}|ADMIN|Actualiza un equipo
DELETE|/api/teams/{id}|ADMIN|Elimina un equipo
GET|/api/admin/asset-types|Cualquier autenticado|Lista tipos de certificado/secreto
POST|/api/admin/asset-types|ADMIN|Crea un tipo de activo
PUT|/api/admin/asset-types/{id}|ADMIN|Actualiza un tipo de activo
DELETE|/api/admin/asset-types/{id}|ADMIN|Elimina un tipo de activo
GET|/api/admin/location-types|Cualquier autenticado|Lista tipos de ubicación de despliegue
POST|/api/admin/location-types|ADMIN|Crea un tipo de ubicación
PUT|/api/admin/location-types/{id}|ADMIN|Actualiza un tipo de ubicación
DELETE|/api/admin/location-types/{id}|ADMIN|Elimina un tipo de ubicación
GET|/api/admin/settings|Cualquier autenticado|Lista los parámetros de configuración del sistema (incluye umbrales del semáforo)
PUT|/api/admin/settings/{key}|ADMIN|Actualiza el valor de un parámetro de configuración
GET|/api/admin/users|ADMIN|Lista usuarios
POST|/api/admin/users|ADMIN|Crea un usuario
PUT|/api/admin/users/{id}|ADMIN|Actualiza un usuario (datos, roles o estado)
DELETE|/api/admin/users/{id}|ADMIN|Elimina un usuario
GET|/api/audit-log|ADMIN|Consulta el historial de auditoría, filtrable por entidad e identificador
GET|/api/dashboard/summary|Cualquier autenticado|Obtiene los totales y el semáforo agregado del tablero de control
GET|/api/dashboard/expiring|Cualquier autenticado|Obtiene la tabla de próximos vencimientos, ordenable y filtrable
ENDTABLE

> Apéndice C. Variables de entorno de configuración

TABLE|Tabla 30|Variables de entorno utilizadas por CSLM
Variable|Componente|Valor por defecto (desarrollo)|Propósito
MYSQL_ROOT_PASSWORD|MySQL|rootpass|Contraseña del usuario root de MySQL (solo para inicialización del contenedor)
DB_NAME|Backend / MySQL|cslm|Nombre de la base de datos
DB_USERNAME|Backend / MySQL|cslm|Usuario de conexión a la base de datos
DB_PASSWORD|Backend / MySQL|cslm|Contraseña de conexión a la base de datos
DB_HOST|Backend|mysql (en Docker Compose) / localhost|Host del servidor de base de datos
DB_PORT|Backend|3306|Puerto del servidor de base de datos
SERVER_PORT|Backend|8080|Puerto HTTP del backend
SMTP_HOST|Backend|mailhog (en Docker Compose) / localhost|Host del servidor SMTP
SMTP_PORT|Backend|1025|Puerto del servidor SMTP
SMTP_USERNAME|Backend|(vacío)|Usuario de autenticación SMTP, si el servidor lo requiere
SMTP_PASSWORD|Backend|(vacío)|Contraseña de autenticación SMTP, si el servidor lo requiere
SMTP_AUTH|Backend|false|Habilita autenticación SMTP
SMTP_STARTTLS|Backend|false|Habilita STARTTLS en la conexión SMTP
SMTP_FROM|Backend|cslm-noreply@example.com|Dirección remitente de los correos de notificación
JWT_SECRET|Backend|(clave de ejemplo; debe sobrescribirse en producción)|Clave simétrica de firma de los tokens JWT
JWT_EXPIRATION_MINUTES|Backend|480|Tiempo de vigencia del token JWT, en minutos
CORS_ALLOWED_ORIGINS|Backend|http://localhost:5173,http://localhost:8081|Orígenes autorizados a consumir la API desde un navegador
NOTIFICATIONS_ENABLED|Backend|true|Habilita o deshabilita el proceso programado de notificaciones
NOTIFICATIONS_CRON|Backend|0 0 7 * * * (07:00 diario)|Expresión cron del proceso programado de notificaciones
ENDTABLE

*Nota.* Elaboración propia a partir de `.env.example` y `docker-compose.yml`. Ninguno de los valores por defecto listados corresponde a una credencial válida para un entorno productivo; todos deben sobrescribirse explícitamente antes de un despliegue fuera del entorno de desarrollo local, tal como se describe en la sección 4.2 (requerimiento no funcional de seguridad de credenciales).

> Apéndice D. Guía de instalación y ejecución

Este apéndice resume los pasos necesarios para ejecutar CSLM de manera local, reproduciendo el procedimiento documentado en el archivo `README.md` del repositorio del proyecto.

**Requisito previo.** Tener instalado Docker y Docker Compose (o, alternativamente, Java 21 y Node.js 20 o superior para una ejecución sin contenedores, junto con una instancia de MySQL 8 accesible).

**Ejecución mediante Docker Compose (recomendada).**

1. Copiar el archivo `.env.example` a `.env` y, opcionalmente, ajustar sus valores (los valores por defecto son suficientes para una demostración local, según lo descrito en el apéndice C).
2. Ejecutar `docker compose up --build` desde la raíz del repositorio. Este comando construye las imágenes del backend y del frontend, descarga las imágenes oficiales de MySQL 8.0 y MailHog, y levanta los cuatro servicios descritos en la sección 5.7.
3. Esperar a que el backend reporte que las migraciones de Flyway se aplicaron correctamente y que el servidor quedó escuchando en el puerto 8080; el frontend queda disponible inmediatamente después.
4. Acceder a las siguientes direcciones: frontend en `http://localhost:8081`; documentación interactiva de la API (Swagger UI) en `http://localhost:8080/swagger-ui.html`; interfaz de inspección de correo (MailHog) en `http://localhost:8025`; y, si se requiere acceso directo, el servidor MySQL en `localhost:3306`.
5. Iniciar sesión con alguno de los tres usuarios de demostración cargados por Flyway: `admin` / `Admin123!` (rol ADMIN), `operator` / `Operator123!` (rol OPERATOR) o `viewer` / `Viewer123!` (rol VIEWER).

**Ejecución sin Docker (backend).** Con Java 21 y una instancia de MySQL 8 accesible, ejecutar desde el directorio `backend/`: `DB_HOST=localhost DB_NAME=cslm DB_USERNAME=cslm DB_PASSWORD=cslm ./gradlew bootRun`.

**Ejecución sin Docker (frontend).** Con Node.js 20 o superior, ejecutar desde el directorio `frontend/`: `npm install` seguido de `npm run dev`; el servidor de desarrollo de Vite expone la aplicación y redirige (*proxy*) las peticiones a `/api` hacia `http://localhost:8080` por defecto.

**Ejecución de las pruebas automatizadas.** Desde el directorio `backend/`, ejecutar `./gradlew test`, que ejecuta tanto las pruebas unitarias (`SemaphoreServiceTest`) como la prueba de integración de extremo a extremo (`CertificateLifecycleIntegrationTest`), esta última contra una base de datos H2 en memoria, sin requerir una instancia de MySQL disponible durante la ejecución de las pruebas.

> Apéndice E. Flujo de aceptación validado, paso a paso

Este apéndice reproduce, en formato de tabla, la ejecución del flujo de aceptación de dieciocho pasos definido en la especificación del proyecto y descrito metodológicamente en la sección 3.5, indicando para cada paso la pantalla del frontend o el endpoint de la API involucrado y el mecanismo mediante el cual fue verificado en este trabajo (ejecución manual, prueba automatizada, o ambas).

TABLE|Tabla 31|Flujo de aceptación de extremo a extremo y su verificación
Paso|Acción|Pantalla / endpoint|Verificación
1|Crear aplicación|Applications → «Nueva aplicación» / `POST /api/applications`|Manual y automatizada
2|Crear ambiente de Producción|Environments → «Nuevo ambiente» (o reutilizar el ambiente «Producción» sembrado por Flyway) / `POST /api/environments`|Manual y automatizada
3|Registrar certificado|Certificates → «Nuevo certificado» / `POST /api/certificates`|Manual y automatizada
4|Asociarlo a la aplicación|Incluido en el formulario de creación del certificado (`applicationIds`) / `POST /api/application-assets`|Manual y automatizada
5|Asociarlo al ambiente|Incluido en el formulario de creación del certificado (`environmentId`)|Manual y automatizada
6|Registrar dónde está desplegado|Panel de despliegues del detalle del certificado / `POST /api/asset-deployments`|Manual
7|Consultarlo desde Certificates|Certificates (listado)|Manual
8|Ver su fecha de expiración|Certificate Detail / `GET /api/certificates/{id}`|Manual y automatizada
9|Ver su semáforo|Certificate Detail (`SemaphoreChip`) / campo `semaphoreStatus`|Manual y automatizada
10|Abrir el grafo|Certificate Detail → «Ver dependencias» / `GET /api/certificates/{id}/dependencies`|Manual y automatizada
11|Ver Application → Certificate|Graph (React Flow)|Manual y automatizada
12|Abrir la aplicación|Application Detail|Manual
13|Ver Application → Certificates + Secrets|Application Detail (agrupado por ambiente) / `GET /api/applications/{id}/assets`|Manual y automatizada
14|Modificar la fecha de expiración|Certificate Detail → editar / `PUT /api/certificates/{id}`|Manual y automatizada
15|Registrar auditoría|(automático al modificar) / `GET /api/audit-log?entityName=Certificate&entityId={id}`|Manual y automatizada
16|Ejecutar proceso de notificación|Certificate Detail → «Enviar notificación de prueba» (o espera del proceso programado diario) / `POST /api/notifications/test`|Manual y automatizada
17|Enviar correo al propietario|Interfaz de inspección MailHog (`http://localhost:8025`)|Manual
18|Registrar el envío en Notification History|Notifications (historial) / `GET /api/notifications`|Manual y automatizada
ENDTABLE

*Nota.* Los pasos marcados como verificados de forma «Manual y automatizada» están cubiertos, de manera conjunta, por la prueba de integración `CertificateLifecycleIntegrationTest` descrita en la sección 6.3; los pasos marcados únicamente como «Manual» corresponden a interacciones de interfaz de usuario (navegación visual, inspección del correo recibido) que no forman parte de la aserción programática de dicha prueba, pero fueron verificados mediante el recorrido manual descrito en la sección 6.4.
