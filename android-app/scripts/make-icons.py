"""Generates the RWH Planner brand mark (roof + rain drop) and all app icon / splash assets.
Run: python scripts/make-icons.py   (needs Pillow). Output goes to assets/ and store-listing/graphics/."""
import math, os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")
TEAL, TEAL_DEEP, AQUA, SAND, WHITE = (11, 92, 102), (6, 62, 70), (79, 214, 220), (246, 243, 238), (255, 255, 255)
SS = 4  # supersampling


def drop_poly(cx, cy, r, apex_y, n=90):
    """Tear-drop: circle (cx, cy, r) with a pointed apex above it."""
    d = cy - apex_y
    a = math.asin(min(0.999, r / d))  # tangent half-angle seen from the apex
    # tangent points on the circle
    start = math.pi / 2 + a  # measured from +x, y up -> convert
    pts = [(cx, apex_y)]
    t0, t1 = -(math.pi / 2 - a), math.pi + (math.pi / 2 - a)
    for i in range(n + 1):
        t = t0 + (t1 - t0) * i / n
        pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
    return pts


def mark(size, roof=WHITE, drop=AQUA, shine=WHITE, scale=1.0, cx=None, cy=None, stroke=None):
    """Draw the mark on a transparent canvas of `size` (supersampled)."""
    S = size * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    u = S * scale / 100.0
    ox = (cx if cx is not None else S / 2)
    oy = (cy if cy is not None else S / 2)
    w = stroke or 9.5 * u
    # roof chevron with eaves
    peak = (ox, oy - 34 * u)
    left, right = (ox - 40 * u, oy - 2 * u), (ox + 40 * u, oy - 2 * u)
    d.line([left, peak, right], fill=roof, width=int(w), joint="curve")
    for p in (left, right, peak):
        d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=roof)
    # drop under the roof
    pts = drop_poly(ox, oy + 20 * u, 17 * u, oy - 16 * u)
    d.polygon(pts, fill=drop)
    # highlight
    hx, hy, hr = ox - 7 * u, oy + 19 * u, 7.5 * u
    d.arc([hx - hr, hy - hr, hx + hr, hy + hr], 110, 200, fill=shine, width=int(3.2 * u))
    return img.resize((size, size), Image.LANCZOS)


def rounded_bg(size, radius_frac=0.22, top=TEAL, bottom=TEAL_DEEP):
    S = size * SS
    grad = Image.new("RGBA", (S, S))
    gd = ImageDraw.Draw(grad)
    for y in range(S):
        t = y / (S - 1)
        c = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3)) + (255,)
        gd.line([(0, y), (S, y)], fill=c)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius_frac), fill=255)
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out.resize((size, size), Image.LANCZOS)


def full_bg(size, top=TEAL, bottom=TEAL_DEEP):
    return rounded_bg(size, radius_frac=0.0, top=top, bottom=bottom)


def save(img, *parts):
    p = os.path.join(*parts)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p, optimize=True)
    print("wrote", os.path.relpath(p, ROOT), img.size)


def main():
    # launcher icon (legacy, square with rounded corners)
    bg = rounded_bg(1024)
    bg.alpha_composite(mark(1024, scale=0.78))
    save(bg, A, "icon.png")
    # adaptive icon foreground: keep the mark inside the 66% safe zone
    save(mark(1024, scale=0.56), A, "adaptive-icon.png")
    mono = mark(1024, roof=WHITE, drop=WHITE, shine=(0, 0, 0, 0), scale=0.56)
    save(mono, A, "adaptive-icon-mono.png")
    # splash marks (light and dark backgrounds)
    save(mark(512, roof=TEAL, drop=(28, 168, 178), shine=WHITE, scale=0.9), A, "splash-icon.png")
    save(mark(512, roof=WHITE, drop=AQUA, shine=WHITE, scale=0.9), A, "splash-icon-dark.png")
    # status-bar notification icon: white silhouette
    save(mark(96, roof=WHITE, drop=WHITE, shine=(0, 0, 0, 0), scale=0.95), A, "notification-icon.png")
    save(mark(256, roof=TEAL, drop=(28, 168, 178), shine=WHITE, scale=0.95), A, "mark.png")
    # favicon for completeness
    save(bg.resize((48, 48), Image.LANCZOS), A, "favicon.png")
    # Play Store 512x512 icon (full-bleed square; Play applies its own mask)
    store = full_bg(512)
    store.alpha_composite(mark(512, scale=0.74))
    save(store.convert("RGB"), ROOT, "store-listing", "graphics", "icon-512.png")


if __name__ == "__main__":
    main()
