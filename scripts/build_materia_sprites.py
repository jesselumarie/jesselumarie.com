#!/usr/bin/env python3
"""PSX-style pixel-art materia sockets and orbs: hard-banded shading,
quantized palette, drawn at native size for 2x pixelated display."""
from PIL import Image
import base64, io, math, sys

def uri(im):
    buf = io.BytesIO(); im.save(buf, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

def zoom(im, path, k=10):
    im.resize((im.width*k, im.height*k), Image.NEAREST).save(path)


# ---- socket donut, 19x19 ----
def socket(empty=False):
    S = 19
    im = Image.new('RGBA', (S, S), (0,0,0,0))
    px = im.load()
    cx = cy = (S-1)/2
    for y in range(S):
        for x in range(S):
            d = math.hypot(x-cx, y-cy)
            if d > 9.5: continue
            if d > 8.5:
                px[x,y] = (18,18,26,255)                      # outline
            elif d >= 5.6:
                if   y <= 5:  c = (232,232,240)               # bright top
                elif y <= 9:  c = (176,176,188)
                elif y <= 13: c = (128,128,140)
                else:         c = (84,84,96)                  # dark bottom
                if d < 6.4: c = (52,52,62)                    # inner lip
                px[x,y] = c + (255,)
            else:
                px[x,y] = (10,10,16,255)                      # hole
                if y <= 6 and d > 4: px[x,y] = (24,24,34,255) # faint top light
    if empty:
        for y in range(S):
            for x in range(S):
                d = math.hypot(x-cx, y-cy)
                if 2.6 <= d <= 4.2:
                    px[x,y] = (44,44,56,255)                  # washer ring
    return im

# ---- orb, 15x17 egg lit from below, like the PSX sprites ----
# Measured from the game's Materia screen: dark crown, saturated
# belt, pale glowing bottom rim, white specular block at top-left,
# and the egg overhangs the socket's bottom edge.
COLORS = {                    # dark, mid, low, rim
  'green':  ((10,56,26),   (46,158,88),  (116,216,136), (212,248,212)),
  'yellow': ((90,64,8),    (198,146,30), (238,204,92),  (250,238,168)),
  'purple': ((56,16,74),   (158,62,182), (228,150,232), (246,204,246)),
  'red':    ((74,12,16),   (192,42,56),  (230,116,116), (246,186,182)),
  'blue':   ((16,28,80),   (54,94,198),  (120,160,236), (190,216,250)),
}
def orb(name):
    dark, mid, low, rim = COLORS[name]
    W, H = 15, 17
    im = Image.new('RGBA', (W, H), (0,0,0,0))
    px = im.load()
    cx, cy, rx, ry = (W-1)/2, (H-1)/2, 7.5, 8.5
    for y in range(H):
        for x in range(W):
            e = ((x-cx)/rx)**2 + ((y-cy)/ry)**2
            if e > 1: continue
            if e > 0.88:
                c = dark if y < cy else low            # outline: hard top, softer below
            elif e > 0.55 and y >= cy + 1:
                c = rim                                # glowing lower rim
            elif y >= cy + 2.5:
                c = low
            elif y >= cy - 2:
                c = mid
            else:
                c = dark                               # crown
            px[x,y] = c + (255,)
    # white specular block, top-left, sitting in the crown
    for sx, sy in ((4,3),(5,3),(4,4),(5,4),(6,4)):
        px[sx,sy] = (255,255,255,255)
    px[6,5] = low + (255,)
    return im

out = {}
out['socket'] = socket(False)
out['socket_empty'] = socket(True)
for n in COLORS: out['orb_' + n] = orb(n)

strip = Image.new('RGBA', (24*len(out), 20), (20,20,40,255))
for i,(k,im) in enumerate(out.items()):
    strip.paste(im, (24*i+2, 2), im)
zoom(strip, 'sprites_zoom.png', 8)

for k, im in out.items():
    print(k, uri(im))
