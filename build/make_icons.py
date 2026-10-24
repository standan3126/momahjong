"""Generate the PWA / home-screen icons (run once; output is committed in icons/)."""
from PIL import Image, ImageDraw

def draw_icon(size, maskable=False):
    s = size / 512
    img = Image.new("RGBA", (size, size), (6, 52, 38, 255))
    d = ImageDraw.Draw(img)
    # radial-ish jade background
    for i in range(40, 0, -1):
        c = (6 + i, 52 + i * 2, 38 + i, 255)
        r = int(size * (0.25 + i / 60))
        d.ellipse([size / 2 - r, size * 0.42 - r, size / 2 + r, size * 0.42 + r], fill=c)
    inset = 0.2 if maskable else 0.12
    x0, y0 = size * (0.5 - (0.5 - inset) * 0.78), size * inset
    x1, y1 = size - x0, size * (1 - inset)
    depth = 26 * s
    # tile thickness (jade side faces) then ivory face
    d.rounded_rectangle([x0 - depth, y0 + depth, x1 - depth, y1 + depth], radius=40 * s, fill=(4, 120, 87, 255))
    d.rounded_rectangle([x0 - depth / 2, y0 + depth / 2, x1 - depth / 2, y1 + depth / 2], radius=40 * s, fill=(16, 185, 129, 255))
    d.rounded_rectangle([x0, y0, x1, y1], radius=40 * s, fill=(255, 251, 240, 255), outline=(213, 197, 159, 255), width=int(8 * s))
    # three bamboo stalks
    cx, w = (x0 + x1) / 2, (x1 - x0)
    for k, dx in enumerate((-0.25, 0, 0.25)):
        sx = cx + dx * w
        top, bot = y0 + (y1 - y0) * 0.16, y1 - (y1 - y0) * 0.16
        col = (220, 38, 38, 255) if k == 1 else (21, 128, 61, 255)
        d.rounded_rectangle([sx - 18 * s, top, sx + 18 * s, bot], radius=14 * s, fill=col)
        for f in (0.33, 0.66):
            ny = top + (bot - top) * f
            d.rounded_rectangle([sx - 26 * s, ny - 7 * s, sx + 26 * s, ny + 7 * s], radius=6 * s, fill=(134, 239, 172, 255))
    return img

draw_icon(192).save("icons/icon-192.png")
draw_icon(512).save("icons/icon-512.png")
draw_icon(512, maskable=True).save("icons/icon-maskable-512.png")
draw_icon(180).convert("RGB").save("icons/apple-touch-icon.png")
print("icons written")
