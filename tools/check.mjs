// Browser checks for the site (dev only). Serve it first: python3 -m http.server -d site 8000
//   node tools/check.mjs shots   [url]  24 evenly spaced scroll positions at 3 sizes + reduced motion → shots/*.png
//   node tools/check.mjs flicker [url]  slow scroll recorded with GPU memory cut to 48 MB; fails on blank-frame flashes
//   node tools/check.mjs tasks   [url]  slow scroll at phone size with the CPU slowed 4×; fails on main-thread tasks over 50 ms
//   node tools/check.mjs layout  [url]  scrolls through the whole page (1001 points) on 5 screens in Chrome and Safari's
//                                       engine (WebKit), plus reduced motion; fails on anything covering readable text,
//                                       text off the side or off a pinned screen, scenery gaps on a pinned screen, broken
//                                       images, sideways scrolling, small tap targets, console errors or failed requests
//   npm run craft -- --url [url] ...    scroll-craft's own harness (tools/scrollcraft/shoot.mjs, unedited): dead scroll,
//                                       words that never reach full strength, contrast on the composited frame
// Uses the installed Chrome (playwright-core, no browser download) and Homebrew ffmpeg.
import { chromium, webkit, devices } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';

const [mode, url = 'http://127.0.0.1:8000/'] = process.argv.slice(2);
const SIZES = {
  iphone: devices['iPhone 13'],
  android: { viewport: { width: 360, height: 800 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  laptop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
};
const OUT = 'shots';
mkdirSync(OUT, { recursive: true });


// Wheel through the whole page in small steps, like a slow thumb
async function slowScroll(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await page.mouse.move(100, 100);
  for (let y = 0; y < height; y += 20) {
    await page.mouse.wheel(0, 20);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(800);
}

async function shots() {
  const browser = await chromium.launch({ channel: 'chrome' });
  for (const [name, size] of Object.entries(SIZES)) {
    const page = await browser.newPage(size);
    await page.goto(url, { waitUntil: 'networkidle' });
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (let i = 0; i < 24; i++) {
      await page.evaluate(y => scrollTo(0, y), Math.round((i / 23) * max));
      await page.waitForTimeout(900); // lazy images and the peak's frames arrive
      await page.screenshot({ path: `${OUT}/${name}-${i}.png` });
    }
    // one sheet per size, read left to right, top to bottom
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', `${OUT}/${name}-%d.png`, '-vf', 'scale=300:-1,tile=6x4:padding=8:color=white', `${OUT}/${name}.png`]);
    for (let i = 0; i < 24; i++) rmSync(`${OUT}/${name}-${i}.png`);
    await page.close();
  }
  const page = await browser.newPage({ ...SIZES.iphone, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/reduced-motion.png`, fullPage: true });
  await browser.close();
  console.log(`screenshots in ${OUT}/`);
}

async function flicker() {
  // Headed, so the GPU compositor is real. 48 MB on a phone screen (390×664 at 3×) is a busy browser or a cheap
  // phone: about four full screens of layers. The laptop (1440×900 at 2×) gets the same four screens, scaled by its pixels.
  let failed = false;
  for (const name of ['iphone', 'laptop']) {
    const { viewport: v, deviceScaleFactor: d } = SIZES[name];
    const mb = Math.round((48 * v.width * v.height * d * d) / (390 * 664 * 9));
    const browser = await chromium.launch({ channel: 'chrome', headless: false, args: [`--force-gpu-mem-available-mb=${mb}`] });
    const dir = `${OUT}/video-${name}`;
    rmSync(dir, { recursive: true, force: true });
    const { viewport } = SIZES[name];
    const ctx = await browser.newContext({ ...SIZES[name], recordVideo: { dir, size: viewport } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await slowScroll(page);
    await ctx.close();
    await browser.close();
    // A flash is a blink: the picture jumps away at frame i and is back within 4 frames.
    // (A fast scroll past a dark/light scene edge also changes a lot, but it doesn't come back, so it doesn't count.)
    const w = 64, h = Math.round((w * viewport.height) / viewport.width / 2) * 2;
    const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', `${dir}/${readdirSync(dir)[0]}`, '-vf', `scale=${w}:${h},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 });
    const frames = Array.from({ length: raw.length / (w * h) }, (_, i) => raw.subarray(i * w * h, (i + 1) * w * h));
    const diff = (a, b) => a.reduce((sum, v, k) => sum + Math.abs(v - b[k]), 0) / a.length;
    const flashes = [];
    for (let i = 26; i < frames.length - 1; i++) { // skip the first second (page load)
      if (diff(frames[i - 1], frames[i]) < 40) continue;
      const back = [1, 2, 3, 4].find(k => frames[i + k] && diff(frames[i - 1], frames[i + k]) < 20);
      if (back) { flashes.push(i); i += back; }
    }
    // A stop is the scroll moving while the picture doesn't: the longest run of frames with almost no change.
    let still = 0, stillEnd = 0, run = 0;
    for (let i = 26; i < frames.length - 30; i++) { // ignore the last second (end of page)
      run = diff(frames[i - 1], frames[i]) < 0.3 ? run + 1 : 0;
      if (run > still) [still, stillEnd] = [run, i];
    }
    // A hit is the picture going from moving to nearly frozen within a few frames while the scroll keeps going,
    // like a stage that pins as it arrives. Speeds are smoothed over 3 frames.
    const speed = frames.map((f, i) => (i ? diff(frames[i - 1], f) : 0));
    const avg = i => (speed[i] + speed[i - 1] + speed[i - 2]) / 3;
    const hits = [];
    for (let i = 30; i < frames.length - 30; i++) if (avg(i - 4) > 3 && avg(i) < 0.3 * avg(i - 4) && !hits.some(h => i - h < 10)) hits.push(i);
    console.log(`${name} (${mb} MB): ${frames.length} frames, flashes ${flashes.length ? `at frames ${flashes.join(', ')}` : 'none'}, ` +
      `hits ${hits.length ? `${hits.length} (at ${hits.map(h => (h / 25).toFixed(1) + ' s').join(', ')})` : 'none'}, longest still stretch ${(still / 25).toFixed(1)} s${still ? ` (ending ${(stillEnd / 25).toFixed(1)} s)` : ''}`);
    failed ||= flashes.length > 0;
  }
  process.exitCode = failed ? 1 : 0;
}

async function tasks() {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage(SIZES.iphone);
  await page.goto(url, { waitUntil: 'networkidle' });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => {
    window.longTasks = [];
    new PerformanceObserver(list => window.longTasks.push(...list.getEntries().map(e => Math.round(e.duration)))).observe({ type: 'longtask' });
  });
  await slowScroll(page);
  const long = await page.evaluate(() => window.longTasks);
  console.log(long.length ? `long tasks while scrolling (ms): ${long.join(', ')}` : 'no main-thread task over 50 ms while scrolling');
  await browser.close();
  process.exitCode = long.length ? 1 : 0;
}

// Runs inside the page. Scrolls through the whole page in small steps (waiting two frames each, so the scroll-craft
// engine and GSAP have both drawn that position), measures, and returns what's wrong as { rule, what, at }, with `at`
// the scroll position in screens.
async function audit(steps) {
  const TEXT = 'main h1, main h2, main p:not([aria-hidden]), main li, main dt, main dd, main .btn'; // read by guests: measured tight around the glyphs
  const BOXES = 'main .btn';                                                                        // buttons: measured as boxes
  const DECOR = '.cat, .her img, .two, .bf';                                                         // art that must not sit on text
  const W = innerWidth, H = innerHeight;
  // A line-by-line headline is forced to opacity 1 by the engine, which fades its line units instead (scroll-craft
  // verify.md): read it through them.
  const opacity = el => {
    let o = 1;
    for (let e = el; e; e = e.parentElement) o *= +getComputedStyle(e).opacity;
    if (el.classList.contains('sc-is-split')) o *= Math.max(0, ...[...el.querySelectorAll('.sc-split__i')].map(u => +getComputedStyle(u).opacity));
    return o;
  };
  const shown = el => getComputedStyle(el).visibility === 'visible' && el.getClientRects().length > 0 && opacity(el) >= 0.1;
  const glyphs = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
  const name = el => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 28)}"`;
  // a stage is pinned while it sits at the top of the screen: what's on it must then be fully on screen
  const pinned = el => { const st = el.closest('[data-sc-stage]'); return st && Math.abs(st.getBoundingClientRect().top) < 1; };
  // the iris clips her portrait: until it has opened, the portrait isn't really there
  const clipped = el => { const f = el.closest('[data-sc-reveal]'); return f && /circle\(0(\.0+)?%/.test(f.style.clipPath); };
  const found = [];

  function measure(at) {
    const text = [...document.querySelectorAll(TEXT)].filter(el => el.textContent.trim() && shown(el)).map(el => ({ el, r: glyphs(el), o: opacity(el) }));
    const others = [...document.querySelectorAll(`${BOXES}, ${DECOR}`)].filter(el => shown(el) && !clipped(el)).map(el => ({ el, r: el.getBoundingClientRect() }));
    for (const a of text) {
      for (const b of [...text, ...others]) {
        if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
        if (text.includes(b) && a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_PRECEDING) continue; // each text pair once
        if (hit(a.r, b.r)) found.push({ rule: 'covers text', what: `${name(b.el)} over ${name(a.el)}`, at });
      }
      if (a.r.left < -1 || a.r.right > W + 1) found.push({ rule: 'text off the side', what: name(a.el), at });
      if (a.o >= 0.9 && pinned(a.el) && (a.r.top < -1 || a.r.bottom > H + 1)) found.push({ rule: 'text off a pinned screen', what: name(a.el), at });
    }
    // scenery: a frame of art must fill its box down to the bottom (and both sides on a phone), wherever it is
    for (const f of document.querySelectorAll('main .frame')) {
      if (!shown(f)) continue;
      const box = f.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > H) continue;
      const rs = [...f.querySelectorAll('img')].filter(shown).map(e => e.getBoundingClientRect());
      const gap = box.bottom - Math.max(...rs.map(r => r.bottom));
      if (gap > 1) found.push({ rule: 'scenery gap', what: `${f.closest('section').className}: ends ${Math.round(gap)}px above the bottom`, at });
      if (W / H <= 2 / 3 && (Math.min(...rs.map(r => r.left)) > 1 || Math.max(...rs.map(r => r.right)) < W - 1))
        found.push({ rule: 'scenery gap', what: `${f.closest('section').className}: doesn't reach both sides`, at });
    }
    for (const img of document.querySelectorAll('main img')) if (shown(img) && img.complete && !img.naturalWidth) found.push({ rule: 'broken image', what: img.src, at });
    if (document.documentElement.scrollWidth > W + 1) found.push({ rule: 'sideways scroll', what: `page is ${document.documentElement.scrollWidth}px wide`, at });
  }

  for (const btn of document.querySelectorAll('.btn')) if (btn.getBoundingClientRect().height < 44) found.push({ rule: 'small tap target', what: name(btn), at: '-' });
  const max = document.documentElement.scrollHeight - H;
  for (let i = 0; i <= steps; i++) {
    scrollTo({ top: (i / steps) * max, behavior: 'instant' });
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    measure(((i / steps) * max / H).toFixed(2));
  }
  return found;
}

const LAYOUT = [
  ['iphone 13, safari engine', webkit, devices['iPhone 13']],
  ['iphone 13, chrome', chromium, SIZES.iphone],
  ['small phone (se), safari engine', webkit, { viewport: { width: 375, height: 548 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ['large android', chromium, { viewport: { width: 412, height: 839 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true }],
  ['android 360', chromium, SIZES.android],
  ['laptop', chromium, SIZES.laptop],
  ['iphone 13, reduced motion', webkit, { ...devices['iPhone 13'], reducedMotion: 'reduce' }],
];

async function layout() {
  let total = 0;
  for (const [name, engine, size] of LAYOUT) {
    const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
    const page = await browser.newPage(size);
    const errors = [];
    page.on('console', m => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', e => errors.push(String(e)));
    page.on('response', r => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
    await page.goto(url, { waitUntil: 'networkidle' });
    // scroll it once so lazy images and the peak's frames load before they're judged
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 120)); }
      scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForLoadState('networkidle');
    const found = await page.evaluate(audit, 1000);
    for (const e of errors) found.push({ rule: 'console or network error', what: e, at: '-' });
    // one line per problem, with the scroll positions (in screens) where it shows
    const grouped = new Map();
    for (const f of found) grouped.set(`${f.rule}: ${f.what}`, [...(grouped.get(`${f.rule}: ${f.what}`) || []), f.at]);
    console.log(`${name}: ${grouped.size ? `${grouped.size} problem(s)` : 'ok'}`);
    for (const [k, ats] of grouped) console.log(`  ${k}  (at ${ats[0]}${ats.length > 1 ? ` – ${ats.at(-1)}, ${ats.length} points` : ''})`);
    total += grouped.size;
    await browser.close();
  }
  process.exitCode = total ? 1 : 0;
}

await { shots, flicker, tasks, layout }[mode]();
