> Capítulo 4. Análisis y diseño del sistema

Este capítulo documenta la fase de diseño y desarrollo del modelo DSRM (sección 3.2) aplicada a CSLM. Se presentan, en orden de dependencia, los requerimientos funcionales y no funcionales derivados de la especificación del proyecto, la arquitectura general del sistema, el modelo de dominio y el diagrama entidad-relación, el diseño de la API REST, el diseño de seguridad, el diseño del semáforo de vencimientos, del grafo de dependencias, del sistema de notificaciones y, finalmente, el diseño del frontend.

## 4.1 Requerimientos funcionales

A partir del análisis de la especificación del proyecto se derivaron catorce grupos de requerimientos funcionales, resumidos en la tabla 3. Cada grupo fue trazado hacia al menos un objetivo específico de la sección 1.4 y hacia al menos un componente identificable de la implementación descrita en el capítulo 5.

TABLE|Tabla 3|Requerimientos funcionales de CSLM
Grupo|Descripción|Componente de implementación
RF-01 Gestión de aplicaciones|CRUD de aplicaciones con código único, área, equipo, propietario, criticidad y estado|`Application`, `ApplicationController`, `ApplicationService`
RF-02 Gestión de ambientes|CRUD de ambientes configurables, no hardcodeados, con orden de presentación y bandera de ambiente productivo|`Environment`, `EnvironmentController`
RF-03 Gestión de certificados|CRUD de certificados con atributos X.509 (CN, subject, issuer, serial, algoritmo, tamaño de clave, fechas)|`Certificate`, `CertificateController`, `CertificateService`
RF-04 Gestión de secretos|CRUD de metadatos de secretos, sin almacenar el valor real|`Secret`, `SecretController`, `SecretService`
RF-05 Asociación activo–aplicación|Relación muchos-a-muchos entre aplicaciones y activos (certificados/secretos)|`ApplicationAsset`, `ApplicationAssetController`
RF-06 Registro de ubicación de despliegue|Catálogo configurable de tipos de ubicación y registro de dónde está desplegado cada activo|`DeploymentLocation`, `AssetDeployment`
RF-07 Semáforo de vencimientos|Cálculo automático de un estado de riesgo a partir de la fecha de expiración, con umbrales configurables|`SemaphoreService`, `SystemSetting`
RF-08 Vista de grafo de dependencias|Visualización navegable en ambos sentidos (activo → aplicación → ambiente → ubicación, y aplicación → ambiente → activos)|`GraphService`, `GraphPage`, `GraphView`
RF-09 Tablero de control|Resumen agregado de totales, semáforo y próximos vencimientos|`DashboardService`, `DashboardController`, `DashboardPage`
RF-10 Notificaciones por correo|Reglas de umbral configurables, envío automático diario y bajo demanda, registro de historial|`NotificationRule`, `NotificationService`, `NotificationHistory`, `ExpirationNotificationJob`
RF-11 Administración de catálogos|CRUD de equipos, tipos de activo, tipos de ubicación y umbrales del semáforo|`CatalogService`, `TeamService`, `SystemSettingService`
RF-12 Gestión de usuarios y roles|CRUD de usuarios, asignación de roles (ADMIN, OPERATOR, VIEWER)|`User`, `Role`, `UserService`, `UserController`
RF-13 Búsqueda y filtrado|Búsqueda por nombre, alias, número de serie, CN, aplicación, propietario, correo, ambiente, tipo, estado y ubicación, con paginación y ordenamiento|Parámetros de consulta en los controladores de `Certificate` y `Secret`
RF-14 Auditoría de cambios|Registro de usuario, acción, entidad, campo, valor anterior y valor nuevo en cada creación, actualización o eliminación de las entidades principales|`AuditLog`, `AuditService`, `AuditLogController`
ENDTABLE

## 4.2 Requerimientos no funcionales

Los requerimientos no funcionales, resumidos en la tabla 4, se derivaron tanto de la especificación del proyecto (por ejemplo, el uso de variables de entorno para toda configuración sensible) como de las normas reseñadas en el capítulo 2 (separación de metadato y valor, verificación de seguridad de aplicaciones).

TABLE|Tabla 4|Requerimientos no funcionales de CSLM
Atributo|Descripción|Mecanismo de verificación
Seguridad de credenciales|Ninguna contraseña, secreto SMTP o llave de firma de token debe estar codificada de forma fija en el código fuente|Variables de entorno (`DB_PASSWORD`, `SMTP_PASSWORD`, `JWT_SECRET`, etc.); inspección de código fuente
Control de acceso basado en roles|Toda operación de escritura debe estar restringida según el rol del usuario autenticado (ADMIN, OPERATOR, VIEWER)|Anotaciones `@PreAuthorize` a nivel de método en cada controlador (tabla 6)
Separación de metadato y valor de secretos|CSLM no debe almacenar ni transmitir el valor real de un secreto en ningún momento|Ausencia de un campo de valor en la entidad `Secret`; solo `storageSystem` y `secretReference`
Trazabilidad|Toda creación, actualización o eliminación sobre las entidades principales debe quedar registrada de forma inmutable|`AuditService`, tabla `audit_log`, prueba de integración dedicada
No exposición de entidades de persistencia|La API REST no debe serializar directamente las entidades JPA|Capa de DTO (`dto`) independiente de la capa de dominio (`domain`)
Configurabilidad|Ambientes, tipos de activo, tipos de ubicación y umbrales del semáforo deben ser administrables sin cambios de código|Tablas de catálogo (`environments`, `asset_types`, `location_types`) y `system_settings`
Portabilidad y reproducibilidad|La plataforma completa debe poder ejecutarse en un entorno local sin infraestructura externa|`docker-compose.yml` con cuatro servicios (MySQL, MailHog, backend, frontend)
Extensibilidad hacia SSO/OIDC|El mecanismo de autenticación debe poder sustituirse sin alterar el modelo de autorización|Separación entre emisión de token (`AuthService`, `JwtUtil`) y verificación de roles (`@PreAuthorize`)
Documentación de la API|Todo endpoint debe estar documentado de forma autodescriptiva y explorable|Especificación OpenAPI generada en tiempo de ejecución (`springdoc-openapi`), expuesta en `/swagger-ui.html`
Usabilidad básica|El frontend debe permitir completar el flujo de aceptación sin necesidad de consultar la API directamente|Recorrido manual documentado en el apéndice E
ENDTABLE

## 4.3 Arquitectura general del sistema

CSLM se diseñó como una aplicación web de tres niveles (frontend, backend, base de datos), acompañada de un cuarto componente de infraestructura —un servidor SMTP— necesario para materializar el requisito de notificaciones. La figura 1 presenta la arquitectura general del sistema y el flujo de comunicación entre sus componentes.

FIGURE|Figura 1|Arquitectura general de CSLM|architecture.png|Elaboración propia. El frontend se comunica con el backend exclusivamente mediante peticiones HTTPS/JSON autenticadas con un token JWT portado en la cabecera `Authorization`; el backend es el único componente con acceso directo a la base de datos MySQL y al servidor SMTP.

El **frontend** es una aplicación de página única construida con React 18, TypeScript y Vite, que utiliza Material UI como librería de componentes visuales y React Router para la navegación entre pantallas. En producción se sirve como archivos estáticos a través de un contenedor Nginx; en desarrollo, el servidor de Vite expone un *proxy* hacia el backend para evitar problemas de origen cruzado (CORS) durante el desarrollo local. El frontend nunca accede directamente a la base de datos ni al servidor SMTP: toda operación se realiza a través de la API REST del backend.

El **backend** es una aplicación Java 21 construida sobre Spring Boot 3, organizada internamente siguiendo un patrón de **paquete por función** (*package by feature*) dentro de una arquitectura por capas: `domain` (entidades JPA), `repository` (interfaces Spring Data JPA), `service` (lógica de negocio), `controller` (adaptadores REST), `dto` (contratos de entrada y salida de la API), `security` (autenticación JWT y filtros), `audit` (registro de auditoría transversal), `scheduler` (proceso programado de notificaciones), `config` (configuración de seguridad y de OpenAPI) y `exception` (manejo centralizado de errores). Esta organización por función, en lugar de una organización por capa técnica a nivel de la raíz del proyecto, facilita ubicar todo el código relacionado con un mismo concepto de negocio —por ejemplo, certificados— sin sacrificar la separación de responsabilidades dentro de cada paquete.

La **base de datos** es MySQL 8.x, con el esquema y los datos de ejemplo gestionados íntegramente mediante migraciones versionadas de Flyway (`V1__init_schema.sql` para la estructura, `V2__seed_data.sql` para los datos de demostración), de modo que el esquema de la base de datos nunca se modifica manualmente y cada cambio queda registrado en el historial de migraciones.

El **servidor SMTP** es, en el entorno de desarrollo y en la demostración de este trabajo, MailHog, una herramienta de código abierto que intercepta el correo saliente y lo expone en una interfaz web de inspección sin enviarlo realmente a un destinatario externo; en un entorno productivo, las mismas variables de entorno (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`) permiten apuntar el backend a cualquier servidor SMTP corporativo sin cambios de código.

## 4.4 Modelo de dominio y diagrama entidad-relación

El modelo de dominio de CSLM se estructura en cinco grupos de entidades: seguridad, organización, catálogos configurables, activos e inventario, y trazabilidad/operación. La figura 2 presenta el diagrama entidad-relación simplificado del esquema, y la tabla 5 describe el propósito de cada una de las diecisiete tablas que lo componen.

FIGURE|Figura 2|Diagrama entidad-relación simplificado de CSLM|er_diagram.png|Elaboración propia a partir del script de migración `V1__init_schema.sql`. Las líneas representan claves foráneas; `application_assets` y `asset_deployments` son tablas de asociación que vinculan, mediante un discriminador `asset_type`, tanto a `certificates` como a `secrets` sin duplicar columnas entre ambas entidades.

TABLE|Tabla 5|Catálogo de entidades del modelo de datos de CSLM
Tabla|Grupo|Propósito
roles|Seguridad|Catálogo de roles del sistema (ADMIN, OPERATOR, VIEWER)
users|Seguridad|Cuentas de usuario con contraseña cifrada (bcrypt) y estado activo/inactivo
user_roles|Seguridad|Asociación muchos-a-muchos entre usuarios y roles
teams|Organización|Equipos responsables, asociables a aplicaciones y a activos
environments|Organización|Ambientes configurables y ordenables, con bandera de ambiente productivo
applications|Organización|Aplicaciones de negocio, con área, equipo, propietario, correo y criticidad
asset_types|Catálogo|Tipos de certificado o de secreto, agrupados por categoría (CERTIFICATE / SECRET)
location_types|Catálogo|Tipos de ubicación de despliegue (Kubernetes, OpenShift, VM, F5, HAProxy, API Gateway, Application Server, Database, Cloud Service, Other)
deployment_locations|Catálogo|Instancias concretas de ubicación (por ejemplo, un clúster o un balanceador específico)
certificates|Activo|Inventario de certificados digitales, con atributos X.509 y ciclo de vida
secrets|Activo|Inventario de metadatos de secretos, sin el valor real
application_assets|Inventario (N:M)|Asociación entre aplicaciones y activos (certificado o secreto)
asset_deployments|Inventario (N:M)|Asociación entre un activo, una ubicación de despliegue y, opcionalmente, la aplicación que lo consume en ese punto
notification_rules|Operación|Reglas de umbral de notificación (días antes del vencimiento), activables/desactivables de forma independiente
notification_history|Operación|Historial de cada notificación enviada, con su estado (SENT/FAILED)
audit_log|Trazabilidad|Registro inmutable de creación, actualización y eliminación sobre las entidades principales
system_settings|Configuración|Pares clave-valor administrables, entre ellos los umbrales del semáforo
ENDTABLE

Tres decisiones de modelado merecen explicación adicional porque materializan directamente principios discutidos en el capítulo 2. La primera es la relación **muchos-a-muchos** entre `applications` y los activos (`application_assets`), que permite que un mismo certificado —el caso típico es un certificado de API compartido, como se ilustra en los datos de ejemplo del capítulo 6— esté asociado a más de una aplicación, y que una aplicación tenga múltiples certificados y secretos simultáneamente, evitando el supuesto de una relación 1:1 que la especificación del proyecto señala explícitamente como un error de diseño a evitar. La segunda es que `certificates` y `secrets` **no comparten una tabla física** —a diferencia de un diseño que hubiera modelado un único "activo" genérico con un discriminador de tipo—, sino que son tablas independientes con sus propios atributos específicos (un secreto no tiene número de serie ni algoritmo de firma; un certificado no tiene sistema de almacenamiento externo), y las tablas de asociación (`application_assets`, `asset_deployments`) resuelven la referencia polimórfica mediante un par `(asset_type, asset_id)` en lugar de una clave foránea física hacia dos tablas distintas, lo que evita la complejidad de una jerarquía de herencia a nivel de base de datos manteniendo, al mismo tiempo, un único punto de asociación reutilizable para ambos tipos de activo. La tercera es que `deployment_locations` referencia a `location_types` como catálogo configurable, en lugar de restringir sus valores mediante una enumeración fija en el código, de modo que un administrador pueda añadir un nuevo tipo de ubicación (por ejemplo, un nuevo tipo de balanceador) sin requerir un cambio de código ni un nuevo despliegue del backend.

El esquema incluye, además, dieciocho índices explícitos sobre las columnas más consultadas —nombre, alias, número de serie, *common name*, propietario y fecha de expiración de certificados y secretos; código de ambiente; entidad y marca de tiempo de auditoría— diseñados para soportar de manera eficiente tanto las búsquedas de texto descritas en el requerimiento RF-13 como las consultas del tablero de control (RF-09), que deben poder filtrar rápidamente los activos próximos a vencer sobre un volumen de datos que, en una organización grande, puede alcanzar varios miles de certificados y secretos activos simultáneamente.

## 4.5 Diseño de la API REST

La API de CSLM sigue un estilo REST orientado a recursos (Fielding, 2000), organizada en catorce grupos de endpoints que corresponden, de manera directa, a los catorce grupos de requerimientos funcionales de la tabla 3 (`/api/certificates`, `/api/secrets`, `/api/applications`, `/api/environments`, `/api/application-assets`, `/api/asset-deployments`, `/api/deployment-locations`, `/api/notifications`, `/api/teams`, `/api/admin/asset-types`, `/api/admin/location-types`, `/api/admin/settings`, `/api/admin/users`, `/api/audit-log`, `/api/dashboard` y `/api/auth`). El catálogo completo de los más de cincuenta endpoints implementados, con su verbo HTTP, su restricción de rol y su propósito, se reproduce íntegramente en el apéndice B; esta sección describe las convenciones transversales que rigen a todos ellos.

Cada recurso principal (certificados, secretos, aplicaciones, ambientes, ubicaciones de despliegue) expone un endpoint de listado (`GET`) que admite paginación mediante los parámetros estándar de Spring Data (`page`, `size`, `sort`), filtrado por los campos relevantes de cada entidad (ambiente, aplicación, estado, texto de búsqueda libre) y, para certificados y secretos, un endpoint adicional `GET /{id}/dependencies` que retorna la estructura de grafo utilizada por la vista de dependencias (sección 4.8). Todas las operaciones de escritura (`POST`, `PUT`, `DELETE`) están protegidas mediante la anotación `@PreAuthorize` de Spring Security, aplicada a nivel de método de controlador, con la matriz de permisos descrita en la sección 4.6.

Ningún controlador serializa directamente una entidad JPA: cada operación recibe y retorna objetos de transferencia de datos definidos en el paquete `dto` (por ejemplo, `CertificateDtos`, que agrupa el DTO de creación, el de actualización y el de respuesta como clases anidadas del mismo archivo, siguiendo una convención de organización por agregado en lugar de un archivo por clase). Esta separación cumple dos propósitos: evita que un cambio en el modelo de persistencia rompa el contrato público de la API, y evita que campos internos —por ejemplo, la relación completa hacia otras entidades— se serialicen de forma no intencional generando ciclos o sobre-exposición de datos.

La validación de las peticiones de entrada se realiza mediante *Bean Validation* (anotaciones como `@NotNull`, `@NotBlank`, `@Email`, `@Size` en los DTO de entrada), y los errores de validación, junto con las excepciones de negocio (`ResourceNotFoundException`, `BadRequestException`), son interceptados de forma centralizada por un `GlobalExceptionHandler` (`@RestControllerAdvice`) que traduce cada tipo de error a un código de estado HTTP apropiado (404 para recurso no encontrado, 400 para error de validación o de negocio, 401/403 para errores de autenticación y autorización) y a un cuerpo de respuesta JSON con una estructura de error consistente en toda la API.

Toda la API queda documentada de forma automática mediante `springdoc-openapi`, que genera la especificación OpenAPI 3 a partir de las anotaciones de los controladores y los DTO, y la expone tanto en formato JSON/YAML como en una interfaz interactiva Swagger UI accesible en `/swagger-ui.html`, lo que permite explorar y probar cada endpoint —incluyendo la autenticación mediante token JWT— sin necesidad de un cliente HTTP externo.

## 4.6 Diseño de seguridad

CSLM implementa autenticación mediante **JSON Web Tokens** (RFC 7519; Jones et al., 2015): el endpoint `POST /api/auth/login` recibe un usuario y una contraseña, los valida contra el hash bcrypt almacenado en la tabla `users` mediante un `CustomUserDetailsService` y, si son correctos, emite un token firmado que codifica la identidad del usuario y sus roles, con un tiempo de expiración configurable mediante la variable de entorno `JWT_EXPIRATION_MINUTES` (480 minutos, es decir, ocho horas, por defecto). Cada petición posterior debe portar el token en la cabecera `Authorization: Bearer <token>`; un filtro (`JwtAuthFilter`), instalado en la cadena de filtros de Spring Security antes del filtro estándar de autenticación por usuario y contraseña, valida la firma y la vigencia del token en cada petición y, de ser válido, establece el contexto de seguridad de Spring con la identidad y los roles del usuario, sin necesidad de mantener estado de sesión en el servidor.

La autorización se implementa mediante control de acceso basado en roles (RBAC), con tres roles definidos en la especificación del proyecto: **ADMIN**, **OPERATOR** y **VIEWER**. La tabla 6 resume la matriz de permisos efectivamente implementada mediante anotaciones `@PreAuthorize` en cada controlador, verificada por inspección directa del código fuente.

TABLE|Tabla 6|Matriz de permisos por rol en CSLM
Operación|ADMIN|OPERATOR|VIEWER
Consultar certificados, secretos, aplicaciones, ambientes, ubicaciones, tablero y notificaciones|Sí|Sí|Sí
Crear o actualizar certificados, secretos, ubicaciones de despliegue y asociaciones activo–aplicación/activo–ubicación|Sí|Sí|No
Eliminar certificados o secretos|Sí|No|No
Crear, actualizar o eliminar aplicaciones|Sí|Sí (crear/actualizar)|No
Enviar una notificación de prueba|Sí|Sí|No
Crear, actualizar o eliminar ambientes, equipos, tipos de activo, tipos de ubicación, reglas de notificación y umbrales del semáforo|Sí|No|No
Gestionar usuarios y roles|Sí|No|No
Consultar el historial de auditoría (`/api/audit-log`)|Sí|No|No
ENDTABLE

Esta matriz materializa el principio de menor privilegio descrito en el estándar ASVS de OWASP (OWASP Foundation, 2021): el rol VIEWER no tiene, bajo ninguna circunstancia, acceso de escritura; el rol OPERATOR puede operar el inventario del día a día (crear y actualizar certificados, secretos y sus relaciones) pero no puede eliminar activos ni modificar la configuración estructural de la plataforma (ambientes, catálogos, umbrales, usuarios); y únicamente el rol ADMIN concentra las operaciones destructivas y de configuración global, incluyendo el acceso al registro de auditoría, de modo que la propia consulta de quién hizo qué es, a su vez, una operación privilegiada.

Otras decisiones de seguridad relevantes son: (a) las contraseñas de usuario nunca se almacenan en texto plano, sino como hash bcrypt generado con un factor de costo estándar; (b) la configuración de orígenes permitidos para CORS (`CORS_ALLOWED_ORIGINS`) es explícita y parametrizable por entorno, en lugar de permitir cualquier origen; (c) ninguna credencial —contraseña de base de datos, credenciales SMTP, llave de firma JWT— está codificada de forma fija en el código fuente ni en las imágenes de contenedor, sino que se inyecta mediante variables de entorno en tiempo de despliegue (apéndice C); y (d) la arquitectura separa deliberadamente la **emisión de identidad** (`AuthService`, `JwtUtil`) de la **verificación de autorización** (`@PreAuthorize` sobre roles ya presentes en el token), de modo que una futura integración con un proveedor de identidad externo mediante SSO/OAuth2/OIDC solo requeriría sustituir el mecanismo que emite el token —o adaptarlo para validar tokens emitidos por un proveedor externo— sin modificar ninguna de las reglas de autorización descritas en la tabla 6.

## 4.7 Diseño del semáforo de vencimientos

El semáforo de vencimientos es el mecanismo mediante el cual CSLM traduce una fecha de expiración —un dato que, por sí solo, no comunica urgencia— en una categoría de riesgo accionable. El diseño adoptado, resumido en la figura 3 y en la tabla 7, replica los cinco estados propuestos en la especificación del proyecto (verde, amarillo, naranja, rojo, vencido) pero, a diferencia de una implementación que codificara los umbrales como constantes, los almacena en la tabla `system_settings` bajo tres claves (`SEMAPHORE_RED_MAX_DAYS`, `SEMAPHORE_ORANGE_MAX_DAYS`, `SEMAPHORE_YELLOW_MAX_DAYS`), administrables por un usuario con rol ADMIN sin requerir un nuevo despliegue del backend.

FIGURE|Figura 3|Estados del semáforo de vencimientos y sus umbrales por defecto|semaphore.png|Elaboración propia a partir de la lógica implementada en `SemaphoreService`. Los umbrales son valores por defecto administrables desde el módulo de administración.

TABLE|Tabla 7|Umbrales por defecto del semáforo de vencimientos
Estado|Condición (días restantes)|Clave de configuración|Valor por defecto
Verde|días > 90|SEMAPHORE_YELLOW_MAX_DAYS (límite superior del rango amarillo)|90
Amarillo|31 ≤ días ≤ 90|SEMAPHORE_YELLOW_MAX_DAYS|90
Naranja|8 ≤ días ≤ 30|SEMAPHORE_ORANGE_MAX_DAYS|30
Rojo|1 ≤ días ≤ 7|SEMAPHORE_RED_MAX_DAYS|7
Vencido|días < 0 (incluye el día 0 como el último día verde de vigencia y cualquier fecha pasada como vencida)|No aplica (se deriva de la comparación directa con la fecha actual)|No aplica
ENDTABLE

La lógica de cálculo, encapsulada en el servicio `SemaphoreService`, opera en dos pasos: primero calcula los días restantes como la diferencia, en días completos, entre la fecha actual y la fecha de expiración del activo (`ChronoUnit.DAYS.between`); después clasifica ese número de días comparándolo, en orden ascendente de severidad, contra los tres umbrales configurados, con un valor de reserva (7, 30 y 90 días, respectivamente) si la clave correspondiente no ha sido definida aún en `system_settings`, de modo que la plataforma nunca queda sin un criterio de clasificación válido. Un activo cuya fecha de expiración ya pasó —diferencia negativa de días— se clasifica siempre como **vencido**, independientemente de los tres umbrales configurables, porque ese estado no admite una zona gris de configuración: o el activo sigue vigente, o ya no lo está.

Este mismo servicio es reutilizado, sin duplicación de lógica, por tres subsistemas distintos: el listado y el detalle de certificados y secretos (para mostrar el color correspondiente en cada fila), el tablero de control (para agregar el conteo de activos por estado, sección 4.9) y el proceso programado de notificaciones (para determinar, junto con las reglas de umbral configuradas, cuándo corresponde enviar un correo). Centralizar el cálculo en un único servicio garantiza que los tres subsistemas sean siempre consistentes entre sí: un certificado que el tablero muestra en rojo nunca puede aparecer en verde en su propio listado.

## 4.8 Diseño del grafo de dependencias

El grafo de dependencias es la funcionalidad que materializa, de forma visual y navegable, las relaciones muchos-a-muchos descritas en la sección 4.4. CSLM implementa dos direcciones de navegación sobre la misma estructura subyacente de datos, ambas servidas por un único servicio de dominio, `GraphService`, que construye una respuesta de nodos y aristas (`GraphDtos`) consumida por el frontend.

FIGURE|Figura 4|Ejemplo de grafo de dependencias en ambas direcciones|dependency_graph.png|Elaboración propia. Izquierda: vista centrada en un certificado (`GET /api/certificates/{id}/dependencies`). Derecha: vista centrada en una aplicación (`GET /api/applications/{id}/graph`), agrupada por ambiente.

En la **vista centrada en un activo** (`GET /api/certificates/{id}/dependencies` y su equivalente para secretos), el nodo raíz es el certificado o secreto seleccionado; sus aristas de primer nivel lo conectan con cada aplicación a la que está asociado mediante `application_assets` —lo que permite representar, de forma directa, el caso de un certificado compartido entre más de una aplicación, como el certificado `api-prod` de los datos de ejemplo, asociado simultáneamente a las aplicaciones "Corporate Banking" y "Payments"—; desde cada aplicación, una segunda arista la conecta con el ambiente del activo; y desde el ambiente, una tercera arista lo conecta con cada ubicación de despliegue registrada en `asset_deployments` para ese activo. En la **vista centrada en una aplicación** (`GET /api/applications/{id}/graph`), el nodo raíz es la aplicación; sus aristas de primer nivel la conectan con cada ambiente en el que tiene al menos un activo asociado; y, desde cada ambiente, una segunda arista la conecta con cada certificado o secreto de la aplicación que pertenece a ese ambiente —reproduciendo la estructura jerárquica de tres niveles (aplicación, ambiente, activo) descrita en la especificación del proyecto—.

Para la representación visual en el navegador se seleccionó **React Flow**, una librería de código abierto especializada en la construcción de diagramas de nodos y aristas interactivos en React, sobre alternativas como Cytoscape.js o D3.js, por tres razones prácticas: primero, su modelo de datos (arreglos de nodos y aristas con posición, tipo y datos asociados) se corresponde de manera casi directa con la estructura ya producida por `GraphService`, minimizando la transformación necesaria en el cliente; segundo, provee de manera nativa las interacciones esperadas por el requerimiento de la especificación —paneo, zoom y clic sobre un nodo para mostrar información detallada— sin necesidad de implementarlas manualmente, como sí sería necesario con D3.js; y tercero, se integra de forma más directa con el modelo de componentes de React que Cytoscape.js, que expone una API imperativa pensada originalmente para JavaScript no reactivo. Al hacer clic sobre cualquier nodo del grafo, el frontend despliega un panel lateral con los atributos relevantes del elemento seleccionado —para un certificado, su semáforo, su fecha de expiración y su propietario; para una aplicación, su criticidad y su equipo responsable—, cumpliendo el requisito de que cada nodo del grafo sea, en sí mismo, una puerta de entrada a información detallada.

## 4.9 Diseño del sistema de notificaciones

El sistema de notificaciones combina tres elementos: un catálogo de **reglas de umbral** configurables (`notification_rules`), un **servicio de envío** desacoplado del mecanismo que decide cuándo enviar (`NotificationService`, construido sobre Spring Mail), y un **proceso programado diario** (`ExpirationNotificationJob`) que aplica las reglas activas sobre el inventario completo de certificados y secretos vigentes. La figura 5 ilustra el flujo completo, desde la ejecución programada hasta el registro del envío.

FIGURE|Figura 5|Flujo del proceso diario de notificación de vencimientos|notification_flow.png|Elaboración propia a partir de `ExpirationNotificationJob` y `NotificationService`. El proceso se ejecuta una vez al día (07:00 por defecto, configurable mediante `NOTIFICATIONS_CRON`) y puede además ser invocado bajo demanda desde la interfaz («enviar notificación de prueba»).

Cada regla de notificación define una combinación de categoría de activo (certificado, secreto o ambas), un número de días de anticipación (`daysBefore`, con valores típicos de 90, 60, 30, 15, 7, 1 y 0, donde 0 representa el propio día de vencimiento) y una bandera de habilitación independiente. En los datos de ejemplo de CSLM se cargan las siete reglas típicas descritas en la especificación, pero solo tres de ellas —30, 7 y 1 día antes del vencimiento— están habilitadas por defecto, de modo que el sistema no envía, sin configuración explícita de un administrador, la totalidad de los siete correos por activo, en línea con el requisito explícito de la especificación de que "no enviar necesariamente todos los correos por defecto" y de que los umbrales deban ser configurables desde administración.

El proceso programado, implementado mediante la anotación `@Scheduled` de Spring y ejecutado por defecto todos los días a las 07:00 (`NOTIFICATIONS_CRON=0 0 7 * * *`, configurable mediante variable de entorno), recorre cada certificado y secreto activo, calcula sus días restantes mediante `SemaphoreService`, y determina si ese número de días coincide exactamente con el `daysBefore` de alguna regla habilitada para su categoría de activo. Si existe coincidencia, el proceso construye un correo con la plantilla descrita en la especificación —nombre del activo, aplicación, ambiente, propietario, fecha de vencimiento, días restantes, estado del semáforo, ubicación de despliegue y una acción recomendada, redactada según la severidad del estado— y lo envía mediante Spring Mail al correo de contacto del activo. Antes de enviar, el proceso consulta `notification_history` para verificar que no exista ya un registro exitoso para la combinación exacta de activo, regla y día de ejecución, lo que evita el envío de notificaciones duplicadas si el proceso se ejecutara más de una vez el mismo día —por ejemplo, tras un reinicio del backend— sin necesidad de un mecanismo de bloqueo distribuido adicional. Cada intento de envío, exitoso o fallido, se registra en `notification_history` con su estado (`SENT` o `FAILED`) y, en caso de fallo, el mensaje de error correspondiente, de modo que un fallo transitorio del servidor SMTP quede documentado y sea auditable sin interrumpir el procesamiento del resto de los activos evaluados ese día.

Este diseño —una comparación exacta de días restantes contra un catálogo de reglas, con deduplicación explícita por combinación de activo, regla y día— fue adoptado, en lugar de un cálculo de rango (por ejemplo, "enviar si faltan 30 días o menos"), precisamente para que cada regla se dispare una única vez por activo durante todo su ciclo de vida, evitando tanto el silencio (no enviar nunca) como el ruido (enviar todos los días mientras el activo permanezca por debajo de un umbral). El mismo mecanismo de deduplicación es, además, la propiedad que hace segura una futura migración de este proceso hacia un planificador distribuido: como la verificación de "ya enviado" se apoya en una consulta a base de datos y no en el estado en memoria de un único proceso, dos instancias del backend ejecutando el mismo proceso el mismo día no producirían un envío duplicado.

## 4.10 Diseño del frontend

El frontend implementa las doce pantallas requeridas por la especificación del proyecto, organizadas alrededor de un layout común con navegación lateral, un contexto de autenticación (`AuthContext`) que mantiene el token JWT y los roles del usuario en memoria y en almacenamiento local del navegador, y una capa de acceso a la API (`api/`) basada en Axios, con un interceptor que adjunta automáticamente el token a cada petición y redirige al login si el backend responde con un error de autenticación. La tabla 8 resume el propósito de cada pantalla y su trazabilidad hacia los requerimientos funcionales de la tabla 3.

TABLE|Tabla 8|Pantallas del frontend de CSLM
Pantalla|Componente|Propósito|Requerimiento relacionado
Login|`LoginPage`|Autenticación de usuario y obtención del token JWT|Seguridad (sección 4.6)
Dashboard|`DashboardPage`|Resumen de totales, semáforo agregado y próximos vencimientos|RF-09
Certificates|`CertificatesPage`|Listado, búsqueda, filtro y creación rápida de certificados|RF-03, RF-13
Certificate Detail|`CertificateDetailPage`|Detalle completo de un certificado, sus despliegues y acceso al grafo de dependencias|RF-03, RF-06, RF-08
Secrets|`SecretsPage`|Listado equivalente para secretos, sin exponer el valor real|RF-04, RF-13
Secret Detail|`SecretDetailPage`|Detalle del secreto y sus relaciones|RF-04, RF-06
Applications|`ApplicationsPage`|Listado de aplicaciones|RF-01
Application Detail|`ApplicationDetailPage`|Activos agrupados por ambiente y vista de grafo centrada en la aplicación|RF-01, RF-05, RF-08
Environments|`EnvironmentsPage`|CRUD de ambientes|RF-02
Graph|`GraphPage`|Vista de grafo independiente, reutilizada desde el detalle de certificado, secreto y aplicación|RF-08
Notifications|`NotificationsPage`|Historial de correos enviados y prueba manual de envío|RF-10
Administration|`AdministrationPage`|Equipos, tipos de activo, tipos de ubicación, ubicaciones de despliegue, reglas de notificación, umbrales del semáforo y usuarios|RF-11, RF-12
ENDTABLE

Los formularios de creación y edición de las entidades más complejas —certificado, secreto y aplicación— se implementan como diálogos modales reutilizables (`CertificateFormDialog`, `SecretFormDialog`, `ApplicationFormDialog`) invocados tanto desde el listado como desde la pantalla de detalle correspondiente, evitando la duplicación de la lógica de validación de formulario entre ambos puntos de entrada. El estado del semáforo se representa de manera consistente en toda la aplicación mediante un componente compartido (`SemaphoreChip`) y una función de utilidad (`semaphore.ts`) que traduce el estado devuelto por el backend al color y al texto correspondientes, garantizando —de forma análoga a la centralización del cálculo en `SemaphoreService` del lado del backend— que el mismo activo se muestre siempre con el mismo color en cualquier pantalla donde aparezca.
