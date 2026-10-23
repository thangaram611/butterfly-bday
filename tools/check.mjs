// Browser checks for the site (dev only). Serve it first: python3 -m http.server -d site 8000
//   node tools/check.mjs all     [url]  everything that must pass before a change is shown (npm run check): layout, craft
//                                       and weight side by side, then tasks and flicker, each alone; about 2.5 minutes
//   node tools/check.mjs shots   [url]  24 evenly spaced scroll positions at 3 sizes + reduced motion → shots/*.png
//   node tools/check.mjs weight  [url]  what a phone downloads before the page's load event, as it will travel (code
//                                       gzipped, images as they are); fails over the first screen's 450 KB budget
//   node tools/check.mjs flicker [url]  slow scroll recorded with GPU memory cut to 48 MB; fails on blank-frame flashes
//   node tools/check.mjs tasks   [url]  slow scroll at phone size with the CPU slowed 4×; fails on main-thread tasks over 50 ms
//   node tools/check.mjs layout  [url]  watches the garden's butterflies play, then scrolls through the whole page (1001
//                                       points) and back up, on 5 screens in Chrome and Safari's engine (WebKit), plus
//                                       reduced motion; fails on anything covering readable text, text off the side or
//                                       off a pinned screen, scenery gaps on a pinned screen, a drawing left
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
import { mkdirSync, readdirSync, rmSync } from 'node:fs';

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

// The first screen's weight: everything a phone downloads before the page's load event, counted as it will travel
// (code and text gzipped, as the host serves them; images and fonts as they are). Budget: PLAN.md.
const BUDGET = 450;
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
  const text = name => /\.(js|css|html|svg|json)$|\/$/.test(new URL(name).pathname);
  const rows = [];
  for (const name of before) {
    const body = await bodies.get(name);
    if (body) rows.push([name.replace(new URL(url).origin + '/', '') || 'index.html', Math.round((text(name) ? gzipSync(body, { level: 9 }) : body).length / 1024)]);
  }
  await close(browser);
  rows.sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((n, [, kb]) => n + kb, 0);
  console.log(`first screen: ${total} KB (budget ${BUDGET} KB), the heaviest: ${rows.slice(0, 8).map(([f, kb]) => `${f} ${kb}`).join(', ')}`);
  return total > BUDGET ? 1 : 0;
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

// Everything that must pass before a change is shown: the layout audit, the harness and the weight side by side, then
// the two checks that measure speed, each alone (anything running beside them would skew them)
async function all() {
  const start = Date.now(), since = t => `${Math.round((Date.now() - t) / 1000)} s`;
  const timed = async ([name, check]) => {
    const t = Date.now(), problems = await check();
    console.log(`→ ${name}: ${problems ? 'FAILED' : 'passed'} (${since(t)})\n`);
    return problems ? [name] : [];
  };
  const failed = (await Promise.all([['layout', layout], ['craft', craft], ['weight', weight]].map(timed))).flat();
  for (const check of [['tasks', tasks], ['flicker', flicker]]) failed.push(...(await timed(check)));
  console.log(failed.length ? `FAILED: ${failed.join(', ')} (${since(start)})` : `all checks passed (${since(start)})`);
  return failed.length;
}

process.exit((await { shots, flicker, tasks, layout, craft, weight, all }[mode]()) ? 1 : 0);
