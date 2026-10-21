// Browser checks for the site (dev only). Serve it first: python3 -m http.server -d site 8000
//   node tools/check.mjs shots   [url]  6 positions per scene at 3 sizes + reduced motion → shots/*.png
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

// Scroll offsets that put each scene at 0, 20 … 100% of its pinned stretch
const stops = page => page.evaluate(() => [...document.querySelectorAll('.scene')].map(s => {
  const pin = Math.max(0, s.offsetHeight - innerHeight);
  return [0, 0.2, 0.4, 0.6, 0.8, 1].map(p => Math.round(s.offsetTop + p * pin));
}));

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
    const all = await stops(page);
    for (const [s, ys] of all.entries()) {
      for (const [i, y] of ys.entries()) {
        await page.evaluate(y => scrollTo(0, y), y);
        await page.waitForTimeout(700); // scrub: 0.4 needs a moment to catch up
        await page.screenshot({ path: `${OUT}/${name}-s${s + 1}-${i}.png` });
      }
      // one row per scene: six positions side by side
      execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', `${OUT}/${name}-s${s + 1}-%d.png`, '-vf', 'scale=360:-1,tile=6x1:padding=8:color=white', `${OUT}/${name}-s${s + 1}.png`]);
      for (let i = 0; i < 6; i++) rmSync(`${OUT}/${name}-s${s + 1}-${i}.png`);
    }
    await page.close();
  }
  const page = await browser.newPage({ ...SIZES.iphone, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/reduced-motion.png`, fullPage: true });
  await browser.close();
  console.log(`screenshots in ${OUT}/`);
}

async function flicker() {
  // headed, so the GPU compositor is real; 48 MB is a busy browser or a cheap phone
  const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--force-gpu-mem-available-mb=48'] });
  let failed = false;
  for (const name of ['iphone', 'laptop']) {
    const dir = `${OUT}/video-${name}`;
    rmSync(dir, { recursive: true, force: true });
    const { viewport } = SIZES[name];
    const ctx = await browser.newContext({ ...SIZES[name], recordVideo: { dir, size: viewport } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await slowScroll(page);
    await ctx.close();
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
    console.log(`${name}: ${frames.length} frames, flashes ${flashes.length ? `at frames ${flashes.join(', ')}` : 'none'}`);
    failed ||= flashes.length > 0;
  }
  await browser.close();
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
