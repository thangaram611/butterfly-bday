// Browser checks for the site (dev only). Serve it first: python3 -m http.server -d site 8000
//   node tools/check.mjs shots   [url]  24 evenly spaced scroll positions at 3 sizes + reduced motion → shots/*.png
//   node tools/check.mjs flicker [url]  slow scroll recorded with GPU memory cut to 48 MB; fails on blank-frame flashes
//   node tools/check.mjs tasks   [url]  slow scroll at phone size with the CPU slowed 4×; fails on main-thread tasks over 50 ms
// Uses the installed Chrome (playwright-core, no browser download) and Homebrew ffmpeg.
import { chromium, devices } from 'playwright-core';
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
      await page.waitForTimeout(900); // the film trails the scroll by 0.5 s
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

await { shots, flicker, tasks }[mode]();
