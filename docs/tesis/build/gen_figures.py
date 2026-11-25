#!/usr/bin/env python3
"""Generate the figures used in the CSLM master's thesis document."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "figures")
os.makedirs(OUT_DIR, exist_ok=True)

FONT_DIR = "/System/Library/Fonts/Supplemental"
def font(size, bold=False, italic=False):
    name = "Arial"
    if bold and italic:
        name += " Bold Italic"
    elif bold:
        name += " Bold"
    elif italic:
        name += " Italic"
    return ImageFont.truetype(os.path.join(FONT_DIR, f"{name}.ttf"), size)

SCALE = 2  # render at 2x then it's still crisp when scaled down in the document

# Palette (professional, print-safe)
INK = (30, 34, 39)
LINE = (90, 98, 108)
BOX_FILL = (243, 246, 249)
BOX_FILL2 = (255, 255, 255)
ACCENT = (31, 78, 121)
MUTED = (110, 118, 128)

GREEN = (46, 139, 74)
YELLOW = (196, 158, 0)
ORANGE = (204, 102, 0)
RED = (176, 42, 42)
BLACK_ST = (40, 40, 40)


def new_canvas(w, h, bg=(255, 255, 255)):
    img = Image.new("RGB", (w * SCALE, h * SCALE), bg)
    return img, ImageDraw.Draw(img)


def box(d, xy, fill=BOX_FILL, outline=LINE, width=2, radius=10):
    x0, y0, x1, y1 = [v * SCALE for v in xy]
    d.rounded_rectangle([x0, y0, x1, y1], radius=radius * SCALE, fill=fill, outline=outline, width=width * SCALE)


def text_center(d, xy, txt, f, fill=INK):
    x, y = xy[0] * SCALE, xy[1] * SCALE
    bbox = d.textbbox((0, 0), txt, font=f)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text((x - w / 2, y - h / 2 - bbox[1]), txt, font=f, fill=fill)


def text_left(d, xy, txt, f, fill=INK):
    x, y = xy[0] * SCALE, xy[1] * SCALE
    d.text((x, y), txt, font=f, fill=fill)


def arrow(d, p0, p1, color=LINE, width=2, dashed=False):
    x0, y0 = p0[0] * SCALE, p0[1] * SCALE
    x1, y1 = p1[0] * SCALE, p1[1] * SCALE
    if dashed:
        import math
        length = math.hypot(x1 - x0, y1 - y0)
        n = max(int(length // (10 * SCALE)), 1)
        for i in range(0, n, 2):
            t0, t1 = i / n, min((i + 1) / n, 1)
            d.line([x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0,
                    x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1], fill=color, width=width * SCALE)
    else:
        d.line([x0, y0, x1, y1], fill=color, width=width * SCALE)
    # arrow head
    import math
    ang = math.atan2(y1 - y0, x1 - x0)
    hl = 9 * SCALE
    for da in (0.5, -0.5):
        hx = x1 - hl * math.cos(ang - da)
        hy = y1 - hl * math.sin(ang - da)
        d.line([x1, y1, hx, hy], fill=color, width=width * SCALE)


def save(img, name):
    path = os.path.join(OUT_DIR, name)
    img = img.resize((img.width // SCALE, img.height // SCALE), Image.LANCZOS)
    img.save(path, "PNG")
    print("wrote", path)


# ---------------------------------------------------------------------------
# Figure 1: General architecture
# ---------------------------------------------------------------------------
W, H = 760, 460
img, d = new_canvas(W, H)
f_title = font(15, bold=True)
f_h = font(14, bold=True)
f_b = font(12)
f_s = font(11)

box(d, (40, 40, 280, 150), fill=BOX_FILL2)
text_center(d, (160, 60), "Frontend", f_h)
text_center(d, (160, 84), "React 18 + TypeScript + Vite", f_b)
text_center(d, (160, 104), "Material UI · React Router · Axios", f_s)
text_center(d, (160, 124), "Servido por Nginx (producción)", f_s)

box(d, (480, 40, 720, 150), fill=BOX_FILL2)
text_center(d, (600, 60), "Base de datos", f_h)
text_center(d, (600, 84), "MySQL 8.x", f_b)
text_center(d, (600, 104), "Esquema y datos gestionados", f_s)
text_center(d, (600, 122), "por migraciones Flyway", f_s)

box(d, (200, 210, 560, 360), fill=(235, 241, 247))
text_center(d, (380, 230), "Backend", f_h)
text_center(d, (380, 253), "Java 21 + Spring Boot 3", f_b)
text_center(d, (380, 275), "REST + Spring Security (JWT)", f_s)
text_center(d, (380, 293), "Capas: domain · repository · service ·", f_s)
text_center(d, (380, 309), "controller · dto · security · audit · scheduler", f_s)
text_center(d, (380, 331), "OpenAPI / Swagger UI", f_s)

box(d, (300, 400, 460, 450), fill=BOX_FILL2)
text_center(d, (380, 415), "Servidor SMTP", f_h)
text_center(d, (380, 434), "MailHog (dev) / SMTP corporativo", f_s)

arrow(d, (280, 95), (480, 95))
arrow(d, (480, 105), (280, 105))
text_center(d, (380, 80), "JDBC", f_s, fill=MUTED)

arrow(d, (170, 150), (330, 210))
arrow(d, (330, 210), (170, 150))
text_left(d, (185, 168), "HTTPS / JSON", f_s, fill=MUTED)
text_left(d, (185, 182), "JWT bearer", f_s, fill=MUTED)

arrow(d, (380, 360), (380, 400))
text_left(d, (388, 372), "Spring Mail", f_s, fill=MUTED)

d_rect = d
box(d, (40, 400, 280, 450), fill=(255, 255, 255), outline=(150, 150, 150))
text_center(d, (160, 415), "Navegador del usuario", f_s, fill=MUTED)
text_center(d, (160, 432), "(cliente HTTP del frontend)", f_s, fill=MUTED)
arrow(d, (160, 400), (160, 150), color=(150, 150, 150))

save(img, "architecture.png")

# ---------------------------------------------------------------------------
# Figure 2: Simplified ER diagram
# ---------------------------------------------------------------------------
W, H = 900, 640
img, d = new_canvas(W, H)

def entity(d, xy, title, rows, fill=BOX_FILL2, th=16):
    x0, y0, x1, y1 = xy
    box(d, xy, fill=fill)
    text_center(d, ((x0 + x1) / 2, y0 + th), title, font(12, bold=True))
    d.line([(x0 + 4) * SCALE, (y0 + th + 8) * SCALE, (x1 - 4) * SCALE, (y0 + th + 8) * SCALE], fill=LINE, width=2 * SCALE)
    yy = y0 + th + 20
    for r in rows:
        text_center(d, ((x0 + x1) / 2, yy), r, font(10))
        yy += 15

entity(d, (20, 20, 190, 90), "teams", ["name", "description"])
entity(d, (20, 130, 190, 210), "users", ["username", "password_hash"], fill=(235, 241, 247))
entity(d, (20, 240, 190, 300), "roles", ["name"], fill=(235, 241, 247))

entity(d, (240, 20, 420, 100), "applications", ["code · owner", "criticality"])
entity(d, (240, 140, 420, 210), "environments", ["code · production", "sort_order"])

entity(d, (470, 20, 660, 110), "certificates", ["common_name · issuer", "serial_number", "expiration_date"])
entity(d, (470, 150, 660, 230), "secrets", ["storage_system", "secret_reference", "expiration_date"])

entity(d, (710, 20, 880, 90), "asset_types", ["category · code"])
entity(d, (710, 130, 880, 210), "location_types", ["code · name"])
entity(d, (710, 240, 880, 320), "deployment_locations", ["cluster · namespace"])

entity(d, (240, 260, 420, 340), "application_assets", ["asset_type · asset_id", "(N:M)"], fill=(255, 245, 230))
entity(d, (470, 270, 660, 350), "asset_deployments", ["asset_type · asset_id", "(N:M)"], fill=(255, 245, 230))

entity(d, (240, 400, 420, 470), "notification_rules", ["days_before · enabled"])
entity(d, (470, 400, 660, 470), "notification_history", ["status · sent_at"])
entity(d, (20, 400, 190, 470), "audit_log", ["action · entity_name"])
entity(d, (710, 400, 880, 470), "system_settings", ["setting_key/value"])

# relations (kept orthogonal / short to avoid crossings)
arrow(d, (190, 55), (240, 55))       # teams -> applications (1:N)
arrow(d, (105, 90), (105, 130))      # roles -> users (placed above)
arrow(d, (330, 100), (330, 140))     # applications -> environments (visual proximity only)
arrow(d, (330, 210), (330, 260))     # applications/environments -> application_assets
arrow(d, (420, 65), (470, 65))       # application_assets -> certificates
arrow(d, (420, 190), (470, 190))     # application_assets -> secrets (via asset_type/asset_id)
arrow(d, (565, 110), (565, 150))     # certificates -> secrets (visual column link)
arrow(d, (660, 55), (710, 55))       # certificates -> asset_types
arrow(d, (660, 190), (710, 170))     # secrets -> asset_types
arrow(d, (565, 270), (565, 300))     # environments column -> asset_deployments
arrow(d, (660, 300), (710, 275))     # asset_deployments -> deployment_locations
arrow(d, (795, 210), (795, 240))     # location_types -> deployment_locations
arrow(d, (330, 340), (330, 400))     # application_assets -> notification_rules (same asset_id/type)
arrow(d, (565, 350), (565, 400))     # asset_deployments -> notification_history (visual grouping)
arrow(d, (105, 300), (105, 400))     # roles/users column -> audit_log
arrow(d, (795, 320), (795, 400))     # deployment_locations -> system_settings (visual grouping)

save(img, "er_diagram.png")

# ---------------------------------------------------------------------------
# Figure 3: Semaphore thresholds
# ---------------------------------------------------------------------------
W, H = 820, 300
img, d = new_canvas(W, H)

segments = [
    ("VENCIDO", "días < 0", BLACK_ST, 40, 150),
    ("ROJO", "1–7 días", RED, 150, 260),
    ("NARANJA", "8–30 días", ORANGE, 260, 400),
    ("AMARILLO", "31–90 días", YELLOW, 400, 560),
    ("VERDE", "> 90 días", GREEN, 560, 780),
]

bar_y0, bar_y1 = 90, 150
for label, sub, color, x0, x1 in segments:
    box(d, (x0, bar_y0, x1, bar_y1), fill=color, outline=(255, 255, 255), width=3, radius=4)
    text_center(d, ((x0 + x1) / 2, 65), label, font(13, bold=True), fill=INK)
    text_center(d, ((x0 + x1) / 2, (bar_y0 + bar_y1) / 2), sub, font(12, bold=True), fill=(255, 255, 255))

text_center(d, (W / 2, 30), "Semáforo de vencimientos — umbrales por defecto (SemaphoreService)", font(14, bold=True))
text_center(d, (W / 2, 190), "días restantes = fecha de expiración − fecha actual", font(12, italic=True), fill=MUTED)
text_center(d, (W / 2, 215), "Umbrales configurables desde Administración (system_settings):", font(11), fill=MUTED)
text_center(d, (W / 2, 235), "SEMAPHORE_RED_MAX_DAYS = 7 · SEMAPHORE_ORANGE_MAX_DAYS = 30 · SEMAPHORE_YELLOW_MAX_DAYS = 90", font(11), fill=MUTED)

# arrow showing direction of increasing days
arrow(d, (40, 270), (780, 270), color=MUTED, width=2)
text_left(d, (40, 275), "menos días restantes", font(10), fill=MUTED)
text_center(d, (700, 275+10), "", font(10))
text_left(d, (660, 275), "más días restantes", font(10), fill=MUTED)

save(img, "semaphore.png")

# ---------------------------------------------------------------------------
# Figure 4: Dependency graph (two directions)
# ---------------------------------------------------------------------------
W, H = 900, 420
img, d = new_canvas(W, H)

text_center(d, (230, 25), "Vista centrada en el activo", font(13, bold=True))
box(d, (170, 50, 290, 90), fill=(235, 241, 247))
text_center(d, (230, 70), "Certificate\napi-prod", font(11, bold=True))

box(d, (90, 140, 210, 180))
text_center(d, (150, 160), "Application\nCorporate Banking", font(10))
box(d, (250, 140, 370, 180))
text_center(d, (310, 160), "Application\nPayments", font(10))

box(d, (90, 230, 210, 270))
text_center(d, (150, 250), "Environment\nProducción", font(10))

box(d, (90, 320, 210, 360))
text_center(d, (150, 340), "DeploymentLocation\nOCP-PROD-01", font(10))

arrow(d, (215, 90), (150, 140))
arrow(d, (245, 90), (310, 140))
arrow(d, (150, 180), (150, 230))
arrow(d, (150, 270), (150, 320))

d.line([(460 * SCALE, 20 * SCALE), (460 * SCALE, 400 * SCALE)], fill=(200, 200, 200), width=2 * SCALE)

text_center(d, (680, 25), "Vista centrada en la aplicación", font(13, bold=True))
box(d, (610, 50, 750, 90), fill=(235, 241, 247))
text_center(d, (680, 70), "Application\nCorporate Banking", font(11, bold=True))

box(d, (540, 140, 660, 180))
text_center(d, (600, 160), "Environment\nProducción", font(10))
box(d, (700, 140, 830, 180))
text_center(d, (765, 160), "Environment\nDesarrollo", font(10))

box(d, (500, 230, 620, 270))
text_center(d, (560, 250), "Certificate\napi-prod", font(10))
box(d, (630, 230, 750, 270))
text_center(d, (690, 250), "Certificate\ncorporate-prod", font(10))
box(d, (700, 320, 830, 360))
text_center(d, (765, 340), "Certificate\ncorporate-dev", font(10))

arrow(d, (655, 90), (600, 140))
arrow(d, (705, 90), (765, 140))
arrow(d, (590, 180), (560, 230))
arrow(d, (630, 180), (690, 230))
arrow(d, (765, 180), (765, 320))

save(img, "dependency_graph.png")

# ---------------------------------------------------------------------------
# Figure 5: Notification process flow
# ---------------------------------------------------------------------------
W, H = 900, 660
img, d = new_canvas(W, H)

steps = [
    (60, "Disparador diario\n@Scheduled 07:00\n(NOTIFICATIONS_CRON)"),
    (165, "Recorrer certificados y\nsecretos con estado ACTIVE"),
    (270, "SemaphoreService:\ncalcular días restantes"),
    (375, "¿Coincide con alguna\nNotificationRule habilitada?"),
    (480, "NotificationService:\nconstruir y enviar correo\n(Spring Mail / SMTP)"),
]

for i, (y, label) in enumerate(steps):
    fill = (255, 245, 230) if "Coincide" in label else BOX_FILL2
    box(d, (260, y - 32, 640, y + 32), fill=fill)
    text_center(d, (450, y), label, font(11, bold=("Coincide" in label)))
    if i < len(steps) - 1:
        arrow(d, (450, y + 32), (450, steps[i + 1][0] - 32))

# "no" branch: loop back to step 2 for the next asset
box(d, (700, 375 - 25, 860, 375 + 25), fill=BOX_FILL2, outline=MUTED)
text_center(d, (780, 375), "No: continuar con\nel siguiente activo", font(10), fill=MUTED)
arrow(d, (640, 375), (700, 375), color=MUTED)
arrow(d, (780, 350), (780, 165), color=MUTED, dashed=True)
arrow(d, (780, 165), (640, 165), color=MUTED, dashed=True)

box(d, (260, 560 - 34, 640, 560 + 34), fill=(235, 241, 247))
text_center(d, (450, 560), "Registrar en NotificationHistory\n(SENT o FAILED) — evita duplicados\npor (activo, regla, día)", font(10, bold=True))
arrow(d, (450, 512), (450, 526))

box(d, (40, 440, 220, 500), fill=(255, 255, 255), outline=MUTED)
text_center(d, (130, 458), "POST /api/notifications/test", font(10), fill=MUTED)
text_center(d, (130, 478), "(disparo manual bajo demanda)", font(9), fill=MUTED)
arrow(d, (220, 470), (260, 490), color=MUTED, dashed=True)

save(img, "notification_flow.png")

print("done")
