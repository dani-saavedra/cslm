> Capítulo 6. Pruebas y validación

Este capítulo documenta la fase de evaluación del modelo DSRM (sección 3.2) aplicada a CSLM: la estrategia de pruebas adoptada, las pruebas unitarias y de integración implementadas, la validación manual del flujo de aceptación completo y los resultados obtenidos al ejecutar dicha estrategia sobre la implementación descrita en el capítulo 5.

## 6.1 Estrategia de pruebas

Se adoptó una estrategia de pruebas de dos niveles, deliberadamente concentrada en los dos puntos de mayor riesgo funcional de la plataforma en lugar de perseguir una cobertura exhaustiva de cada línea de código, criterio consistente con la recomendación de priorizar la verificación automatizada de los criterios de aceptación de negocio por encima de la cobertura como métrica en sí misma (Sommerville, 2015; Pressman & Maxim, 2019). El primer nivel corresponde a **pruebas unitarias** sobre la lógica de dominio más sensible a errores de límite —el cálculo del estado del semáforo de vencimientos (sección 4.7)—, ejecutadas con JUnit 5, AssertJ para las aserciones y Mockito para simular el repositorio de configuración, sin levantar el contexto de Spring ni una base de datos real. El segundo nivel corresponde a una **prueba de integración de extremo a extremo**, ejecutada con `@SpringBootTest` sobre un contexto completo de Spring Boot y una base de datos H2 en memoria (configurada automáticamente por Spring Boot para pruebas cuando no se dispone de una instancia de MySQL), que reproduce, paso por paso, el flujo de aceptación de dieciocho pasos definido en la especificación del proyecto (sección 3.5) realizando peticiones HTTP reales contra la API mediante `TestRestTemplate`, exactamente como lo haría el frontend.

Ambos niveles se ejecutan mediante el mismo comando (`./gradlew test`) como parte del ciclo de construcción del backend, y ambos fueron ejecutados de manera efectiva, sobre el código final del proyecto, como parte de la elaboración de este capítulo.

## 6.2 Pruebas unitarias

La clase `SemaphoreServiceTest` verifica, mediante seis casos de prueba independientes, que `SemaphoreService` clasifica correctamente una fecha de expiración en cada uno de los cinco estados posibles y que los umbrales son efectivamente configurables en tiempo de ejecución. La tabla 9 resume cada caso.

TABLE|Tabla 9|Casos de prueba unitarios de `SemaphoreServiceTest`
Caso|Escenario|Entrada (días restantes)|Resultado esperado
greenWhenMoreThanNinetyDays|Umbrales por defecto, activo muy lejos de vencer|227 días|GREEN
yellowBetween31And90Days|Umbrales por defecto, activo en el rango amarillo|76 días|YELLOW
orangeBetween8And30Days|Umbrales por defecto, activo en el rango naranja|15 días|ORANGE
redBetween0And7Days|Umbrales por defecto, activo en el rango rojo|5 días|RED
expiredWhenPastDate|Fecha de expiración ya transcurrida|-16 días (16 días vencido)|EXPIRED
thresholdsAreConfigurable|Umbral rojo personalizado a 14 días (en lugar de 7); un valor que con los umbrales por defecto sería ORANGE|10 días, con `SEMAPHORE_RED_MAX_DAYS=14`|RED
ENDTABLE

El último caso —`thresholdsAreConfigurable`— es, desde la perspectiva de la validación de requisitos, el más relevante de los seis: no solo verifica que el cálculo aritmético del estado sea correcto, sino que confirma, de manera automatizada, uno de los requisitos no funcionales más citados en la especificación del proyecto ("estos valores deben poder configurarse posteriormente desde administración"): al simular un umbral rojo de 14 días en lugar del valor por defecto de 7, un activo con 10 días restantes —que con la configuración por defecto se clasificaría como naranja— pasa a clasificarse como rojo, demostrando que el servicio lee efectivamente la configuración en tiempo de ejecución y no aplica umbrales fijos codificados en el propio código de clasificación.

## 6.3 Pruebas de integración

La clase `CertificateLifecycleIntegrationTest` reproduce, en un único método de prueba (`fullLifecycleFlow`), el flujo de aceptación completo de dieciocho pasos definido en la sección 3.5, ejecutando peticiones HTTP autenticadas contra una instancia real del backend levantada en un puerto aleatorio (`@SpringBootTest(webEnvironment = RANDOM_PORT)`). La prueba: (1) autentica un usuario con rol ADMIN creado específicamente para la prueba; (2) crea una aplicación mediante `POST /api/applications`; (3) crea un ambiente mediante `POST /api/environments`; (4) registra un certificado con una fecha de expiración a quince días desde la fecha de ejecución, asociado directamente a la aplicación creada mediante el campo `applicationIds` del payload de creación; (5) verifica, sobre la propia respuesta de creación, que el certificado quedó asociado a exactamente una aplicación y que su `semaphoreStatus` calculado es `ORANGE` —el estado esperado para un activo a quince días de vencer, de acuerdo con los umbrales por defecto de la tabla 7—; (6) consulta el certificado recién creado y confirma que sus días restantes (`daysRemaining`) son exactamente quince; (7) abre el grafo de dependencias del certificado (`GET /api/certificates/{id}/dependencies`) y confirma que contiene un nodo de tipo `APPLICATION`; (8) consulta los activos de la aplicación agrupados por ambiente (`GET /api/applications/{id}/assets`) y confirma que existe exactamente un grupo de ambiente; (9) modifica la fecha de expiración del certificado, extendiéndola a doscientos días desde la fecha de ejecución, y confirma que el `semaphoreStatus` recalculado pasa a `GREEN`; (10) consulta el registro de auditoría filtrado por la entidad y el identificador del certificado (`GET /api/audit-log?entityName=Certificate&entityId={id}`) y confirma que existe una entrada cuyo `fieldName` es `expirationDate`, verificando de forma automatizada que el cambio de fecha quedó auditado; y (11) dispara una notificación de prueba (`POST /api/notifications/test`) y confirma que el historial de notificaciones (`GET /api/notifications`) contiene una entrada asociada al identificador del certificado.

Esta prueba, por su diseño, no verifica un componente aislado sino la **integración correcta de siete subsistemas distintos** —aplicaciones, ambientes, certificados, el cálculo del semáforo, el grafo de dependencias, la auditoría y las notificaciones— operando en conjunto exactamente como lo haría la plataforma en uso real, lo que la convierte en la evidencia automatizada más directa de que el criterio de aceptación definido en la especificación del proyecto (sección 3.5) se cumple.

## 6.4 Validación del flujo de aceptación

Además de la prueba de integración automatizada descrita en la sección anterior, el flujo de aceptación completo de dieciocho pasos fue ejecutado manualmente sobre la plataforma desplegada mediante Docker Compose, con el conjunto de datos de ejemplo descrito en la sección 5.8, siguiendo exactamente la secuencia de acciones que un usuario administrador realizaría a través del frontend: inicio de sesión, creación de una aplicación, creación (o reutilización) de un ambiente de producción, registro de un certificado, verificación de sus asociaciones, registro de su ubicación de despliegue, consulta desde el listado de certificados, verificación de su fecha de expiración y de su semáforo, apertura del grafo de dependencias en ambas direcciones (certificado → aplicación y aplicación → certificados/secretos), modificación de la fecha de expiración, verificación de la auditoría correspondiente y, finalmente, ejecución de una notificación de prueba con verificación de su llegada a través de la interfaz de inspección de MailHog y de su registro en el historial de notificaciones. El detalle completo de esta ejecución manual, paso por paso, con el endpoint o la pantalla involucrada en cada uno, se documenta en el apéndice E.

## 6.5 Resultados obtenidos

La ejecución de la totalidad de la suite de pruebas automatizadas del backend (`./gradlew test`), sobre el código final del proyecto, produjo el resultado resumido en la tabla 10: siete pruebas ejecutadas, siete exitosas, cero fallidas y cero con error, con un tiempo de ejecución combinado de las clases de prueba inferior a un segundo.

TABLE|Tabla 10|Resultado de la ejecución de la suite de pruebas automatizadas
Clase de prueba|Tipo|Casos|Exitosos|Fallidos|Tiempo de ejecución
SemaphoreServiceTest|Unitaria|6|6|0|0.016 s
CertificateLifecycleIntegrationTest|Integración (`@SpringBootTest`, H2 en memoria)|1|1|0|0.864 s
Total|—|7|7|0|0.880 s
ENDTABLE

Estos resultados, junto con la ejecución manual documentada en el apéndice E, permiten afirmar que la plataforma satisface el criterio de aceptación funcional definido en la sección 3.5: los dieciocho pasos del flujo de extremo a extremo se ejecutan correctamente tanto de forma manual, a través de la interfaz web, como de forma automatizada, a través de la API REST subyacente, sin intervención de datos ni de configuración adicional más allá de la provista por el conjunto de datos de ejemplo. La discusión de estos resultados en relación con cada uno de los objetivos específicos del proyecto se desarrolla en el capítulo 7.
