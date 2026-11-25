#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Builds the CSLM master's thesis as an APA 7th-edition-formatted .docx.

Reads the chapter content files (lightweight markup: '>' = H1, '##' = H2,
'###' = H3, '- ' = bullet, 'N. ' = numbered item, 'TABLE|...' / 'ENDTABLE'
= table, 'FIGURE|...' = figure, '**bold**' / '*italic*' / `code`) and
assembles a single .docx with a title page, bilingual abstract, table of
contents, list of tables, list of figures, eight chapters, references and
five appendices.
"""
import os
import re
import copy

from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = os.path.dirname(os.path.abspath(__file__))          # docs/tesis/build
TESIS_DIR = os.path.dirname(BASE)                           # docs/tesis
CONTENT_DIR = os.path.join(BASE, "content")
FIG_DIR = os.path.join(TESIS_DIR, "figures")
OUT_PATH = os.path.join(TESIS_DIR, "CSLM_Tesis_Maestria.docx")

TITLE = ("Diseño e implementación de una plataforma centralizada para la gestión "
          "del ciclo de vida de certificados digitales y secretos corporativos")
RUNNING_HEAD = "CICLO DE VIDA DE CERTIFICADOS Y SECRETOS"
AUTHOR = "[Nombre completo del autor]"
INSTITUTION = "[Nombre de la universidad]"
PROGRAM = "[Nombre del programa de Maestría]"
DEPARTMENT = "[Facultad / Escuela de Posgrado]"
ADVISOR = "[Nombre del asesor o tutor de tesis]"
CITY_COUNTRY = "[Ciudad, País]"
SUBMISSION_DATE = "Septiembre de 2026"

FONT_NAME = "Times New Roman"
MONO_FONT = "Courier New"
BODY_SIZE = Pt(12)
TABLE_SIZE = Pt(10.5)

# ---------------------------------------------------------------------------
# Low-level OOXML helpers
# ---------------------------------------------------------------------------

def set_run_font(run, name=FONT_NAME, size=BODY_SIZE, bold=False, italic=False, color=None):
    run.font.name = name
    run.font.size = size
    run.font.bold = bold
    run.font.italic = italic
    if color:
        run.font.color.rgb = color
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.append(rFonts)
    rFonts.set(qn('w:ascii'), name)
    rFonts.set(qn('w:hAnsi'), name)
    rFonts.set(qn('w:cs'), name)


def add_field(paragraph, instr_text, result_text="1"):
    """Insert a Word complex field (e.g. PAGE, SEQ, TOC) into a paragraph."""
    run = paragraph.add_run()
    fld_begin = OxmlElement('w:fldChar')
    fld_begin.set(qn('w:fldCharType'), 'begin')
    run._r.append(fld_begin)

    run2 = paragraph.add_run()
    instr = OxmlElement('w:instrText')
    instr.set(qn('xml:space'), 'preserve')
    instr.text = instr_text
    run2._r.append(instr)

    run3 = paragraph.add_run()
    fld_sep = OxmlElement('w:fldChar')
    fld_sep.set(qn('w:fldCharType'), 'separate')
    run3._r.append(fld_sep)

    run4 = paragraph.add_run(result_text)
    for r in (run, run2, run3, run4):
        set_run_font(r, size=paragraph.style.font.size or BODY_SIZE)

    run5 = paragraph.add_run()
    fld_end = OxmlElement('w:fldChar')
    fld_end.set(qn('w:fldCharType'), 'end')
    run5._r.append(fld_end)
    return run4


def set_updatefields(doc):
    element = OxmlElement('w:updateFields')
    element.set(qn('w:val'), 'true')
    doc.settings.element.append(element)


def set_cell_borders(cell, top=None, bottom=None):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement('w:tcBorders')
    for side, spec in (('top', top), ('bottom', bottom)):
        if spec is None:
            continue
        el = OxmlElement(f'w:{side}')
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), str(spec))
        el.set(qn('w:space'), '0')
        el.set(qn('w:color'), '000000')
        borders.append(el)
    tcPr.append(borders)


def remove_table_grid_borders(table):
    tbl = table._tbl
    tblPr = tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for side in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        el = OxmlElement(f'w:{side}')
        el.set(qn('w:val'), 'nil')
        borders.append(el)
    tblPr.append(borders)


def set_paragraph_spacing(paragraph, line_double=True, space_after=0, space_before=0):
    pf = paragraph.paragraph_format
    if line_double:
        pf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    else:
        pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    pf.space_after = Pt(space_after)
    pf.space_before = Pt(space_before)


def keep_with_next(paragraph, value=True):
    pf = paragraph.paragraph_format
    pf.keep_with_next = value


# ---------------------------------------------------------------------------
# Inline markup parser: **bold**, *italic*, `code`
# ---------------------------------------------------------------------------

TOKEN_RE = re.compile(r'(\*\*.+?\*\*|\*.+?\*|`.+?`)')


def add_runs_from_markup(paragraph, text, base_size=BODY_SIZE, base_italic=False):
    parts = TOKEN_RE.split(text)
    for part in parts:
        if not part:
            continue
        if part.startswith('**') and part.endswith('**'):
            run = paragraph.add_run(part[2:-2])
            set_run_font(run, size=base_size, bold=True, italic=base_italic)
        elif part.startswith('*') and part.endswith('*') and len(part) > 1:
            run = paragraph.add_run(part[1:-1])
            set_run_font(run, size=base_size, italic=True)
        elif part.startswith('`') and part.endswith('`'):
            run = paragraph.add_run(part[1:-1])
            set_run_font(run, name=MONO_FONT, size=Pt((base_size.pt if hasattr(base_size, 'pt') else 12) - 1))
        else:
            run = paragraph.add_run(part)
            set_run_font(run, size=base_size, italic=base_italic)


# ---------------------------------------------------------------------------
# Document-level building blocks
# ---------------------------------------------------------------------------

def new_paragraph(doc, style='Normal'):
    return doc.add_paragraph(style=style)


def add_body_paragraph(doc, text, indent=True, align=WD_ALIGN_PARAGRAPH.LEFT):
    p = new_paragraph(doc)
    set_paragraph_spacing(p)
    p.alignment = align
    if indent:
        p.paragraph_format.first_line_indent = Inches(0.5)
    add_runs_from_markup(p, text)
    return p


def add_bullet(doc, text, numbered=False):
    style = 'List Number' if numbered else 'List Bullet'
    p = doc.add_paragraph(style=style)
    set_paragraph_spacing(p)
    p.paragraph_format.left_indent = Inches(0.75)
    add_runs_from_markup(p, text)
    for r in p.runs:
        set_run_font(r)
    return p


def add_heading_block(doc, level, text):
    if level == 1:
        p = doc.add_paragraph()
        set_paragraph_spacing(p, space_before=0, space_after=0)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        keep_with_next(p)
        run = p.add_run(text)
        set_run_font(run, bold=True)
        p.paragraph_format.page_break_before = True
        p.style = doc.styles['Heading 1']
    elif level == 2:
        p = doc.add_paragraph()
        set_paragraph_spacing(p, space_before=0, space_after=0)
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        keep_with_next(p)
        run = p.add_run(text)
        set_run_font(run, bold=True)
        p.style = doc.styles['Heading 2']
    elif level == 3:
        p = doc.add_paragraph()
        set_paragraph_spacing(p, space_before=0, space_after=0)
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        keep_with_next(p)
        run = p.add_run(text)
        set_run_font(run, bold=True, italic=True)
        p.style = doc.styles['Heading 3']
    else:
        p = doc.add_paragraph()
        set_paragraph_spacing(p, space_before=0, space_after=0)
        keep_with_next(p)
        run = p.add_run(text)
        set_run_font(run, bold=True)
        p.style = doc.styles['Heading 4']
    return p


TABLE_COUNTER = {'n': 0}
FIGURE_COUNTER = {'n': 0}


def add_caption(doc, category, title_text):
    p = doc.add_paragraph()
    set_paragraph_spacing(p, space_after=6)
    label = p.add_run(f"{category} ")
    set_run_font(label, bold=True)
    add_field(p, f' SEQ {category} \\* ARABIC ', result_text=str(
        (TABLE_COUNTER.__setitem__('n', TABLE_COUNTER['n'] + 1) or TABLE_COUNTER['n'])
        if category == 'Tabla' else
        (FIGURE_COUNTER.__setitem__('n', FIGURE_COUNTER['n'] + 1) or FIGURE_COUNTER['n'])
    ))
    p2 = doc.add_paragraph()
    set_paragraph_spacing(p2, space_after=6)
    keep_with_next(p2)
    add_runs_from_markup(p2, f'*{title_text}*')
    return p


def add_apa_table(doc, title_text, header, rows):
    add_caption(doc, 'Tabla', title_text)
    table = doc.add_table(rows=1 + len(rows), cols=len(header))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    remove_table_grid_borders(table)
    table.autofit = True

    # header row
    for j, htext in enumerate(header):
        cell = table.rows[0].cells[j]
        cell.text = ''
        p = cell.paragraphs[0]
        set_paragraph_spacing(p, line_double=False, space_after=2)
        run = p.add_run(htext)
        set_run_font(run, size=TABLE_SIZE, bold=True)
        set_cell_borders(cell, top=12, bottom=6)

    # data rows
    for i, row in enumerate(rows):
        for j, val in enumerate(row):
            cell = table.rows[i + 1].cells[j]
            cell.text = ''
            p = cell.paragraphs[0]
            set_paragraph_spacing(p, line_double=False, space_after=2)
            add_runs_from_markup(p, str(val), base_size=TABLE_SIZE)
            if i == len(rows) - 1:
                set_cell_borders(cell, bottom=12)
    keep_with_next(table.rows[0].cells[0].paragraphs[0])
    p_after = doc.add_paragraph()
    set_paragraph_spacing(p_after, space_after=10)
    return table


def add_apa_figure(doc, title_text, image_filename, note=None):
    add_caption(doc, 'Figura', title_text)
    img_path = os.path.join(FIG_DIR, image_filename)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, space_after=6)
    run = p.add_run()
    run.add_picture(img_path, width=Inches(6.3))
    if note:
        note_p = doc.add_paragraph()
        set_paragraph_spacing(note_p, line_double=False, space_after=12)
        label = note_p.add_run('Nota. ')
        set_run_font(label, size=Pt(10.5), italic=True)
        add_runs_from_markup(note_p, note, base_size=Pt(10.5))


def add_note_paragraph(doc, text):
    """A '*Nota.* ...' line following a table/figure, rendered small & single-spaced."""
    p = doc.add_paragraph()
    set_paragraph_spacing(p, line_double=False, space_after=12)
    add_runs_from_markup(p, text, base_size=Pt(10.5))
    return p


# ---------------------------------------------------------------------------
# Content parser
# ---------------------------------------------------------------------------

NUM_ITEM_RE = re.compile(r'^\d+\.\s+')


def parse_and_render(doc, filepath):
    with open(filepath, encoding='utf-8') as f:
        lines = [l.rstrip('\n') for l in f]

    buffer = []

    def flush():
        nonlocal buffer
        if buffer:
            text = ' '.join(buffer).strip()
            if text:
                if text.startswith('*Nota.*') or text.startswith('*Nota*'):
                    add_note_paragraph(doc, text)
                else:
                    add_body_paragraph(doc, text)
            buffer = []

    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.strip()

        if stripped == '':
            flush()
            i += 1
            continue

        if stripped.startswith('TABLE|'):
            flush()
            parts_header = stripped.split('|')
            title_text = parts_header[2] if len(parts_header) > 2 else ''
            i += 1
            header = [c.strip() for c in lines[i].split('|')]
            i += 1
            rows = []
            while i < n and lines[i].strip() != 'ENDTABLE':
                if lines[i].strip() != '':
                    rows.append([c.strip() for c in lines[i].split('|')])
                i += 1
            add_apa_table(doc, title_text, header, rows)
            i += 1  # skip ENDTABLE
            continue

        if stripped.startswith('FIGURE|'):
            flush()
            parts = stripped.split('|')
            _, fig_label, title_text, filename = parts[0], parts[1], parts[2], parts[3]
            note = parts[4] if len(parts) > 4 else None
            add_apa_figure(doc, title_text, filename, note=note)
            i += 1
            continue

        if stripped.startswith('> '):
            flush()
            add_heading_block(doc, 1, stripped[2:].strip())
            i += 1
            continue

        if stripped.startswith('### '):
            flush()
            add_heading_block(doc, 3, stripped[4:].strip())
            i += 1
            continue

        if stripped.startswith('## '):
            flush()
            add_heading_block(doc, 2, stripped[3:].strip())
            i += 1
            continue

        if stripped.startswith('#### '):
            flush()
            add_heading_block(doc, 4, stripped[5:].strip())
            i += 1
            continue

        if stripped.startswith('- '):
            flush()
            add_bullet(doc, stripped[2:].strip(), numbered=False)
            i += 1
            continue

        if NUM_ITEM_RE.match(stripped):
            flush()
            text = NUM_ITEM_RE.sub('', stripped)
            add_bullet(doc, text, numbered=True)
            i += 1
            continue

        buffer.append(stripped)
        i += 1

    flush()


# ---------------------------------------------------------------------------
# References
# ---------------------------------------------------------------------------

REFERENCES = [
    "Amazon Web Services. (2024). *AWS Secrets Manager user guide*. https://docs.aws.amazon.com/secretsmanager/",
    "Barker, E. (2020). *Recommendation for key management: Part 1 – General* (NIST Special Publication 800-57 Part 1, Rev. 5). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-57pt1r5",
    "CA/Browser Forum. (2024). *Ballot SC-081v3: Introduce schedule of reducing validity and data reuse periods*. https://cabforum.org/",
    "cert-manager Project. (2024). *cert-manager documentation*. Cloud Native Computing Foundation. https://cert-manager.io/",
    "Cooper, D., Santesson, S., Farrell, S., Boeyen, S., Housley, R., & Polk, W. (2008). *Internet X.509 public key infrastructure certificate and certificate revocation list (CRL) profile* (RFC 5280). Internet Engineering Task Force. https://doi.org/10.17487/RFC5280",
    "Elmasri, R., & Navathe, S. B. (2015). *Fundamentals of database systems* (7th ed.). Pearson.",
    "Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* [Doctoral dissertation, University of California, Irvine].",
    "Fowler, M. (2002). *Patterns of enterprise application architecture*. Addison-Wesley.",
    "HashiCorp. (2024). *Vault documentation*. https://developer.hashicorp.com/vault",
    "Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, *28*(1), 75–105. https://doi.org/10.2307/25148625",
    "ISO/IEC. (2022). *Information security, cybersecurity and privacy protection — Information security management systems — Requirements* (ISO/IEC 27001:2022).",
    "Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON web token (JWT)* (RFC 7519). Internet Engineering Task Force. https://doi.org/10.17487/RFC7519",
    "Microsoft. (2024). *Azure Key Vault documentation*. https://learn.microsoft.com/azure/key-vault/",
    "Newman, S. (2021). *Building microservices: Designing fine-grained systems* (2nd ed.). O'Reilly Media.",
    "OWASP Foundation. (2021). *OWASP application security verification standard (ASVS) 4.0.3*. https://owasp.org/www-project-application-security-verification-standard/",
    "Peffers, K., Tuunanen, T., Rothenberger, M. A., & Chatterjee, S. (2007). A design science research methodology for information systems research. *Journal of Management Information Systems*, *24*(3), 45–77. https://doi.org/10.2753/MIS0742-1222240302",
    "Ponemon Institute. (2015). *2015 cost of failed trust report: When trust online breaks, businesses lose customers*. Ponemon Institute.",
    "Pressman, R. S., & Maxim, B. R. (2019). *Software engineering: A practitioner's approach* (9th ed.). McGraw-Hill Education.",
    "Richardson, C. (2018). *Microservices patterns: With examples in Java*. Manning Publications.",
    "Sommerville, I. (2015). *Software engineering* (10th ed.). Pearson.",
]


def add_references(doc):
    add_heading_block(doc, 1, 'Referencias')
    for entry in REFERENCES:
        p = doc.add_paragraph()
        set_paragraph_spacing(p)
        p.paragraph_format.left_indent = Inches(0.5)
        p.paragraph_format.first_line_indent = Inches(-0.5)
        add_runs_from_markup(p, entry)


# ---------------------------------------------------------------------------
# Front matter
# ---------------------------------------------------------------------------

def add_title_page(doc):
    for _ in range(3):
        p = doc.add_paragraph()
        set_paragraph_spacing(p)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p)
    run = p.add_run(TITLE)
    set_run_font(run, bold=True, size=Pt(14))

    for _ in range(3):
        p = doc.add_paragraph()
        set_paragraph_spacing(p)

    lines = [
        AUTHOR,
        "",
        INSTITUTION,
        DEPARTMENT,
        PROGRAM,
        "",
        ("Tesis presentada como requisito parcial para optar al título de "
         "Magíster en Ciberseguridad / Ingeniería de Software"),
        "",
        f"Asesor(a): {ADVISOR}",
        "",
        CITY_COUNTRY,
        SUBMISSION_DATE,
    ]
    for line in lines:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_paragraph_spacing(p)
        if line:
            run = p.add_run(line)
            set_run_font(run)

    note = doc.add_paragraph()
    set_paragraph_spacing(note, space_before=24)
    note.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = note.add_run(
        "Nota del autor: los campos entre corchetes (nombre del autor, universidad, programa, "
        "asesor y ciudad) son datos institucionales que deben completarse antes de la presentación "
        "formal del documento."
    )
    set_run_font(run, size=Pt(10), italic=True)


def add_abstract_es(doc):
    add_heading_block(doc, 1, 'Resumen')
    text = (
        "Las organizaciones grandes dependen de miles de certificados digitales y secretos "
        "corporativos cuyo vencimiento, cuando no es gestionado de forma centralizada, provoca "
        "interrupciones de servicio evitables. Este trabajo de grado documenta el diseño, la "
        "arquitectura y la implementación de CSLM (Certificate & Secret Lifecycle Manager), una "
        "plataforma web que centraliza el inventario y administra el ciclo de vida de certificados "
        "digitales y secretos, relacionándolos de forma explícita con las aplicaciones que los "
        "utilizan, los ambientes en los que operan, las ubicaciones de infraestructura donde están "
        "desplegados y los responsables encargados de su gestión. Siguiendo una metodología de "
        "ciencias del diseño (Design Science Research) estructurada en seis actividades, se analizaron "
        "los requisitos funcionales y no funcionales del dominio, se diseñó un modelo de datos "
        "relacional normalizado de diecisiete entidades, se implementó una API REST documentada con "
        "autenticación y autorización basadas en roles, un mecanismo de semáforo de riesgo con "
        "umbrales parametrizables, una vista de grafo de dependencias navegable en ambos sentidos, un "
        "sistema de notificación por correo con reglas configurables y deduplicación, y un frontend "
        "web completo, todo ello contenerizado con Docker Compose para su ejecución reproducible. La "
        "plataforma se construyó con Java 21, Spring Boot 3, MySQL 8, React y TypeScript. La "
        "validación, mediante pruebas automatizadas unitarias y de integración y mediante la ejecución "
        "manual de un flujo de aceptación de dieciocho pasos, confirmó el cumplimiento de los siete "
        "objetivos específicos planteados. Los resultados muestran que es posible construir, con "
        "tecnología de código abierto y sin infraestructura externa, una plataforma que cubre la "
        "brecha identificada entre las suites comerciales de gestión de certificados, los gestores de "
        "secretos en la nube y las herramientas ad hoc utilizadas habitualmente en la práctica "
        "organizacional."
    )
    p = doc.add_paragraph()
    set_paragraph_spacing(p)
    add_runs_from_markup(p, text)

    kw = doc.add_paragraph()
    set_paragraph_spacing(kw, space_before=12)
    kw.paragraph_format.first_line_indent = Inches(0.5)
    label = kw.add_run('Palabras clave: ')
    set_run_font(label, italic=True)
    val = kw.add_run(
        "certificados digitales, gestión de secretos, ciclo de vida, infraestructura de clave "
        "pública, arquitectura de software, Design Science Research, auditoría, seguridad de la "
        "información"
    )
    set_run_font(val)


def add_abstract_en(doc):
    add_heading_block(doc, 1, 'Abstract')
    text = (
        "Large organizations depend on thousands of digital certificates and corporate secrets "
        "whose expiration, when not centrally managed, causes avoidable service outages. This "
        "master's thesis documents the design, architecture and implementation of CSLM (Certificate "
        "& Secret Lifecycle Manager), a web platform that centralizes the inventory and manages the "
        "lifecycle of digital certificates and secrets, explicitly relating them to the applications "
        "that consume them, the environments in which they operate, the infrastructure locations "
        "where they are deployed, and the owners responsible for their management. Following a "
        "Design Science Research methodology structured around six activities, the functional and "
        "non-functional requirements of the domain were analyzed, a normalized relational data model "
        "of seventeen entities was designed, a documented REST API with role-based authentication and "
        "authorization was implemented, together with a configurable expiration-risk traffic-light "
        "mechanism, a bidirectionally navigable dependency graph view, an email notification system "
        "with configurable rules and deduplication, and a complete web frontend, all containerized "
        "with Docker Compose for reproducible execution. The platform was built with Java 21, Spring "
        "Boot 3, MySQL 8, React and TypeScript. Validation, through automated unit and integration "
        "tests and through the manual execution of an eighteen-step acceptance flow, confirmed that "
        "all seven specific objectives were met. The results show that it is possible to build, with "
        "open-source technology and without external infrastructure, a platform that covers the gap "
        "identified between commercial certificate lifecycle management suites, cloud secret "
        "managers, and the ad hoc tools commonly used in organizational practice."
    )
    p = doc.add_paragraph()
    set_paragraph_spacing(p)
    add_runs_from_markup(p, text)

    kw = doc.add_paragraph()
    set_paragraph_spacing(kw, space_before=12)
    kw.paragraph_format.first_line_indent = Inches(0.5)
    label = kw.add_run('Keywords: ')
    set_run_font(label, italic=True)
    val = kw.add_run(
        "digital certificates, secrets management, lifecycle, public key infrastructure, software "
        "architecture, Design Science Research, audit, information security"
    )
    set_run_font(val)


def add_toc_page(doc, title, field_instr):
    add_heading_block(doc, 1, title)
    p = doc.add_paragraph()
    set_paragraph_spacing(p, line_double=False)
    add_field(p, field_instr, result_text="Actualice la tabla de contenido en Word (clic derecho → Actualizar campos, o Ctrl+A luego F9).")


# ---------------------------------------------------------------------------
# Page setup / header-footer
# ---------------------------------------------------------------------------

def setup_section(section):
    section.page_height = Inches(11)
    section.page_width = Inches(8.5)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.header_distance = Inches(0.5)
    section.footer_distance = Inches(0.5)

    header = section.header
    header.is_linked_to_previous = False
    hp = header.paragraphs[0]
    hp.text = ''
    set_paragraph_spacing(hp, line_double=False)
    tab_stops = hp.paragraph_format.tab_stops
    tab_stops.add_tab_stop(Inches(6.5))
    run = hp.add_run(RUNNING_HEAD)
    set_run_font(run, size=Pt(11))
    hp.add_run('\t')
    add_field(hp, ' PAGE \\* MERGEFORMAT ', result_text='1')


def style_document(doc):
    normal = doc.styles['Normal']
    normal.font.name = FONT_NAME
    normal.font.size = BODY_SIZE
    normal.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    normal.paragraph_format.space_after = Pt(0)
    normal.paragraph_format.space_before = Pt(0)
    rpr = normal.element.get_or_add_rPr()
    rFonts = rpr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rpr.append(rFonts)
    rFonts.set(qn('w:ascii'), FONT_NAME)
    rFonts.set(qn('w:hAnsi'), FONT_NAME)
    rFonts.set(qn('w:cs'), FONT_NAME)

    for lvl, size, align in ((1, 12, WD_ALIGN_PARAGRAPH.CENTER),
                              (2, 12, WD_ALIGN_PARAGRAPH.LEFT),
                              (3, 12, WD_ALIGN_PARAGRAPH.LEFT),
                              (4, 12, WD_ALIGN_PARAGRAPH.LEFT)):
        style = doc.styles[f'Heading {lvl}']
        style.font.name = FONT_NAME
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.italic = (lvl == 3)
        style.font.color.rgb = RGBColor(0, 0, 0)
        style.paragraph_format.alignment = align
        style.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
        style.paragraph_format.space_after = Pt(0)
        style.paragraph_format.space_before = Pt(0)
        style.paragraph_format.page_break_before = False

    for name in ('List Bullet', 'List Number'):
        style = doc.styles[name]
        style.font.name = FONT_NAME
        style.font.size = BODY_SIZE
        style.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
        style.paragraph_format.space_after = Pt(0)


# ---------------------------------------------------------------------------
# Main assembly
# ---------------------------------------------------------------------------

def main():
    doc = Document()
    style_document(doc)
    setup_section(doc.sections[0])
    set_updatefields(doc)

    add_title_page(doc)

    # Each of the following starts with (or itself is) a Heading-1 block, and
    # add_heading_block() already forces a page break before every Heading 1,
    # so no manual page breaks are inserted between these sections.
    add_abstract_es(doc)
    add_abstract_en(doc)
    add_toc_page(doc, 'Tabla de contenido', 'TOC \\o "1-3" \\h \\z \\u')
    add_toc_page(doc, 'Lista de tablas', 'TOC \\h \\z \\c "Tabla"')
    add_toc_page(doc, 'Lista de figuras', 'TOC \\h \\z \\c "Figura"')

    chapters = ['ch1.md', 'ch2.md', 'ch3.md', 'ch4.md', 'ch5.md', 'ch6.md', 'ch7.md', 'ch8.md']
    for ch in chapters:
        parse_and_render(doc, os.path.join(CONTENT_DIR, ch))

    add_references(doc)

    parse_and_render(doc, os.path.join(CONTENT_DIR, 'appendices.md'))

    doc.save(OUT_PATH)
    print('Saved', OUT_PATH)
    print('Tables:', TABLE_COUNTER['n'], 'Figures:', FIGURE_COUNTER['n'])


if __name__ == '__main__':
    main()
