import { VINE } from './vine-path.js';
import { burst } from './butterflies.js';

const { gsap } = window;

// The whole story is one animation on one pinned stage, played by the scroll: one screen of scroll is one unit of
// timeline time, and nothing smooths or delays it, so it moves exactly with the thumb.
//
//   the camera sinks from the dawn garden down a vine; the caterpillar crawls down it past four memories
//   → the camera slows to a stop at a twig; the caterpillar lowers itself on a thread; night falls
//   → it becomes a chrysalis; the chrysalis opens into a butterfly (Codex's frames)
//   → the camera follows the butterfly down to her, and it settles on her back as her wings; the gold 2
//
// The camera is one number, `cam` (px the world has travelled up). Every layer of the world moves by cam × its depth:
// far layers less, near layers more, the vine and its words exactly 1.

const DEPTH = { sky: 0.15, hills: 0.4, wisteria: 1.25, meadow: 0.85, ground: 0.85, vine: 1, blossoms: 1.35, foliage: 1.3, words: 1 };
// Codex's stand-in frames: the shell starts to move at frame 2 and the wings are fully open by 49 (the rest hold still)
const FIRST = 2, LAST = 49;
const frame = i => `img/peak-v0/${String(i).padStart(2, '0')}.webp`;
// Where Codex's frames put things, as fractions of their 9:16 box (measured from its renderer): the chrysalis drawing
// in the first frame and the butterfly drawing in the last, so the drawings on the page hand over without a jump.
const CHRYSALIS = { left: 0.1246, top: 0.1484, width: 0.7509, ratio: 1392 / 983 };
const BUTTERFLY = { left: 0.0733, top: 0.2783, width: 0.8533, ratio: 779 / 1024 };
const LEAVES = [{ x: 0.348, y: 0.228 }, { x: 0.691, y: 0.643 }]; // the vine's two big leaves, as fractions of a tile
const TILES = 3;                                                   // vine images, one screen each

export function story() {
  const stage = document.querySelector('.stage');
  const $ = s => stage.querySelector(s);
  const world = Object.fromEntries(Object.keys(DEPTH).map(k => [k, k === 'words' ? $('.words') : $(`.world .${k}`)]));
  const cat = $('.caterpillar'), silk = $('.silk'), night = $('.night'), film = $('.film'), canvas = $('.film canvas');
  const twig = $('.twig'), chrysalis = $('.chrysalis'), flyer = $('.flyer'), flap = $('.flyer img'), hush = $('.hush'), her = $('.her'), two = $('.two'), wings = $('.wings');
  const evening = $('.evening'), track = document.querySelector('.track');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the frames, loaded in order once the page has
  const imgs = [];
  addEventListener('load', async () => {
    for (let i = 0; i <= LAST; i++) {
      imgs[i] = new Image();
      imgs[i].src = frame(i);
      await imgs[i].decode().catch(() => {});
    }
  }, { once: true });
  const ctx = canvas.getContext('2d');
  let drawn = -1;
  const draw = i => {
    for (let j = i; j >= 0; j--) if (imgs[j]?.complete && imgs[j].naturalWidth) {
      if (j !== drawn) ctx.drawImage(imgs[j], 0, 0, canvas.width, canvas.height), (drawn = j);
      return;
    }
  };

  let tl, length, H;
  const p = { cam: 0, frame: FIRST, flap: 0 };

  function build() {
    const at = tl ? tl.time() : 0;
    tl?.kill();
    H = stage.clientHeight;
    const W = stage.clientWidth;
    const CW = (H * 2) / 3, colL = (W - CW) / 2;          // the 2:3 column the garden was drawn for
    const boxW = (H * 9) / 16, boxL = (W - boxW) / 2;      // the frames' 9:16 box, centred
    const px = (el, box) => Object.assign(el.style, Object.fromEntries(Object.entries(box).map(([k, v]) => [k, `${v}px`])));

    // the dawn garden: the frame of five layers, as drawn
    px(world.sky, { left: colL, top: 0, width: CW, height: H });
    px(world.hills, { left: colL, top: 0.4993 * H, width: CW });
    px(world.wisteria, { left: colL, top: 0, width: CW });
    px(world.meadow, { left: colL, top: 0.6048 * H, width: CW });
    px(world.blossoms, { left: colL, top: 0.6081 * H, width: CW });

    // the vine hangs from among the flowers; its end meets the twig exactly where the first frame draws it
    const vTop = 0.75 * H, vEnd = vTop + TILES * H;
    const chrysW = CHRYSALIS.width * boxW, chrysH = chrysW * CHRYSALIS.ratio;
    const camHold = vEnd - CHRYSALIS.top * H - 0.06 * chrysH;
    px(world.vine, { left: colL, top: vTop, width: CW });
    // no straight edge ever slides past (scroll-craft devices.md §6): the meadow and the flowers fade out at their
    // feet (site.css), into solid ground in the meadow's own bottom colour that starts behind the meadow's middle
    px(world.ground, { left: 0, top: 0.6048 * H + 0.5 * ((CW * 607) / 1024), width: W, height: 7 * H });
    px(world.foliage, { left: colL, top: 0.95 * H, width: CW, height: 8 * H });

    // the caterpillar: a third of the column long, starting on the vine low on the first screen
    const catW = 0.34 * CW, catH = (catW * 393) / 1024;
    const stem = y => { // the stem's x at world height y, and its slope (dx/dy)
      const u = (((y - vTop) / H) % 1 + 1) % 1, f = u * 100, i = Math.min(99, Math.floor(f)), k = f - i;
      return { x: colL + (VINE[i] + (VINE[i + 1] - VINE[i]) * k) * CW, slope: ((VINE[i + 1] - VINE[i]) * CW) / (H / 100) };
    };
    // A line of words passes the caterpillar exactly when it crosses the caterpillar's height on the screen, and the
    // caterpillar is then on the stem at the words' own height. So each line keeps clear of the stem over its height,
    // plus the caterpillar's length above and below and its girth to the side.
    const room = (top, height) => { // the free width left and right of the caterpillar, over a line's height
      let l = W, r = 0;
      for (let i = 0; i <= 8; i++) {
        const { x, slope } = stem(top - catW / 2 + ((height + catW) * i) / 8), a = Math.atan(slope);
        const half = (Math.abs(Math.sin(a)) * catW + Math.cos(a) * catH) / 2 + 12; // its half-width as it leans with the stem
        l = Math.min(l, x - half);
        r = Math.max(r, x + half);
      }
      return { left: l - 14, right: W - 14 - r, l, r };
    };
    const place = (el, top, side, height) => { // never narrower than 150 px, so a long word stays on its tag
      const f = room(top, height);
      px(el, side === 'left' ? { left: 14, top, width: Math.max(150, f.left) } : { left: Math.min(f.r, W - 164), top, width: Math.max(150, f.right) });
    };
    // on the preferred side if it leaves 150 px for the words (a long word needs about that), else the roomier side
    const side = (top, height, prefer) => {
      const f = room(top, height);
      return f[prefer] >= 150 ? prefer : f.left >= f.right ? 'left' : 'right';
    };

    // words that travel with the vine: the title, the first line, and a memory on each big leaf of tiles 1 and 2
    px($('.title'), { left: 16, top: 0.16 * H, width: W - 32 });
    px($('.words .scrim'), { left: 0, top: 0.08 * H, width: W, height: 0.34 * H });
    place($('.intro'), vTop + 0.4 * H, side(vTop + 0.4 * H, 0.2 * H, 'left'), 0.2 * H);
    stage.querySelectorAll('.memory').forEach((m, i) => {
      const leaf = LEAVES[i % 2], y = vTop + (1 + Math.floor(i / 2)) * H + leaf.y * H, d = 0.27 * CW;
      const disc = { left: colL + leaf.x * CW - d / 2, top: y - d / 2, width: d, height: d };
      px(m.querySelector('.pic'), disc);
      // the words go on the empty side of the stem, opposite the picture, if there's room for them there (150 px);
      // otherwise on whichever side has more, under the picture
      const leafSide = leaf.x < 0.5 ? 'left' : 'right', other = leafSide === 'left' ? 'right' : 'left';
      const beside = y + d * 0.2, below = y + d / 2 + 10;
      if (room(beside, 0.16 * H)[other] >= 150) place(m.querySelector('figcaption'), beside, other, 0.16 * H);
      else place(m.querySelector('figcaption'), below, side(below, 0.16 * H, other), 0.16 * H);
    });

    // the film box, with the drawings that hand over to and from the frames. The twig travels up with the vine and
    // comes to rest exactly where the first frame draws it.
    px(film, { left: boxL, top: 0, width: boxW, height: H });
    px(twig, { left: CHRYSALIS.left * boxW, top: CHRYSALIS.top * H, width: chrysW });
    px(chrysalis, { left: CHRYSALIS.left * boxW, top: CHRYSALIS.top * H, width: chrysW });
    px(flyer, { left: BUTTERFLY.left * boxW, top: BUTTERFLY.top * H, width: BUTTERFLY.width * boxW });
    const dpr = Math.min(2, devicePixelRatio);
    canvas.width = Math.round(boxW * dpr);
    canvas.height = Math.round(H * dpr);
    drawn = -1;

    // her, standing a screen further down; the butterfly lands on her wings (the top half of her picture)
    const herH = Math.min(0.66 * H, 1.28 * W), herW = (herH * 1007) / 1430, herTop = H - 24 - herH;
    px(her, { left: (W - herW) / 2, top: herTop, width: herW, height: herH });
    const land = { x: (W - herW) / 2 - boxL + 0.5 * herW, y: herTop + 0.34 * herH, w: herW }; // in the film box's coordinates
    const fly0 = { x: (BUTTERFLY.left + BUTTERFLY.width / 2) * boxW, y: BUTTERFLY.top * H + (BUTTERFLY.width * boxW * BUTTERFLY.ratio) / 2, w: BUTTERFLY.width * boxW };

    px(cat, { left: -catW / 2, top: -catH / 2, width: catW });
    const c0 = 0.86 * H, follow = 0.42 * H;

    // ---- the timeline, in screens of scroll ----
    const arrive = camHold / H - 0.45;   // the camera slows over the last 0.45 screens of travel, starting here
    const t1 = arrive + 0.9;             // and stands still from here: the twig
    const tE = t1 + 2.7;                 // the butterfly is out; the camera follows it down to her
    const t2 = tE + 1.4;                 // she has her wings
    length = t2 + 0.5;
    tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: render })
      .to(p, { cam: arrive * H, duration: arrive }, 0)
      .to(p, { cam: camHold, duration: 0.9, ease: 'power2.out' }, arrive) // the same speed going in, so no jolt
      // the twig: the caterpillar has let itself down on a thread; night falls and it curls up into a chrysalis
      .fromTo(night, { opacity: 0 }, { opacity: 1, duration: 0.9 }, t1 - 0.6)
      .to($('.words'), { autoAlpha: 0, duration: 0.4 }, t1 - 0.6) // the vine's words go with the light
      .fromTo(hush, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, t1 - 0.2)
      .to(hush, { autoAlpha: 0, duration: 0.25 }, t1 + 1.4)
      .to(cat, { autoAlpha: 0, duration: 0.3 }, t1 + 0.45)
      .to(silk, { autoAlpha: 0, duration: 0.3 }, t1 + 0.45)
      .fromTo(chrysalis, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power1.out' }, t1 + 0.35)
      .set(canvas, { autoAlpha: 1 }, t1 + 0.8)
      .set(chrysalis, { autoAlpha: 0 }, t1 + 0.82)
      .set(twig, { autoAlpha: 0 }, t1 + 0.82)
      // it opens into a butterfly, and the camera leans in
      .fromTo(p, { frame: FIRST }, { frame: LAST, duration: 1.7 }, t1 + 0.9)
      .fromTo(film, { scale: 1 }, { scale: 1.06, duration: 1.9 }, t1 + 0.8)
      .set(flyer, { autoAlpha: 1 }, tE - 0.1)
      .to(canvas, { autoAlpha: 0, duration: 0.2 }, tE - 0.1)
      // the camera follows it down to her; it flutters, then settles on her back as her wings
      .to(p, { cam: camHold + 1.1 * H, duration: 1.1, ease: 'sine.inOut' }, tE)
      .to(film, { scale: 1, duration: 0.6 }, tE)
      .to(p, { flap: 7, duration: 1.3 }, tE)
      .fromTo(flyer, { x: 0, y: 0, scale: 1 }, { x: land.x - fly0.x, y: land.y - fly0.y, scale: land.w / fly0.w, duration: 0.8, ease: 'power1.inOut' }, tE + 0.5)
      .to(flyer, { autoAlpha: 0, duration: 0.25 }, tE + 1.3)
      .fromTo(two, { autoAlpha: 0, scale: 0.4, rotation: -20 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.15, ease: 'back.out(2)' }, t2)
      .fromTo(wings, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.2 }, t2 + 0.05)
      // the story is over. As the details rise, she and her words leave before their first line arrives (0.12 screens
      // in), and the same garden comes back at evening behind them
      .to([her, two, wings], { autoAlpha: 0, duration: 0.12 }, length)
      .fromTo(evening, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, length);
    track.style.height = `${length * H}px`;
    // the close's butterflies come out only once it has arrived
    const end = (document.documentElement.scrollHeight - innerHeight) / H;
    tl.fromTo('.close .flock', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, end - 0.3);

    // her place in the world: she rises into view as the camera comes down to her
    herRise = camHold + 1.1 * H;
    geometry = { vTop, vEnd, c0, follow, stem, catW, H, W, boxL, tE, t2, camHold };
    tl.time(at);
    render();
  }

  let herRise = 0, geometry, burstDone = still;

  function render() {
    const { vEnd, c0, follow, stem, catW, H, W, t2, camHold } = geometry;
    const cam = p.cam;
    for (const [k, el] of Object.entries(world)) gsap.set(el, { y: -cam * DEPTH[k] });
    gsap.set(twig, { y: camHold - cam });
    // the dawn garden leaves the screen early on; stop painting it once it's gone
    for (const k of ['sky', 'hills', 'wisteria', 'meadow', 'blossoms']) world[k].style.visibility = cam > 1.6 * H ? 'hidden' : '';

    // the caterpillar rides the vine until it reaches the middle of the screen, then the camera follows it down
    const cy = Math.max(c0, cam + follow);
    if (cy < vEnd) {
      const { x, slope } = stem(cy);
      const inch = still ? 0 : Math.sin(cam / 26);
      gsap.set(cat, { x, y: cy - cam, rotation: 90 - (Math.atan(slope) * 180) / Math.PI, scaleX: 1 + 0.05 * inch, scaleY: 1 - 0.04 * inch });
      silk.style.height = '0px';
    } else { // past the end of the vine: hanging from the twig on a thread, head down
      gsap.set(cat, { x: W / 2, y: cy - cam, rotation: 90, scaleX: 1, scaleY: 1 });
      Object.assign(silk.style, { left: `${W / 2}px`, top: `${vEnd - cam}px`, height: `${Math.max(0, cy - catW / 2 - vEnd)}px` });
    }

    draw(Math.round(p.frame));
    if (!still) gsap.set(flap, { scaleX: 1 - 0.35 * Math.abs(Math.sin(p.flap * Math.PI)) });
    gsap.set(her, { y: herRise - cam });

    // the story's last moment: the burst, once
    if (!burstDone && tl.time() > t2 + 0.1) {
      burstDone = true;
      burst(stage);
    }
    // what the stage shows, for scroll-craft's harness (it can't see into a canvas): rendered values only, never the
    // scroll position itself (its verify.md)
    const o = el => Math.round(gsap.getProperty(el, 'opacity') * 20);
    stage.dataset.scVerifyState = [Math.round(cam / 4), drawn, o(night), o(chrysalis), o(cat), o(flyer), o(two), o(wings), o(evening),
      Math.round(gsap.getProperty(film, 'scale') * 200), Math.round(gsap.getProperty(flyer, 'y') / 4)].join('|');
  }

  build();
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return; // a phone's address bar: nothing on the stage depends on it
    lastW = innerWidth;
    build();
  }, { passive: true });

  return () => tl.time(Math.min(scrollY / H, tl.duration()));
}
