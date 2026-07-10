"""Build the walk sheet for the lumarie.family chibi Jesse.

Frames 0-7: side-view walk (22x43), art matched to the site's front sprite
(same palette, chunky outlines), longer legs than the source for a better
stride. Gait: planted foot marches back ~2.5px/frame (f0 x15 -> f1 x12 ->
f2 x10 -> f3 x8 -> f4 toe-off x5), swing foot airborne, arms counter-swing
once per cycle, 1px body dip on the contact steps. f5/f6/f7 reuse f1/f2/f3
legs; the arms carry the half-cycle difference.

Frame 8: front-facing standing pose for :hover — head/torso/shoes transplanted
pixel-for-pixel from the lumarie.family sprite (open-eye variant, from
lumarie-sprite.png next to this script), legs extended to match the new
proportions.

Usage: python3 scripts/build_jesse_walk.py   (needs Pillow + numpy)
Writes landing_page/jesse-walk.png. After regenerating, bump the ?v=
cache-busters in jesse.js (png url) and index.html (script src), and keep
jesse.js SPEED equal to march_px_per_frame * 8fps * SCALE.
"""
from PIL import Image
import numpy as np
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = str(HERE.parent / "landing_page" / "jesse-walk.png")
FW, FH = 22, 43
WALK_FRAMES = 8

PAL = {
    'K': (51, 38, 29, 255),     # outline
    'h': (74, 52, 36, 255),     # hair
    'S': (246, 207, 160, 255),  # skin
    's': (220, 168, 123, 255),  # skin shadow
    'G': (154, 154, 160, 255),  # shirt
    'g': (124, 124, 132, 255),  # shirt shadow
    'B': (62, 108, 180, 255),   # jeans
    'b': (47, 84, 146, 255),    # jeans dark / far leg
    'N': (110, 74, 46, 255),    # shoe brown
    'n': (74, 56, 38, 255),     # shoe dark upper
    'W': (255, 255, 255, 255),  # glasses shine
    '.': (0, 0, 0, 0),
}

# head + torso + pelvis (rows 0-27), facing right                 x0        x21
BASE = [
    "......................",  # 0
    "......................",  # 1
    "......KKKKKKKK........",  # 2
    "....KKhhhhhhhhKK......",  # 3
    "...KhhhhhhhhhhhhK.....",  # 4
    "..KhhhhhhhhhhhhhhK....",  # 5
    "..KhhhhhhhhhhhhhhK....",  # 6
    "..KhhhhhhhhhhhhhhK....",  # 7
    "..KhhhhhSSSSSSSSSK....",  # 8  forehead stays bare
    "..KhhhSSSSSSSKKKKK....",  # 9  lens top rim
    "..KhhhKKKKKKKKWWKK....",  # 10 skinny arm from the hair to the lens
    "..KhhhSSSSSSSKWWKK....",  # 11
    "..KhhhSSSSSSSKKKKSK...",  # 12 bottom rim; nose bump below the front
    "..KhhhSSSSSSSSSSsK....",  # 13
    "...KhhSSSSSSSSsK......",  # 14
    ".....KSSSSSSsK........",  # 15 chin
    "....KGGGGGGGGGGK......",  # 16 shoulders
    "...KgGGGGGGGGGGGK.....",  # 17
    "...KgGGGGGGGGGGGK.....",  # 18
    "...KgGGGGGGGGGGGK.....",  # 19 sleeve bottom
    "...KgGGGGGGGGGGGK.....",  # 20
    "...KgGGGGGGGGGGGK.....",  # 21
    "...KgGGGGGGGGGGGK.....",  # 22
    "...KgGGGGGGGGGGGK.....",  # 23
    "....KGGGGGGGGGGK......",  # 24 hem
    "....KbBBBBBBBBBK......",  # 25 pelvis
    "....KbBBBBBBBBBK......",  # 26
    "....KbBBBBBBBBBK......",  # 27
]

def px(fr, x, y, c):
    if 0 <= x < FW and 0 <= y < FH:
        fr[y, x] = PAL[c]

def blank():
    return np.zeros((FH, FW, 4), dtype=np.uint8)

def paint_base(fr):
    for y, row in enumerate(BASE):
        for x, c in enumerate(row):
            if c != '.':
                fr[y, x] = PAL[c]

# ---- leg parts (legs rows 28-39, shoes to ground row 42) -------------------
def flat_shoe(fr, cx, sole_y):
    """Side shoe pointing right, 7 wide; sole outline sits on sole_y."""
    for x in range(cx - 3, cx + 4):
        px(fr, x, sole_y, 'K')
    for x in range(cx - 3, cx + 4):
        px(fr, x, sole_y - 1, 'N' if cx - 2 <= x <= cx + 2 else 'K')
    for x in range(cx - 3, cx + 3):
        px(fr, x, sole_y - 2, 'n' if cx - 2 <= x <= cx + 1 else 'K')

def heel_up_shoe(fr, tx):
    """Push-off foot: toe planted around tx, heel raised behind."""
    px(fr, tx - 3, 39, 'K'); px(fr, tx - 2, 39, 'K'); px(fr, tx - 1, 39, 'K')
    px(fr, tx - 3, 40, 'K'); px(fr, tx - 2, 40, 'n'); px(fr, tx - 1, 40, 'n'); px(fr, tx, 40, 'K')
    px(fr, tx - 2, 41, 'K'); px(fr, tx - 1, 41, 'N'); px(fr, tx, 41, 'N'); px(fr, tx + 1, 41, 'K')
    px(fr, tx - 1, 42, 'K'); px(fr, tx, 42, 'K'); px(fr, tx + 1, 42, 'K')

def leg_column(fr, cx_top, cx_bot, y_top, y_bot, fill):
    """4-wide jean leg from (cx_top,y_top) to (cx_bot,y_bot), outlined."""
    for y in range(y_top, y_bot + 1):
        t = (y - y_top) / max(1, (y_bot - y_top))
        cx = round(cx_top + (cx_bot - cx_top) * t)
        px(fr, cx - 2, y, 'K')
        px(fr, cx - 1, y, fill)
        px(fr, cx, y, fill)
        px(fr, cx + 1, y, 'K')

def legs_contact(fr):
    leg_column(fr, 9, 6, 28, 38, 'b')     # rear leg, toe-off at x~5
    heel_up_shoe(fr, 5)
    leg_column(fr, 12, 15, 28, 39, 'B')   # front leg, planted at x15
    flat_shoe(fr, 15, 42)

def legs_f1(fr):
    leg_column(fr, 9, 8, 28, 37, 'b')     # swing leg tucking, 2px air
    flat_shoe(fr, 8, 40)
    leg_column(fr, 12, 12, 28, 39, 'B')   # planted at x12
    flat_shoe(fr, 12, 42)

def legs_f2(fr):
    leg_column(fr, 10, 10, 28, 39, 'B')   # single support under the body
    for y in range(28, 40):               # far-leg depth: dark back column
        px(fr, 9, y, 'b')
    flat_shoe(fr, 10, 42)

def legs_f3(fr):
    leg_column(fr, 10, 8, 28, 38, 'b')    # planted, heel peeling, at x8
    heel_up_shoe(fr, 8)
    leg_column(fr, 12, 14, 28, 38, 'B')   # reach leg, 1px air
    flat_shoe(fr, 14, 41)

# ---- arms ------------------------------------------------------------------
NEAR_SWING = [2, 1, 0, -1, -2, -1, 0, 1]

def sh_round(v):
    return int(v + 0.5) if v >= 0 else -int(-v + 0.5)

def draw_near_arm(fr, off):
    sh = {20: 0, 21: sh_round(off * 0.4), 22: sh_round(off * 0.6),
          23: sh_round(off * 0.8), 24: off}
    px(fr, 8, 19, 'K'); px(fr, 11, 19, 'K')        # sleeve edge
    for y, d in sh.items():
        px(fr, 8 + d, y, 'K')
        px(fr, 9 + d, y, 'S')
        px(fr, 10 + d, y, 'S')
        px(fr, 11 + d, y, 'K')
    px(fr, 9 + off, 25, 'K')
    px(fr, 10 + off, 25, 'K')

def draw_far_hand(fr, off):
    x = 14 + (1 if off >= 2 else 0)
    px(fr, x + 1, 21, 'K'); px(fr, x + 2, 21, 'K')
    for y in (22, 23):
        px(fr, x, y, 'K'); px(fr, x + 1, y, 'S')
        px(fr, x + 2, y, 'S'); px(fr, x + 3, y, 'K')
    px(fr, x + 1, 24, 'K'); px(fr, x + 2, 24, 'K')

# ---- frame 8: front-facing hover pose ---------------------------------------
def front_frame():
    fr = blank()
    src = np.array(Image.open(str(HERE / "lumarie-sprite.png")).convert("RGBA"))[:, 3:21]
    for y in range(0, 25):                       # head + torso, verbatim
        for x in range(18):
            if src[y, x][3] > 30:
                fr[y, x + 2] = src[y, x]
    for y in range(25, 28):                      # pelvis
        px(fr, 6, y, 'K')
        for x in range(7, 15):
            px(fr, x, y, 'B')
        px(fr, 15, y, 'K')
    for y in range(28, 40):                      # legs, source seam style
        px(fr, 6, y, 'K')
        for x in range(7, 10):
            px(fr, x, y, 'B')
        px(fr, 10, y, 'K'); px(fr, 11, y, 'K')
        for x in range(12, 15):
            px(fr, x, y, 'B')
        px(fr, 15, y, 'K')
    for sy, my in ((36, 40), (37, 41), (38, 42)):  # shoes, verbatim
        for x in range(18):
            if src[sy, x][3] > 30:
                fr[my, x + 2] = src[sy, x]
    return fr

# ---- assemble ----------------------------------------------------------------
LEGS = [legs_contact, legs_f1, legs_f2, legs_f3,
        legs_contact, legs_f1, legs_f2, legs_f3]
BOB = [1, 1, 0, 0, 1, 1, 0, 0]

frames = []
for i in range(WALK_FRAMES):
    fr = blank()
    paint_base(fr)
    LEGS[i](fr)
    if -NEAR_SWING[i] >= 1:
        draw_far_hand(fr, -NEAR_SWING[i])
    draw_near_arm(fr, NEAR_SWING[i])
    if BOB[i]:
        fr[1:29] = fr[0:28]
        fr[0] = 0
    frames.append(fr)
frames.append(front_frame())

sheet = np.concatenate(frames, axis=1)
Image.fromarray(sheet, "RGBA").save(OUT)
print(f"wrote {OUT} ({sheet.shape[1]}x{sheet.shape[0]}, {len(frames)} frames)")
print("march 2.5px/frame -> SPEED =", int(2.5 * 8 * 3), "px/s at 3x")
