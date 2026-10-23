// Requires Playwright (with Chromium) and ffmpeg.
// Usage: node scripts/build_og_video.cjs /path/to/MessySharpie.woff2
// Uses the same two-line layout as og-image.png. The image remains the poster.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { chromium } = require('playwright');

// Pen paths in each glyph's ink bounds; the font itself masks the strokes.
const strokes = {
  T: [[[.08,.28],[.92,.1]], [[.53,.2],[.56,.48],[.72,.91]]],
  h: [[[.2,.1],[.08,.9]], [[.88,.1],[.88,.9]], [[.16,.6],[.84,.52]]],
  i: [[[.5,.43],[.5,.9]], [[.5,.08],[.5,.12]]],
  s: [[[.68,.15],[.48,.1],[.24,.26],[.2,.45],[.4,.54],[.72,.55],[.88,.7],[.75,.87],[.2,.89]]],
  t: [[[.08,.24],[.93,.08]], [[.48,.2],[.5,.55],[.58,.9]]],
  e: [[[.17,.15],[.17,.88],[.88,.8]], [[.18,.15],[.8,.12]], [[.18,.51],[.62,.48]]],
  w: [[[.08,.15],[.28,.9],[.42,.28],[.69,.69],[.92,.17]]],
  b: [[[.16,.12],[.19,.9]], [[.18,.17],[.58,.09],[.85,.17],[.84,.31],[.58,.46],[.22,.53],[.66,.54],[.88,.72],[.77,.87],[.2,.88]]],
  o: [[[.61,.13],[.35,.14],[.16,.37],[.13,.63],[.27,.86],[.57,.91],[.84,.73],[.87,.43],[.75,.18],[.56,.12]]],
  f: [[[.13,.91],[.12,.16],[.87,.1]], [[.16,.55],[.7,.49]]],
  J: [[[.08,.26],[.94,.08]], [[.48,.22],[.55,.49],[.61,.7],[.55,.89],[.4,.92],[.14,.75]]],
  L: [[[.19,.08],[.14,.86],[.38,.9],[.88,.85]]],
  u: [[[.1,.1],[.13,.6],[.27,.83],[.43,.85],[.69,.43],[.71,.2],[.9,.88]]],
  m: [[[.1,.86],[.29,.2],[.46,.6],[.71,.09],[.91,.88]]],
  a: [[[.1,.88],[.56,.14],[.74,.1],[.9,.92]], [[.3,.65],[.8,.58]]],
  r: [[[.14,.89],[.2,.32],[.37,.12],[.63,.1],[.83,.28],[.76,.46],[.25,.59],[.52,.66],[.89,.93]]],
  '.': [[[.5,.4],[.5,.6]]],
};

async function main() {
  if (!process.argv[2]) throw new Error('Pass the MessySharpie.woff2 font file.');
  const font = fs.readFileSync(process.argv[2]).toString('base64');
  const output = path.resolve(__dirname, '../landing_page/og-video.mp4');
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    args: ['--single-process'],
  });
  let encoder;
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(`<style>
      @font-face { font-family: MessySharpie; src: url(data:font/woff2;base64,${font}) format('woff2'); }
      html, body { margin: 0; width: 1200px; height: 630px; }
      body { display: flex; align-items: center; justify-content: center; }
      h1 { margin: 0; font: normal 72px/1.35 MessySharpie; text-align: center; transform: translateY(-5px); }
      i { display: inline-block; width: 0; height: 0; }
      canvas { position: absolute; inset: 0; }
    </style><h1><span>This is the website<i></i></span><br><span>of Jesse Lumarie.<i></i></span></h1><canvas width="1200" height="630"></canvas>`);
    await page.evaluate(async (strokes) => {
      await document.fonts.ready;
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = '72px MessySharpie';
      const glyphs = [];
      let distance = 0;
      for (const line of document.querySelectorAll('h1 span')) {
        const text = line.firstChild.textContent;
        const left = line.getBoundingClientRect().left;
        const baseline = line.querySelector('i').getBoundingClientRect().top;
        [...text].forEach((letter, index) => {
          if (letter === ' ') { distance += 25; return; }
          const m = ctx.measureText(letter);
          const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
          const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
          const ink = document.createElement('canvas');
          ink.width = Math.ceil(width + 4); ink.height = Math.ceil(height + 4);
          const pen = ink.getContext('2d'); pen.font = ctx.font;
          pen.fillText(letter, m.actualBoundingBoxLeft + 2, m.actualBoundingBoxAscent + 2);
          const paths = strokes[letter].map(points => {
            const coords = points.map(([x,y]) => [2 + x * width, 2 + y * height]);
            const lengths = coords.slice(1).map((point, i) => Math.hypot(point[0]-coords[i][0], point[1]-coords[i][1]));
            return { coords, lengths, length: lengths.reduce((sum, n) => sum + n, 0) };
          });
          const length = paths.reduce((sum, p) => sum + p.length, 0);
          glyphs.push({ ink, paths, width, height, start: distance, length,
            x: left + ctx.measureText(text.slice(0, index)).width - m.actualBoundingBoxLeft - 2,
            y: baseline - m.actualBoundingBoxAscent - 2 });
          distance += length + 12;
        });
        distance += 65;
      }
      const mask = document.createElement('canvas');
      window.drawFrame = (time) => {
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1200, 630);
        const progress = Math.max(0, Math.min(1, (time - .35) / 5.2)) * distance;
        for (const glyph of glyphs) {
          let remaining = progress - glyph.start;
          if (remaining <= 0) continue;
          if (remaining >= glyph.length) { ctx.drawImage(glyph.ink, glyph.x, glyph.y); continue; }
          mask.width = glyph.ink.width; mask.height = glyph.ink.height;
          const pen = mask.getContext('2d');
          pen.lineWidth = Math.max(glyph.width * .48, glyph.height * .32);
          pen.lineCap = 'round'; pen.lineJoin = 'round';
          for (const stroke of glyph.paths) {
            if (remaining <= 0) break;
            pen.beginPath(); pen.moveTo(...stroke.coords[0]);
            for (let i = 0; i < stroke.lengths.length; i++) {
              const ratio = Math.min(1, remaining / stroke.lengths[i]);
              const [x,y] = stroke.coords[i], [nextX,nextY] = stroke.coords[i+1];
              pen.lineTo(x + (nextX-x)*ratio, y + (nextY-y)*ratio);
              remaining -= stroke.lengths[i];
              if (ratio < 1) break;
            }
            pen.stroke();
          }
          pen.globalCompositeOperation = 'source-in'; pen.drawImage(glyph.ink, 0, 0);
          ctx.drawImage(mask, glyph.x, glyph.y);
        }
        return canvas.toDataURL('image/png').split(',')[1];
      };
    }, strokes);
    encoder = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output], { stdio: ['pipe', 'inherit', 'inherit'] });
    const finished = once(encoder, 'close');
    for (let frame = 0; frame < 240; frame++) {
      const png = await page.evaluate(time => window.drawFrame(time), frame / 30);
      if (!encoder.stdin.write(Buffer.from(png, 'base64'))) await once(encoder.stdin, 'drain');
    }
    encoder.stdin.end();
    const [code] = await finished;
    if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
    console.log(`Rendered ${output} (8 seconds, 1200 × 630, 30 fps).`);
  } finally {
    if (encoder && encoder.exitCode === null) encoder.kill();
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
