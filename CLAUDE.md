# CSLM — Certificate & Secret Lifecycle Manager

> Especificación funcional y técnica para implementar CSLM con Claude Code.
> Usa este documento como fuente principal de requisitos. Antes de generar código,
> analiza la arquitectura, identifica decisiones importantes y documenta cualquier
> supuesto necesario.

CSLM — Certificate & Secret Lifecycle Manager

Quiero construir una aplicación empresarial llamada CSLM (Certificate & Secret Lifecycle Manager).

El objetivo de CSLM es centralizar el inventario y gestionar el ciclo de vida de certificados digitales y secretos utilizados por las aplicaciones de una organización grande.

La plataforma debe permitir saber:

Qué certificados y secretos existen.

A qué aplicación pertenecen.

Quién es el propietario o responsable.

En qué ambientes están utilizados.

Dónde están desplegados.

Cuándo vencen.

Cuál es su estado de riesgo.

A quién se deben enviar las notificaciones.

Qué aplicaciones dependen de un certificado o secreto.

Qué certificados y secretos utiliza una determinada aplicación.

Qué certificados/secretos están próximos a vencer.

Mantener separación entre ambientes como Desarrollo, Pruebas, QA, Producción, etc.

Tener trazabilidad y auditoría de los cambios.

## 1. Stack tecnológico

Construir la solución utilizando:

### Backend

Java 21

Spring Boot 3.x

Spring Web / REST API

Spring Data JPA

Hibernate

Bean Validation

Spring Security

Maven o Gradle

Arquitectura limpia/modular, evitando un monolito desordenado.

API REST documentada con OpenAPI / Swagger.

### Base de datos

Utilizar:

MySQL 8.x

JPA/Hibernate

Migraciones mediante Flyway o Liquibase.

La base de datos debe estar correctamente normalizada y preparada para crecimiento empresarial.

### Frontend

Utilizar:

React

TypeScript

Vite

Una librería UI sencilla como Material UI

React Router

Axios o equivalente para consumir las APIs.

El frontend inicialmente debe ser sencillo, limpio y funcional. No es necesario construir un diseño extremadamente sofisticado.

### Infraestructura

Preparar:

Dockerfile para backend.

Dockerfile para frontend.

docker-compose para ejecutar localmente:

### Backend

### Frontend

MySQL

Utilizar variables de entorno para configuraciones sensibles.

## 2. Concepto principal

CSLM debe manejar dos tipos principales de activos:

### Certificate

Representa un certificado digital.

Debe almacenar información como:

ID

Nombre

Alias

Tipo

Common Name (CN)

Subject

Issuer

Serial Number

Algoritmo

Tamaño de clave

Fecha de emisión

Fecha de vencimiento

Días restantes

Estado

Propietario

Equipo responsable

Correo de contacto

Aplicación

Ambiente

Ubicación donde está desplegado

Observaciones

Fecha de creación

Fecha de actualización

### Secret

Representa un secreto utilizado por una aplicación.

CSLM debe administrar únicamente el metadato del secreto, por ejemplo:

ID

Nombre

Tipo de secreto

Descripción

Sistema donde está almacenado

Identificador/referencia del secreto

Aplicación

Ambiente

Propietario

Equipo responsable

Correo de contacto

Fecha de creación

Fecha de expiración, si aplica

Estado

Observaciones

El valor real del secreto debe permanecer en un Secret Manager/Vault externo.

Diseñar la arquitectura para que posteriormente pueda integrarse con soluciones como HashiCorp Vault, Azure Key Vault, AWS Secrets Manager u otros sistemas equivalentes.

## 3. Aplicaciones

Crear una entidad Application.

Una aplicación debe contener como mínimo:

ID

Nombre

Código

Descripción

Área responsable

Equipo responsable

Owner

Correo del owner

Criticidad

Estado

Fecha de creación

Fecha de actualización

Una aplicación puede tener múltiples:

certificados

secretos

Y un certificado/secreto puede estar asociado a una o varias aplicaciones si el modelo lo requiere.

Evitar diseñar el modelo pensando únicamente en una relación 1:1.

## 4. Ambientes

Crear una entidad Environment.

Debe permitir configurar ambientes como:

DEVELOPMENT

TEST

QA

STAGING

PRODUCTION

DR

Pero NO deben estar hardcodeados.

El administrador debe poder crear, modificar, activar/desactivar y ordenar ambientes.

Cada certificado y secreto debe poder asociarse a un ambiente.

Ejemplo:

Application: Corporate Banking

DEVELOPMENT

├── certificado A

└── secreto A

QA

├── certificado B

└── secreto B

PRODUCTION

├── certificado C

├── certificado D

└── secreto C

El ambiente debe ser una dimensión fundamental del modelo.

## 5. Ubicación / Deployment

Crear una entidad que permita registrar dónde está utilizado el certificado o secreto.

Por ejemplo:

### Application

↓

Environment

↓

Deployment / Location

↓

Certificate / Secret

Una ubicación podría representar:

Kubernetes

OpenShift

VM

Load Balancer

F5

HAProxy

API Gateway

Application Server

Database

Cloud service

Otro

Debe existir una entidad configurable DeploymentLocation o equivalente.

Ejemplo:

Certificate:

corporate-api-prod

Application:

Corporate Banking

Environment:

PRODUCTION

Location:

OpenShift

Cluster:

OCP-PROD-01

Namespace:

corporate-banking

Secret/Config reference:

tls-corporate-api

No asumir que todos los certificados estarán en Kubernetes.

## 6. Relaciones

El modelo debe permitir representar dependencias.

Ejemplo:

### Certificate

↓

### Application

↓

Environment

↓

Deployment Location

↓

Infrastructure

Y también:

### Application

↓

Certificate A

Certificate B

Certificate C

Secret A

Secret B

Debe ser posible navegar en ambas direcciones.

## 7. Vista tipo grafo

Una de las funcionalidades principales de CSLM debe ser una vista gráfica de dependencias.

Utilizar React y una librería adecuada para grafos, por ejemplo:

React Flow

Cytoscape

D3.js

La tecnología puede ser seleccionada por la IA dependiendo de cuál resulte más adecuada.

Caso 1 — Desde un certificado

El usuario selecciona:

certificate-prod-api

Debe poder visualizar:

┌───────────────┐

│  Certificate  │

│ prod-api.crt  │

└───────┬───────┘

│

┌──────────┴─────────┐

↓                    ↓

┌─────────────┐      ┌─────────────┐

│ Application │      │ Application │

│ Corporate   │      │ Payments    │

│ Banking     │      │             │

└──────┬──────┘      └─────────────┘

│

↓

┌─────────────┐

│ Production  │

└──────┬──────┘

↓

┌─────────────┐

│ OpenShift   │

└─────────────┘

Al hacer clic en cada nodo se debe mostrar información detallada.

## 8. Vista invertida

Debe existir la operación inversa.

El usuario selecciona una aplicación:

Corporate Banking

Y CSLM debe mostrar:

Corporate Banking

│

├── PRODUCTION

│      ├── Certificate A

│      ├── Certificate B

│      └── Secret A

│

├── QA

│      ├── Certificate C

│      └── Secret B

│

└── DEVELOPMENT

└── Secret C

La vista debe permitir filtrar por:

Ambiente

Tipo de activo

Estado

Criticidad

Próximo vencimiento

## 9. Semáforo de vencimientos

Implementar un sistema de semáforo para certificados y secretos.

El estado debe calcularse automáticamente utilizando la fecha de expiración.

Configurarlo de manera parametrizable.

Por defecto:

🟢 Verde

Más de 90 días para vencer.

🟡 Amarillo

Entre 31 y 90 días.

🟠 Naranja

Entre 8 y 30 días.

🔴 Rojo

7 días o menos.

⚫ Vencido

Fecha de vencimiento menor que la fecha actual.

Estos valores deben poder configurarse posteriormente desde administración.

Ejemplo:

Certificate              Expiration       Days       Status

api-prod                 2027-04-20       227        🟢

payments-prod            2026-11-20        76        🟡

mobile-prod              2026-09-20        15        🟠

corporate-prod            2026-09-10         5        🔴

legacy-prod               2026-08-20       -16        ⚫

## 10. Dashboard

Crear un dashboard principal.

Debe mostrar como mínimo:

Resumen

Total de certificados

Total de secretos

Total de aplicaciones

Total de ambientes

Certificados próximos a vencer

Secretos próximos a vencer

Certificados vencidos

Secretos vencidos

Semáforo

Mostrar gráficamente:

🟢 OK

🟡 Próximo

🟠 Atención

🔴 Crítico

⚫ Vencido

Próximos vencimientos

Mostrar una tabla:

Activo | Tipo | Aplicación | Ambiente | Owner | Vencimiento | Días | Estado

Debe poder ordenarse y filtrarse.

## 11. Notificaciones por correo

Implementar integración para envío de correo electrónico.

Utilizar Spring Mail.

La configuración SMTP debe manejarse mediante variables de entorno:

SMTP_HOST

SMTP_PORT

SMTP_USERNAME

SMTP_PASSWORD

SMTP_FROM

Nunca colocar credenciales directamente en el código.

Crear un servicio:

NotificationService

que permita enviar notificaciones.

Debe existir un sistema configurable de alertas.

Ejemplo:

90 días antes

60 días antes

30 días antes

15 días antes

7 días antes

1 día antes

Vencimiento

No enviar necesariamente todos los correos por defecto; diseñar el sistema para que estos umbrales puedan configurarse.

El correo debe incluir:

Nombre del certificado/secreto

Aplicación

Ambiente

Owner

Fecha de vencimiento

Días restantes

Estado

Ubicación

Acción recomendada

## 12. Administración

Crear un módulo de administración para:

Ambientes

Tipos de certificado

Tipos de secreto

Tipos de ubicación

Umbrales de vencimiento

Configuración de notificaciones

Usuarios

Roles

Aplicaciones

Equipos responsables

## 13. Seguridad

Implementar autenticación y autorización.

Utilizar Spring Security.

Definir inicialmente roles:

### ADMIN

### OPERATOR

### VIEWER

Ejemplo:

### ADMIN

Puede:

Crear

Editar

Eliminar

Configurar

Administrar usuarios

Administrar ambientes

### OPERATOR

Puede:

Crear certificados

Crear secretos/metadatos

Actualizar información

Consultar

Gestionar relaciones

### VIEWER

Solo puede consultar.

Diseñar la arquitectura para posteriormente integrar SSO/OAuth2/OIDC.

## 14. Auditoría

Toda operación importante debe quedar auditada.

Registrar:

Usuario

Fecha/hora

Acción

Entidad

ID de entidad

Valor anterior, cuando corresponda

Valor nuevo, cuando corresponda

Ejemplo:

2026-09-05 10:35

Usuario: jsmith

Action: UPDATE

Entity: Certificate

ID: 182

Field: expirationDate

Old: 2026-10-10

New: 2027-10-10

## 15. API REST

Crear APIs REST bien estructuradas.

Ejemplos:

GET    /api/certificates

GET    /api/certificates/{id}

POST   /api/certificates

PUT    /api/certificates/{id}

DELETE /api/certificates/{id}

GET    /api/secrets

GET    /api/secrets/{id}

POST   /api/secrets

PUT    /api/secrets/{id}

DELETE /api/secrets/{id}

GET    /api/applications

GET    /api/applications/{id}

GET    /api/environments

GET    /api/certificates/{id}/dependencies

GET    /api/secrets/{id}/dependencies

GET    /api/applications/{id}/assets

GET    /api/applications/{id}/graph

GET    /api/dashboard/summary

GET    /api/dashboard/expiring

GET    /api/notifications

POST   /api/notifications/test

Utilizar DTOs y no exponer directamente las entidades JPA.

Implementar paginación, filtros y ordenamiento.

## 16. Búsqueda

El usuario debe poder buscar por:

Nombre

Alias

Serial Number

CN

Aplicación

Owner

Correo

Ambiente

Tipo

Estado

Ubicación

Ejemplo:

Buscar:

"corporate"

Resultados:

certificate-corporate-prod

certificate-corporate-qa

secret-corporate-api

## 17. Diseño de base de datos

Diseñar un modelo relacional adecuado.

Como mínimo considerar entidades:

users

roles

applications

environments

certificates

secrets

asset_types

deployment_locations

application_assets

asset_deployments

notification_rules

notification_history

audit_log

No asumir que esta lista es definitiva.

La IA debe analizar las relaciones y proponer un modelo normalizado.

Generar:

Diagrama entidad-relación.

Modelo lógico.

Scripts de migración Flyway/Liquibase.

Índices necesarios.

Constraints.

Foreign keys.

Índices para búsquedas frecuentes.

## 18. Datos de ejemplo

Crear datos iniciales para poder probar la aplicación.

Por ejemplo:

Applications

Corporate Banking

Mobile Banking

Payments

Treasury

Ambientes:

Development

QA

Staging

Production

DR

Crear varios certificados y secretos con diferentes fechas de expiración para demostrar los diferentes estados del semáforo.

Crear relaciones entre ellos.

## 19. Frontend

Crear las siguientes pantallas:

## 1. Login

Pantalla sencilla.

## 2. Dashboard

Vista general de la situación.

## 3. Certificates

Listado de certificados con:

Nombre

Aplicación

Ambiente

Owner

Expiración

Días restantes

Semáforo

## 4. Certificate Detail

Mostrar toda la información.

Incluir botón:

"Ver dependencias"

que abra el grafo.

## 5. Secrets

Listado equivalente.

## 6. Secret Detail

Información del secreto y sus relaciones.

Nunca mostrar el valor real del secreto.

## 7. Applications

Listado de aplicaciones.

## 8. Application Detail

Mostrar:

### Application

↓

Environments

↓

Certificates

Secrets

Deployments

Incluir vista gráfica.

## 9. Environments

CRUD de ambientes.

## 10. Notifications

Histórico de correos enviados.

## 11. Administration

Configuraciones generales.

## 22. Jobs programados

Implementar un proceso programado que diariamente:

Consulte certificados y secretos próximos a vencer.

Calcule su estado.

Identifique los activos que requieren notificación.

Envíe los correos correspondientes.

Registre el envío.

Evite enviar duplicados innecesarios.

Utilizar Spring Scheduler inicialmente.

Diseñar el código para que posteriormente pueda migrarse a un mecanismo distribuido si la plataforma escala horizontalmente.

## 25. Entregables esperados

Generar el proyecto completo y funcional.

Entregar:

Arquitectura general.

Diagrama de arquitectura.

Diagrama ER.

Estructura del proyecto.

Código completo del backend.

Código completo del frontend.

Scripts de base de datos.

Datos iniciales.

APIs REST.

Swagger/OpenAPI.

Dockerfiles.

docker-compose.

Configuración mediante variables de entorno.

README con instrucciones para ejecutar.

Pruebas unitarias.

Pruebas de integración para los principales servicios.

Ejemplos de requests/responses.

Configuración de envío de correo.

Implementación del semáforo.

Implementación del grafo de dependencias.

## 26. Criterios de aceptación

La solución se considera funcional cuando pueda realizarse este flujo completo:

## 1. Crear aplicación

↓

## 2. Crear ambiente Production

↓

## 3. Registrar certificado

↓

## 4. Asociarlo a la aplicación

↓

## 5. Asociarlo al ambiente

↓

## 6. Registrar dónde está desplegado

↓

## 7. Consultarlo desde Certificates

↓

## 8. Ver su fecha de expiración

↓

## 9. Ver su semáforo

↓

## 10. Abrir el grafo

↓

## 11. Ver Application → Certificate

↓

## 12. Abrir Application

↓

## 13. Ver Application → Certificates + Secrets

↓

## 14. Modificar la fecha de expiración

↓

## 15. Registrar auditoría

↓

## 16. Ejecutar proceso de notificación

↓

## 17. Enviar correo al Owner

↓

## 18. Registrar el envío en Notification History

La solución debe ser ejecutable localmente mediante Docker Compose, tener datos de prueba y permitir recorrer todo este flujo sin necesidad de implementar infraestructura externa.

Antes de generar el código, analiza los requerimientos, identifica inconsistencias o decisiones arquitectónicas importantes y presenta brevemente la arquitectura propuesta. Después genera la implementación siguiendo esa arquitectura.
