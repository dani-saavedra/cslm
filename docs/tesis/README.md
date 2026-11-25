# Tesis de maestría — CSLM

Documento de tesis de maestría, en formato APA 7.ª edición, que documenta el diseño e
implementación de CSLM a partir del código y la especificación de este mismo repositorio.

- **Archivo final:** [`CSLM_Tesis_Maestria.docx`](./CSLM_Tesis_Maestria.docx) — ábrelo con
  Microsoft Word (o LibreOffice/Google Docs, con fidelidad algo menor en los campos).
- **~21 800 palabras** de contenido (8 capítulos + referencias + 5 apéndices), 31 tablas y 5
  figuras, generado íntegramente a partir de los datos reales del proyecto (esquema de base de
  datos, controladores REST, pruebas, `docker-compose.yml`, etc.).

## Antes de presentarlo

1. **Completa los datos institucionales** de la portada: nombre del autor, universidad, facultad,
   programa, asesor y ciudad. Están marcados entre corchetes (`[Nombre de la universidad]`, etc.)
   tanto en la portada como en una nota al pie de esta.
2. **Actualiza los campos de Word al abrir el archivo.** El documento incluye campos nativos de
   Word (numeración de página, numeración automática de tablas/figuras vía `SEQ`, y las tres
   tablas de contenido: capítulos, lista de tablas y lista de figuras). Word normalmente los
   recalcula solo al abrir; si no lo hace, selecciona todo el documento (Ctrl/Cmd+A) y pulsa F9
   ("Actualizar campos"), o clic derecho sobre cada tabla de contenido → "Actualizar campo".
3. Revisa la paginación resultante (Word decide los saltos de línea reales) y ajusta si tu
   universidad exige numeración romana en las páginas preliminares u otro formato de portada
   específico de la institución — lo aquí generado sigue el formato de trabajo profesional de las
   normas APA 7 (numeración arábiga continua desde la portada, encabezado con título abreviado).

## Regenerar el documento

Si editas el contenido (carpeta `build/content/*.md`) o los diagramas (`build/gen_figures.py`),
puedes reconstruir el `.docx` con Python 3.11+ y dos dependencias:

```bash
cd docs/tesis/build
python3 -m venv .venv && source .venv/bin/activate
pip install python-docx Pillow
python gen_figures.py      # regenera las 5 figuras en ../figures/
python build_thesis.py     # regenera ../CSLM_Tesis_Maestria.docx
```

## Estructura de esta carpeta

```
docs/tesis/
├── CSLM_Tesis_Maestria.docx   # documento final
├── figures/                    # 5 diagramas PNG (arquitectura, ER, semáforo, grafo, notificaciones)
└── build/
    ├── build_thesis.py         # ensambla el .docx con formato APA 7 (portada, resumen ES/EN,
    │                            # TOC, listas de tablas/figuras, capítulos, referencias, apéndices)
    ├── gen_figures.py          # genera los 5 diagramas con Pillow
    └── content/                # contenido de cada capítulo/apéndice en markdown ligero
```

## Contenido del documento

1. Introducción (contexto, planteamiento del problema, objetivos, preguntas de investigación, alcance)
2. Marco teórico y estado del arte (PKI, ciclo de vida de certificados, gestión de secretos, normas, arquitectura, soluciones relacionadas)
3. Metodología (Design Science Research, Hevner et al. 2004 / Peffers et al. 2007)
4. Análisis y diseño del sistema (requisitos, arquitectura, modelo de datos, API, seguridad, semáforo, grafo, notificaciones, frontend)
5. Implementación (stack, estructura de proyectos, persistencia, seguridad, scheduler, Docker Compose, datos de prueba)
6. Pruebas y validación (estrategia, pruebas unitarias/integración, resultados reales de `./gradlew test`)
7. Discusión (cumplimiento de objetivos, comparación con soluciones existentes, limitaciones, amenazas a la validez)
8. Conclusiones y trabajo futuro
9. Referencias (20 fuentes verificadas: RFC 5280/7519, NIST SP 800-57, ISO/IEC 27001:2022, OWASP ASVS, CA/Browser Forum, Hevner, Peffers, Fowler, Fielding, Sommerville, Pressman & Maxim, Newman, Richardson, Elmasri & Navathe, documentación de HashiCorp Vault/AWS Secrets Manager/Azure Key Vault/cert-manager, Ponemon Institute)
10. Apéndices: A) diccionario de datos completo (17 tablas), B) catálogo de ~60 endpoints REST, C) variables de entorno, D) guía de instalación, E) flujo de aceptación de 18 pasos verificado
