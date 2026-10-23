// The share pictures (dev only): the WhatsApp preview and the icons, laid out in HTML with the site's own font and art
// and rendered by the installed Chrome. Run from the repo root:
//   node tools/share.mjs   → site/og.jpg (1200×630) and site/icons/*.png
// The preview's garden is a Codex drawing, art/raw/og-garden.png (art/prompts/og-garden.txt); her portrait and the
// butterfly are the site's. The favicon, site/icons/favicon.svg, is drawn by hand; favicon-32.png is rendered from it.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import { mkdirSync, statSync } from 'node:fs';

const ROOT = pathToFileURL(process.cwd() + '/').href;
const PAGE = `<style>
  @font-face { font-family: Fredoka; src: url(site/fonts/fredoka.woff2); font-weight: 300 700; }
  body { margin: 0; overflow: hidden; }
</style>`;

// She stands in the middle, inside the square WhatsApp sometimes crops to; the title sits in the open sky on the left
const OG = `${PAGE}<style>
  body { width: 1200px; height: 630px; position: relative; background: url(art/raw/og-garden.png) center 40% / cover; }
  body > * { position: absolute; margin: 0; }
  .glow { left: 330px; top: 20px; width: 540px; height: 600px; background: radial-gradient(closest-side, rgb(244 201 93 / .4), rgb(244 201 93 / 0)); }
  .her { left: 50%; bottom: 14px; height: 590px; translate: -50% 0; filter: drop-shadow(5px 9px 7px rgb(30 8 64 / .4)); }
  h1 { left: 26px; top: 136px; font: 700 57px/1.04 Fredoka; letter-spacing: -0.01em; color: #4B0082; white-space: nowrap;
       text-shadow: 0 3px 0 #FBF7FD, 0 0 22px #FBF7FD, 0 6px 18px rgb(75 0 130 / .3); }
  .bf { width: 84px; filter: drop-shadow(3px 6px 4px rgb(30 8 64 / .35)); }
</style>
<div class="glow"></div>
<img class="her" src="site/img/taneira-wings.webp">
<h1>Taneira<br>is turning<br>two</h1>
<img class="bf" src="site/img/butterfly-a.webp" style="left: 930px; top: 300px; rotate: 18deg">
<img class="bf" src="site/img/butterfly-b.webp" style="left: 268px; top: 400px; width: 60px; rotate: -16deg">`;

const icon = (size, art) => `${PAGE}<style>
  body { width: ${size}px; height: ${size}px; display: grid; place-items: center;
         background: radial-gradient(circle at 30% 25%, #9966CC, #6F2DA8 55%, #4B0082); }
  img { width: ${art * 100}%; filter: drop-shadow(0 ${size / 40}px ${size / 30}px rgb(30 8 64 / .45)); }
</style><img src="site/img/butterfly-a.webp">`;

const ICONS = [
  ['apple-touch-icon.png', 180, 0.74],  // iOS rounds the corners itself
  ['icon-192.png', 192, 0.74],
  ['icon-512.png', 512, 0.74],
  ['icon-maskable-512.png', 512, 0.6],  // inside the central circle a launcher's mask always keeps (80% across)
];

const browser = await chromium.launch({ channel: 'chrome' });
async function render(html, width, height, path, type = 'png') {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(ROOT); // a file:// page, so the art and the font load by their paths in the repo
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const title = await page.evaluate(() => { // the preview's, which must stay left of the middle square
    const h1 = document.querySelector('h1'), r = document.createRange();
    return h1 && (r.selectNodeContents(h1), Math.ceil(r.getBoundingClientRect().right));
  });
  if (title && title > (width - height) / 2 - 10) throw new Error(`the title reaches x = ${title}, into the square WhatsApp may crop to`);
  await page.screenshot({ path, type, ...(type === 'jpeg' && { quality: 80 }) });
  await page.close();
  console.log(`${path} ${width}x${height} ${Math.round(statSync(path).size / 1024)} KB`);
}

await render(OG, 1200, 630, 'site/og.jpg', 'jpeg');
mkdirSync('site/icons', { recursive: true });
for (const [name, size, art] of ICONS) await render(icon(size, art), size, size, `site/icons/${name}`);
await render(`${PAGE}<img src="site/icons/favicon.svg" width="32" height="32" style="display: block">`, 32, 32, 'site/icons/favicon-32.png');
await browser.close();
