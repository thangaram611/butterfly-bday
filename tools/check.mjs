// Browser checks for the site (dev only). Serve it first: python3 -m http.server -d site 8000
//   node tools/check.mjs all     [url]  everything that must pass before a change is shown (npm run check): layout, craft,
//                                       weight, share, invite and offline side by side, then tasks, flicker and
//                                       lighthouse, each alone; about 3 minutes
//   node tools/check.mjs shots   [url]  24 evenly spaced scroll positions at 3 sizes + reduced motion → shots/*.png
//   node tools/check.mjs weight  [url]  what a phone downloads, as it will travel (code gzipped, images as they are):
//                                       fails over the first screen's 450 KB, the whole page's 2500 or the code's 120
//   node tools/check.mjs share   [url]  the WhatsApp preview and the icons, as the page declares them: sizes, types,
//                                       weights; on a deployed page, og:image must be a full address
//   node tools/check.mjs invite  [url]  the invitation's working parts on an iPhone and an Android: in step with
//                                       event.json, countdown, calendar link, a family's link, thanks after the reply,
//                                       and the link helper (links.html)
//   node tools/check.mjs offline [url]  a family's link opened once, then the plain address with no signal: greeting,
//                                       details, every picture; and the manifest opens it like an app
//   node tools/check.mjs lighthouse [url]  mobile performance at least 90, layout shift under 0.05, measured over HTTP/2
//                                       with text compressed, as Cloudflare will serve it
//   node tools/check.mjs flicker [url]  slow scroll recorded with GPU memory cut to 48 MB; fails on blank-frame flashes
//   node tools/check.mjs tasks   [url]  slow scroll at phone size with the CPU slowed 4×; fails on main-thread tasks over 50 ms
//   node tools/check.mjs layout  [url]  watches the garden's butterflies play, then scrolls through the whole page (1001
//                                       points) and back up, on 5 phone screens, a laptop and a wide desktop in Chrome
//                                       and Safari's engine (WebKit), plus reduced motion; fails on anything covering
//                                       readable text, text off the side or off a pinned screen, the vine's words
//                                       outside the garden, scenery that doesn't reach both sides of the screen, a
//                                       phone downloading the wide screens' art, a drawing left
//                                       half-dissolved once the scroll rests, butterflies that don't all come back to
//                                       the garden, broken images, sideways scrolling, small tap targets, console errors
//                                       or failed requests
//   node tools/check.mjs craft   [url]  scroll-craft's own harness (tools/scrollcraft/shoot.mjs, unedited) at phone size,
//                                       laptop size and with reduced motion, side by side: dead scroll, words that never
//                                       reach full strength, contrast on the composited frame, console errors
//   npm run craft -- --url [url] ...    one pass of the harness, with its own options
// Uses the installed Chrome (playwright-core, no browser download) and Homebrew ffmpeg.
import { chromium, webkit, devices } from 'playwright-core';
import { execFile, execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';

const [mode, url = 'http://127.0.0.1:8000/'] = process.argv.slice(2);
const SIZES = {
  iphone: devices['iPhone 13'],
  android: { viewport: { width: 360, height: 800 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  laptop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
};
const OUT = 'shots';
mkdirSync(OUT, { recursive: true });


// Chrome sometimes takes minutes to quit: wait 5 s at most (Playwright ends whatever is left when the run exits)
const close = browser => Promise.race([browser.close(), new Promise(r => setTimeout(r, 5000))]);

// Wheel through the whole page in small steps, like a slow thumb
async function slowScroll(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
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
  await close(browser);
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
    await close(browser);
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
  return failed ? 1 : 0;
}

// The weight, as it will travel (code and text gzipped, as the host serves them; images and fonts as they are), against
// PLAN.md's budgets: the first screen (everything a phone downloads before the page's load event), the whole page, and
// its code (HTML, CSS, JS and fonts).
const BUDGET = { first: 450, page: 2500, code: 120 };
async function weight() {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage(SIZES.iphone);
  const bodies = new Map();
  page.on('response', r => bodies.set(r.url(), r.body().catch(() => null)));
  await page.goto(url, { waitUntil: 'load' });
  const before = await page.evaluate(() => {
    const load = performance.getEntriesByType('navigation')[0].loadEventStart;
    return [location.href, ...performance.getEntriesByType('resource').filter(r => r.responseEnd <= load).map(r => r.name)];
  });
  await page.waitForLoadState('networkidle'); // the pictures further down come once the first screen is painted
  const all = await page.evaluate(() => [...new Set([location.href, ...performance.getEntriesByType('resource').map(r => r.name)])]);
  const text = name => /\.(js|css|html|svg|json|webmanifest)$|\/$/.test(new URL(name).pathname);
  const kb = async name => { const body = await bodies.get(name); return body ? (text(name) ? gzipSync(body, { level: 9 }) : body).length / 1024 : 0; };
  const rows = [];
  for (const name of before) rows.push([name.replace(new URL(url).origin + '/', '') || 'index.html', Math.round(await kb(name))]);
  let whole = 0, code = 0;
  for (const name of all) {
    const k = await kb(name);
    whole += k;
    if (/\.(html|css|js|woff2)$|\/$/.test(new URL(name).pathname)) code += k;
  }
  await close(browser);
  rows.sort((a, b) => b[1] - a[1]);
  const first = rows.reduce((n, [, k]) => n + k, 0);
  [whole, code] = [whole, code].map(Math.round);
  console.log(`first screen: ${first} KB (budget ${BUDGET.first} KB), the heaviest: ${rows.slice(0, 8).map(([f, k]) => `${f} ${k}`).join(', ')}\n` +
    `whole page: ${whole} KB (budget ${BUDGET.page} KB); code: ${code} KB (budget ${BUDGET.code} KB)`);
  return (first > BUDGET.first) + (whole > BUDGET.page) + (code > BUDGET.code);
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
  await close(browser);
  return long.length ? 1 : 0;
}

// Runs inside the page. Scrolls through the whole page in small steps (waiting two frames each, so the scroll-craft
// engine and GSAP have both drawn that position), measures, and returns what's wrong as { rule, what, at }, with `at`
// the scroll position in screens.
async function audit(steps) {
  const TEXT = 'main h1, main h2, main p:not([aria-hidden]), main li, main dt, main dd, main figcaption, main .btn'; // read by guests: measured tight around the glyphs
  const BOXES = 'main .btn';                                                                        // buttons: measured as boxes
  const DECOR = '.caterpillar img, .memory .pic, .twig, .change img, .flyer img, .her img, .two, .bf, .cake, .card .ornament'; // art that must not sit on text
  const SCENERY = '.world .sky, .world .hills, .world .wisteria, .world .meadow, .world .blossoms, .world .foliage, .evening .scene';
  const DRAWINGS = '.caterpillar, .change img, .flyer img';                                          // must come to rest whole
  const POSES = '.caterpillar, .change img';                // one each (the butterfly takes off from the last frame, as one)
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
  // a stage is pinned while it sits at the top of the screen: what stands on it must then be fully on screen (words
  // that travel with the story's vine, .words, scroll through it like a page and are exempt)
  const pinned = el => { const st = el.closest('.stage, [data-sc-stage]'); return st && !el.closest('.words') && Math.abs(st.getBoundingClientRect().top) < 1; };
  const onScreen = r => r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;
  // Art may pass behind words only when the words sit on their own opaque paper (the vine's tags): words without it
  // lose their legibility over art whichever way round they paint. On a tag, the art covers them only if it paints over
  // the tag: compared where their ancestries part, the higher z-index wins, then the later in the page.
  const onTag = el => {
    for (let e = el; e && !e.matches('.stage, section, main'); e = e.parentElement) {
      const m = getComputedStyle(e).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || +m[3] >= 0.9) && !(m.length === 4 && +m[3] === 0)) return true;
    }
    return false;
  };
  const above = (b, a) => {
    const chain = el => { const c = []; for (let e = el; e; e = e.parentElement) c.unshift(e); return c; };
    const ca = chain(a), cb = chain(b);
    let i = 0;
    while (ca[i] && ca[i] === cb[i]) i++;
    const x = ca[i], y = cb[i];
    if (!x || !y) return true;
    const z = e => parseInt(getComputedStyle(e).zIndex) || 0;
    return z(y) !== z(x) ? z(y) > z(x) : !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
  };
  // the iris clips her portrait: until it has opened, the portrait isn't really there
  const clipped = el => { const f = el.closest('[data-sc-reveal]'); return f && /circle\(0(\.0+)?%/.test(f.style.clipPath); };
  const found = [];

  function measure(at) {
    const text = [...document.querySelectorAll(TEXT)].filter(el => el.textContent.trim() && shown(el)).map(el => ({ el, r: glyphs(el), o: opacity(el) })).filter(t => onScreen(t.r));
    const others = [...document.querySelectorAll(`${BOXES}, ${DECOR}`)].filter(el => shown(el) && !clipped(el)).map(el => ({ el, r: el.getBoundingClientRect() })).filter(o => onScreen(o.r));
    for (const a of text) {
      for (const b of [...text, ...others]) {
        if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
        if (text.includes(b) && a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_PRECEDING) continue; // each text pair once
        if (hit(a.r, b.r) && (text.includes(b) || !onTag(a.el) || above(b.el, a.el))) found.push({ rule: 'covers text', what: `${name(b.el)} over ${name(a.el)}`, at });
      }
      if (a.r.left < -1 || a.r.right > W + 1) found.push({ rule: 'text off the side', what: name(a.el), at });
      if (a.o >= 0.9 && pinned(a.el) && (a.r.top < -1 || a.r.bottom > H + 1)) found.push({ rule: 'text off a pinned screen', what: name(a.el), at });
    }
    // scenery: the garden's layers, the vine's foliage and the evening reach both sides of the screen wherever they
    // show, counting the sides a wide screen gets (their ::before and ::after, site.css)
    for (const el of document.querySelectorAll(SCENERY)) {
      const r = el.getBoundingClientRect();
      if (!shown(el) || !onScreen(r)) continue;
      let left = r.left, right = r.right;
      for (const host of [el, ...el.children]) for (const side of ['::before', '::after']) {
        const s = getComputedStyle(host, side);
        if (s.content === 'none' || s.position !== 'absolute') continue;
        const x = host.getBoundingClientRect().left + parseFloat(s.left);
        left = Math.min(left, x);
        right = Math.max(right, x + parseFloat(s.width));
      }
      if (left > 1 || right < W - 1) found.push({ rule: 'scenery gap', what: `${name(el)} spans ${Math.round(left)}–${Math.round(right)} of ${W}px`, at });
    }
    // the vine's words keep to the garden's frame (a phone's is wider than its screen): a paper tag as a whole
    const frame = document.querySelector('.world .sky').getBoundingClientRect();
    for (const t of text) {
      const r = onTag(t.el) ? t.el.getBoundingClientRect() : t.r;
      if (t.el.closest('.words') && (r.left < Math.max(0, frame.left) - 1 || r.right > Math.min(W, frame.right) + 1)) found.push({ rule: 'words outside the garden', what: name(t.el), at });
    }
    for (const img of document.querySelectorAll('main img')) if (shown(img) && img.complete && !img.naturalWidth) found.push({ rule: 'broken image', what: img.src, at });
    if (document.documentElement.scrollWidth > W + 1) found.push({ rule: 'sideways scroll', what: `page is ${document.documentElement.scrollWidth}px wide`, at });
  }

  // drawings caught part-way through a dissolve (two of them half there, a blur): fine while it plays, never at rest
  const half = () => [...document.querySelectorAll(DRAWINGS)].filter(el => getComputedStyle(el).visibility === 'visible' && opacity(el) > 0.05 && opacity(el) < 0.95);
  // and while one dissolves into the next, only those two may show
  const file = el => el.currentSrc?.split('/').slice(-2).join('/') ?? el.className;
  const crowd = at => {
    const on = [...document.querySelectorAll(POSES)].filter(el => getComputedStyle(el).visibility === 'visible' && opacity(el) > 0.05);
    if (on.length > 2) found.push({ rule: 'more than two drawings at once', what: on.map(file).join(', '), at });
  };

  for (const btn of document.querySelectorAll('.btn')) if (btn.getBoundingClientRect().height < 44) found.push({ rule: 'small tap target', what: name(btn), at: '-' });
  // the garden's butterflies at play (js/butterflies.js): watch them for 12 s, every half second startling the highest
  // one up from just below it, so one that darts up into the title's words is caught
  for (let t = 0; t < 12000; t += 100) {
    const high = [...document.querySelectorAll('.world .friends .bf')].filter(shown).map(el => el.getBoundingClientRect()).filter(onScreen).sort((a, b) => a.top - b.top)[0];
    if (t % 500 === 0 && high) {
      const x = (high.left + high.right) / 2, y = high.bottom + 30;
      document.elementFromPoint(x, y)?.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
    }
    await new Promise(r => setTimeout(r, 100));
    measure('0.00 at play');
  }
  const max = document.documentElement.scrollHeight - H;
  const blurred = [];
  for (let i = 0; i <= steps; i++) {
    scrollTo({ top: (i / steps) * max, behavior: 'instant' });
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    measure(((i / steps) * max / H).toFixed(2));
    crowd(((i / steps) * max / H).toFixed(2));
    if (half().length) blurred.push(i);
  }
  // where a drawing was caught half-dissolved, rest there (every third such point) and look again, watching it settle
  for (const i of blurred.filter((_, k) => k % 3 === 0)) {
    const at = ((i / steps) * max / H).toFixed(2);
    scrollTo({ top: (i / steps) * max, behavior: 'instant' });
    for (let t = 0; t < 700; t += 50) {
      await new Promise(r => setTimeout(r, 50));
      crowd(at);
    }
    for (const el of half()) found.push({ rule: 'half-dissolved drawing at rest', what: file(el), at });
  }
  // back up the page: the story plays backwards, and the butterflies that came along go with it, then rejoin the
  // others in the garden, all of them back in its layer, on the screen
  for (let i = steps; i >= 0; i -= 4) {
    scrollTo({ top: (i / steps) * max, behavior: 'instant' });
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    measure(`${((i / steps) * max / H).toFixed(2)} back`);
  }
  const all = document.querySelectorAll('.bf.friend').length, home = () => [...document.querySelectorAll('.world .friends .bf')].filter(el => shown(el) && onScreen(el.getBoundingClientRect())).length;
  for (let t = 0; t < 10000 && home() < all; t += 250) await new Promise(r => setTimeout(r, 250)); // they fly home at their own pace
  if (home() < all) found.push({ rule: 'not all back in the garden', what: `${home()} of ${all} butterflies after 10 s`, at: '0.00 back' });
  return found;
}

const LAYOUT = [
  ['iphone 13, safari engine', webkit, devices['iPhone 13']],
  ['iphone 13, chrome', chromium, SIZES.iphone],
  ['small phone (se), safari engine', webkit, { viewport: { width: 375, height: 548 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ['large android', chromium, { viewport: { width: 412, height: 839 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true }],
  ['android 360', chromium, SIZES.android],
  ['laptop', chromium, SIZES.laptop],
  ['wide desktop', chromium, { viewport: { width: 2400, height: 920 } }], // near the widest the garden's sides reach
  ['iphone 13, reduced motion', webkit, { ...devices['iPhone 13'], reducedMotion: 'reduce' }],
];

// The setups side by side, each in its own fresh context of one browser per engine: nothing in the audit measures
// speed, so they don't skew each other. Reported in order.
async function layout() {
  const browsers = new Map(LAYOUT.map(([, engine]) => [engine, null]));
  for (const engine of browsers.keys()) browsers.set(engine, engine.launch(engine === chromium ? { channel: 'chrome' } : {}));
  const reports = await Promise.all(LAYOUT.map(async ([name, engine, size]) => {
    const context = await (await browsers.get(engine)).newContext(size), page = await context.newPage();
    const errors = [];
    page.on('console', m => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', e => errors.push(String(e)));
    page.on('response', r => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
    page.on('request', r => size.isMobile && r.url().includes('/img/wide/') && errors.push(`a phone downloads ${r.url()}`)); // wide screens' only
    await page.goto(url, { waitUntil: 'networkidle' });
    // scroll it once so every image is in the cache, then judge a fresh page: what happens the first time matters
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 120)); }
      scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForLoadState('networkidle');
    await page.reload({ waitUntil: 'networkidle' });
    const found = await page.evaluate(audit, 1000);
    for (const e of errors) found.push({ rule: 'console or network error', what: e, at: '-' });
    // one line per problem, with the scroll positions (in screens) where it shows
    const grouped = new Map();
    for (const f of found) grouped.set(`${f.rule}: ${f.what}`, [...(grouped.get(`${f.rule}: ${f.what}`) || []), f.at]);
    await context.close();
    return [`${name}: ${grouped.size ? `${grouped.size} problem(s)` : 'ok'}`,
      ...[...grouped].map(([k, ats]) => `  ${k}  (at ${ats[0]}${ats.length > 1 ? ` – ${ats.at(-1)}, ${ats.length} points` : ''})`)];
  }));
  for (const browser of await Promise.all(browsers.values())) await close(browser);
  console.log(reports.flat().join('\n'));
  return reports.reduce((n, r) => n + r.length - 1, 0);
}
// What WhatsApp and a phone's home screen read from the page as served, without running it (tools/share.mjs makes the
// pictures): the preview, a JPEG of 1200×630 under 300 KB (WhatsApp may skip a heavier one), and every icon at the size
// it declares, the iPhone's and the maskable one with no transparency. Each file is fetched at its path on the server
// under test; on a deployed page, og:image must also be a full address (WhatsApp may not resolve a relative one).
async function share() {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const { problems, found } = await page.evaluate(async () => {
    const problems = [], found = [];
    const doc = new DOMParser().parseFromString(await (await fetch(location.href)).text(), 'text/html');
    const meta = p => doc.querySelector(`meta[property="${p}"]`)?.content;
    const load = async (src, base, want) => {
      const res = await fetch(new URL(new URL(src, base).pathname, location.href));
      if (!res.ok) return problems.push(`${src}: ${res.status}`);
      const blob = await res.blob(), kb = Math.round(blob.size / 1024), img = new Image();
      img.src = URL.createObjectURL(blob);
      if (!(await img.decode().then(() => true, () => false))) return problems.push(`${src}: doesn't decode`);
      const size = `${img.naturalWidth}x${img.naturalHeight}`;
      if (want.type && blob.type !== want.type) problems.push(`${src}: ${blob.type}, not ${want.type}`);
      if (want.size && size !== want.size) problems.push(`${src}: ${size}, not ${want.size}`);
      if (want.kb && kb > want.kb) problems.push(`${src}: ${kb} KB, over ${want.kb} KB`);
      if (want.opaque) {
        const c = new OffscreenCanvas(img.naturalWidth, img.naturalHeight).getContext('2d');
        c.drawImage(img, 0, 0);
        if (c.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data.some((v, i) => i % 4 === 3 && v < 255)) problems.push(`${src}: has transparency`);
      }
      found.push(`${src.split('/').pop()} ${blob.type === 'image/svg+xml' ? '' : size + ' '}${kb} KB`);
    };

    for (const p of ['og:title', 'og:description', 'og:image']) if (!meta(p)) problems.push(`no ${p}`);
    const og = meta('og:image');
    if (og) {
      if (!/^https:\/\//.test(og) && !/^(localhost|127\.|10\.|192\.168\.)/.test(location.hostname)) problems.push(`og:image is not a full https address: ${og}`);
      await load(og, location.href, { type: 'image/jpeg', size: '1200x630', kb: 300 });
      if (`${meta('og:image:width')}x${meta('og:image:height')}` !== '1200x630') problems.push('og:image:width and height are not 1200x630');
    }
    for (const link of doc.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')) {
      const href = link.getAttribute('href'), svg = link.type === 'image/svg+xml';
      if (link.rel === 'apple-touch-icon') await load(href, location.href, { type: 'image/png', size: '180x180', opaque: true });
      else await load(href, location.href, svg ? { type: 'image/svg+xml', kb: 2 } : { type: 'image/png', size: link.sizes.value.replace(' ', '') || 'declared' });
    }
    const manifest = doc.querySelector('link[rel="manifest"]')?.getAttribute('href');
    if (!manifest) problems.push('no manifest');
    else {
      const base = new URL(manifest, location.href), { icons = [] } = await (await fetch(base)).json();
      for (const i of icons) await load(i.src, base, { type: i.type, size: i.sizes, opaque: i.purpose === 'maskable' });
      for (const need of ['192x192', '512x512']) if (!icons.some(i => i.sizes === need)) problems.push(`manifest: no ${need} icon`);
      if (!icons.some(i => i.purpose === 'maskable')) problems.push('manifest: no maskable icon');
    }
    return { problems, found };
  });
  await close(browser);
  console.log(problems.length ? `share: ${problems.length} problem(s)\n  ${problems.join('\n  ')}` : `share: ok (${found.join(', ')})`);
  return problems.length;
}

// Offline after one visit (sw.js), as a guest at the venue with no signal: their family's link opened once and read to
// the end, then, with the network cut, the invite opened again from its plain address, as from the home screen. It must
// greet them, show the details, and have every picture it shows. And the manifest must open it like an app.
async function offline() {
  const problems = [], name = 'Ravi Uncle & family';
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext(SIZES.android);
  const page = await context.newPage();
  await page.goto(`${url}?to=${encodeURIComponent(name)}`, { waitUntil: 'networkidle' });
  const read = async p => p.evaluate(async () => { // to the end, slowly enough for each picture to arrive
    for (let y = 0; y <= document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 120)); }
  });
  await read(page);
  await page.waitForLoadState('networkidle');
  if (!(await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 5000 }).catch(() => null))) problems.push('no offline worker (sw.js) took charge of the page');
  const copied = () => page.evaluate(async () => { const [name] = await caches.keys(); return name ? (await (await caches.open(name)).keys()).length : 0; });
  await page.goto('about:blank'); // the guest leaves: the page hands the worker the rest of its list
  await page.goto(url, { waitUntil: 'networkidle' });
  for (let n = -1, t = 0; t < 5000; t += 250) { const m = await copied(); if (m === n) break; n = m; await page.waitForTimeout(250); }
  const manifest = await (await page.request.get(new URL('manifest.webmanifest', url).href)).json();
  if (manifest.display !== 'standalone') problems.push(`the manifest opens it as "${manifest.display ?? 'browser'}", not like an app`);

  await context.setOffline(true);
  const failed = [];
  const away = await context.newPage();
  away.on('requestfailed', r => failed.push(r.url().replace(new URL(url).origin, '')));
  await away.goto(url, { waitUntil: 'load' }).catch(e => problems.push(`with no signal the invite doesn't open: ${e.message.split('\n')[0]}`));
  await read(away).catch(() => {});
  await away.waitForTimeout(500);
  const got = await away.evaluate(() => ({
    greet: document.querySelector('.greet')?.hidden ? '' : document.querySelector('.greet')?.textContent,
    when: document.querySelector('[data-event="when"]')?.textContent,
    missing: [...document.images].filter(i => i.getAttribute('src') && !(i.complete && i.naturalWidth)).map(i => i.getAttribute('src')),
  })).catch(() => ({}));
  if (got.greet !== `Dear ${name},`) problems.push(`with no signal, from the plain address, the greeting reads "${got.greet ?? ''}"`);
  if (!got.when?.includes('November')) problems.push('with no signal, the details are missing');
  if (got.missing?.length) problems.push(`with no signal, ${got.missing.length} picture(s) missing: ${got.missing.slice(0, 5).join(', ')}`);
  if (failed.length) problems.push(`with no signal, ${failed.length} request(s) failed: ${[...new Set(failed)].slice(0, 6).join(', ')}`);
  await close(browser);
  console.log(problems.length ? `offline: ${problems.length} problem(s)\n  ${problems.join('\n  ')}` : 'offline: ok');
  return problems.length;
}

// Lighthouse's mobile performance (PLAN.md: at least 90, and layout shift under 0.05), measured as Cloudflare will serve
// the page: over HTTP/2 with text compressed. A local [url] is put behind a front that adds both (with a certificate
// made here); a deployed https one is measured as it is.
async function lighthouse() {
  const { default: run } = await import('lighthouse');
  const { launch } = await import('chrome-launcher');
  let target = url, front;
  if (!url.startsWith('https:')) {
    const { createSecureServer } = await import('node:http2');
    const [key, cert] = [`${OUT}/front-key.pem`, `${OUT}/front-cert.pem`];
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '30', '-subj', '/CN=localhost'], { stdio: 'ignore' });
    front = createSecureServer({ key: readFileSync(key), cert: readFileSync(cert), allowHTTP1: true }, async (req, res) => {
      const r = await fetch(new URL(req.url, url));
      let body = Buffer.from(await r.arrayBuffer());
      const type = r.headers.get('content-type') || '', headers = { 'content-type': type };
      if (/text|json|javascript|svg|manifest/.test(type)) [body, headers['content-encoding']] = [gzipSync(body, { level: 9 }), 'gzip'];
      res.writeHead(r.status, headers).end(body);
    });
    await new Promise(r => front.listen(0, '127.0.0.1', r));
    target = `https://127.0.0.1:${front.address().port}/`;
  }
  const chrome = await launch({ chromeFlags: ['--headless=new', '--ignore-certificate-errors'] });
  try {
    const { lhr } = await run(target, { port: chrome.port, onlyCategories: ['performance'], logLevel: 'error' });
    const score = Math.round(lhr.categories.performance.score * 100), a = lhr.audits, cls = a['cumulative-layout-shift'].numericValue;
    console.log(`lighthouse: performance ${score} (at least 90); first paint ${a['first-contentful-paint'].displayValue}, largest ` +
      `${a['largest-contentful-paint'].displayValue}, layout shift ${cls.toFixed(3)} (under 0.05), blocking ${a['total-blocking-time'].displayValue}`);
    return (score < 90) + (cls >= 0.05);
  } finally {
    await chrome.kill();
    front?.close();
  }
}

// The invitation's working parts, as a guest meets them on each phone: the page says what event.json says; the countdown
// counts to its day; "Add to calendar" is the .ics file on an iPhone and Google Calendar's link on Android; a family's
// ?to= link greets them and fills in their reply; tapping "Tell us you're coming" leaves thanks that are still there
// after a reload. And the link helper (links.html): kept from search engines, linked from nowhere, making a family's
// link and its WhatsApp message.
async function invite() {
  const problems = [];
  const sync = await new Promise(done => execFile('node', ['tools/event-sync.mjs', '--check'], (err, out) => done(err && out.trim())));
  if (sync) problems.push(sync);
  const e = JSON.parse(readFileSync('event.json', 'utf8'));
  const ist = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
  const days = Math.round((Date.parse(ist(new Date(e.start))) - Date.parse(ist(new Date()))) / 864e5);
  const utc = d => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const name = 'Ravi Uncle & family';
  const browser = await chromium.launch({ channel: 'chrome' });
  for (const [phone, size] of [['iphone', SIZES.iphone], ['android', { ...SIZES.android, userAgent: devices['Pixel 7'].userAgent }]]) {
    const context = await browser.newContext(size);
    await context.route(/^https:\/\/(wa\.me|api\.whatsapp\.com)\//, r => r.fulfill({ body: 'WhatsApp' })); // a stand-in
    const page = await context.newPage();
    await page.goto(`${url}?to=${encodeURIComponent(name)}`, { waitUntil: 'load' });
    const got = () => page.evaluate(() => ({
      greet: document.querySelector('.greet').hidden ? '' : document.querySelector('.greet').textContent,
      reply: new URL(document.querySelector('.coming').href).searchParams.get('text'),
      calendar: document.querySelector('[data-event="calendar"]').href, download: document.querySelector('[data-event="calendar"]').hasAttribute('download'),
      countdown: document.querySelector('.countdown').textContent, thanks: `${document.querySelector('.coming').textContent} / ${document.querySelector('.close .note').textContent}`,
    }));
    const g = await got();
    if (g.greet !== `Dear ${name},`) problems.push(`${phone}: the greeting reads "${g.greet}"`);
    if (g.reply !== `Hi! ${name} will be there for Taneira’s 2nd birthday 🦋`) problems.push(`${phone}: the reply reads "${g.reply}"`);
    if (days > 1 && g.countdown !== `${days} days to go`) problems.push(`${phone}: the countdown reads "${g.countdown}", not ${days} days`);
    const ics = g.calendar.endsWith('/taneira-2nd-birthday.ics') && g.download;
    const google = g.calendar.startsWith('https://calendar.google.com/calendar/render?') && new URL(g.calendar).searchParams.get('dates') === `${utc(e.start)}/${utc(e.end)}`;
    if (phone === 'iphone' ? !ics : !google) problems.push(`${phone}: "Add to calendar" goes to ${g.calendar}`);
    await page.click('.coming'); // off to WhatsApp, and back
    await page.waitForURL(/wa\.me/);
    await page.goBack({ waitUntil: 'load' });
    const thanks = 'Thank you! See you there / Didn’t send? Tap it again.';
    if ((await got()).thanks !== thanks) problems.push(`${phone}: no thanks on coming back from "Tell us you’re coming"`);
    await page.reload({ waitUntil: 'load' });
    if ((await got()).thanks !== thanks) problems.push(`${phone}: the thanks are gone after a reload`);
    await context.close();
  }
  const page = await browser.newPage();
  if (/href="links\.html"/.test(await (await page.request.get(url)).text())) problems.push('the invite links to links.html');
  await page.goto(new URL('links.html', url).href, { waitUntil: 'load' });
  await page.fill('#name', name);
  const helper = await page.evaluate(() => ({
    robots: document.querySelector('meta[name="robots"]')?.content, link: document.querySelector('output').textContent,
    message: new URL(document.querySelector('.send').href).searchParams.get('text'),
  }));
  const link = `${new URL('./', url).href}?to=${encodeURIComponent(name)}`;
  if (helper.robots !== 'noindex') problems.push('links.html: not kept from search engines');
  if (helper.link !== link) problems.push(`links.html: makes ${helper.link}, not ${link}`);
  if (helper.message !== `Hi ${name}! Taneira is turning two and we’d love you there 🦋\n${link}`) problems.push(`links.html: the message reads "${helper.message}"`);
  await close(browser);
  console.log(problems.length ? `invite: ${problems.length} problem(s)\n  ${problems.join('\n  ')}` : 'invite: ok');
  return problems.length;
}

// scroll-craft's harness at the three sizes it's checked at, side by side. Its findings are the lines it prints in
// capitals (DEAD SCROLL, CONTRAST FAIL, CONSOLE ERRORS…), each starting its own paragraph.
const CRAFT = [['phone', '--width', '390', '--height', '844'], ['laptop', '--width', '1440', '--height', '900'], ['reduced motion', '--width', '390', '--height', '844', '--reduced-motion']];
async function craft() {
  const runs = await Promise.all(CRAFT.map(([name, ...args]) => new Promise(done => execFile('node',
    ['tools/scrollcraft/shoot.mjs', '--url', url, '--out', `${OUT}/craft-${name.split(' ')[0]}`, ...args], { maxBuffer: 1 << 26 },
    (err, out) => done({ name, found: out.split('\n\n').map(p => p.trim()).filter(p => /^[A-Z]{4}/.test(p)).map(p => p.split('\n').filter((l, i) => !i || /^\s/.test(l)).join('\n')), err })))));
  for (const { name, found, err } of runs) console.log(`craft, ${name}: ${found.length ? found.join('\n') : err ? err.message : 'ok'}`);
  return runs.reduce((n, r) => n + (r.found.length || (r.err ? 1 : 0)), 0);
}

// Everything that must pass before a change is shown: the layout audit, the harness, the weight, the share files, the
// invitation's working parts and offline side by side, then the three that measure speed, each alone (anything running
// beside them would skew them)
async function all() {
  const start = Date.now(), since = t => `${Math.round((Date.now() - t) / 1000)} s`;
  const timed = async ([name, check]) => {
    const t = Date.now(), problems = await check();
    console.log(`→ ${name}: ${problems ? 'FAILED' : 'passed'} (${since(t)})\n`);
    return problems ? [name] : [];
  };
  const failed = (await Promise.all([['layout', layout], ['craft', craft], ['weight', weight], ['share', share], ['invite', invite], ['offline', offline]].map(timed))).flat();
  for (const check of [['tasks', tasks], ['flicker', flicker], ['lighthouse', lighthouse]]) failed.push(...(await timed(check)));
  console.log(failed.length ? `FAILED: ${failed.join(', ')} (${since(start)})` : `all checks passed (${since(start)})`);
  return failed.length;
}

process.exit((await { shots, flicker, tasks, layout, craft, weight, share, invite, offline, lighthouse, all }[mode]()) ? 1 : 0);
