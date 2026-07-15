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

# ---- orb, 15x15, banded sphere ----
COLORS = {
  'green':  ((152,240,160), (40,184,56),  (16,96,24),   (8,48,16)),
  'yellow': ((255,232,138), (224,184,28), (138,106,8),  (74,56,4)),
  'purple': ((216,176,255), (136,68,204), (76,28,120),  (40,12,68)),
  'red':    ((255,152,144), (216,40,32),  (120,16,8),   (64,6,4)),
  'blue':   ((152,192,255), (48,96,208),  (20,44,120),  (10,24,64)),
}
def orb(name):
    light, base, dark, edge = COLORS[name]
    S = 15
    im = Image.new('RGBA', (S, S), (0,0,0,0))
    px = im.load()
    cx = cy = (S-1)/2
    lx, ly = 5, 4                                            # light point
    for y in range(S):
        for x in range(S):
            d = math.hypot(x-cx, y-cy)
            if d > 7.5: continue
            dl = math.hypot(x-lx, y-ly)
            if d > 6.6:        c = edge                       # dark rim
            elif dl < 1.7:     c = (255,255,255)              # specular
            elif dl < 3.4:     c = light
            elif dl < 5.6:     c = base
            else:              c = dark
            px[x,y] = c + (255,)
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
