import { VINE } from './vine-path.js';
import { burst } from './butterflies.js';

const { gsap } = window;

// The whole story is one animation on one pinned stage, played by the scroll: one screen of scroll is one unit of
// timeline time, and nothing smooths or delays it, so it moves exactly with the thumb.
//
//   the camera sinks from the dawn garden down a vine; the caterpillar crawls down it past four memories
//   → the camera slows to a stop at a twig; the caterpillar lowers itself on a thread; night falls
//   → it curls up and becomes a chrysalis; the chrysalis opens and a butterfly climbs out (Codex's drawings, frame by frame)
//   → the camera follows the butterfly down to her, and it settles on her back as her wings; the gold 2
//
// The camera is one number, `cam` (px the world has travelled up). Every layer of the world moves by cam × its depth:
// far layers less, near layers more, the vine and its words exactly 1.

const DEPTH = { sky: 0.15, hills: 0.4, wisteria: 1.25, meadow: 0.85, ground: 0.85, vine: 1, blossoms: 1.35, foliage: 1.3, words: 1 };
// The twig, where the stand-in clip drew its chrysalis drawing, as fractions of a 9:16 box: the vine ends here
const CHRYSALIS = { left: 0.1246, top: 0.1484, width: 0.7509, ratio: 1392 / 983 };
// The change's frames share one box (printed by `tools/art.py frames`), in widths of that chrysalis drawing, and the
// butterfly in the frame where its wings are open, in widths of the frames' box, so the flyer takes over without a jump
const FRAMES = { left: 0.0366, top: 0.3032, width: 0.9634, ratio: 1.2122 };
const BUTTERFLY = { left: 0.0195, top: 0.565, width: 0.911, ratio: 779 / 1024 };
// When each frame comes in, in screens after the camera stops at the twig: the caterpillar curls up (1–3), the
// chrysalis (4) holds a little longer, then it glows (5), opens (6–8), and the butterfly leaves it empty (9)
const POSES = [0.35, 0.65, 0.95, 1.25, 1.65, 1.95, 2.15, 2.35, 2.6];
const ZOOM = 1.6;    // the caterpillar grows to the size it's drawn in the frames while it lowers itself on its thread
const LEAVES = [{ x: 0.348, y: 0.228 }, { x: 0.691, y: 0.643 }]; // the vine's two big leaves, as fractions of a tile
const TILES = 3;                                                   // vine images, one screen each
const D = 0.12;                                                    // a frame's dissolve, in screens

export function story() {
  const stage = document.querySelector('.stage');
  const $ = s => stage.querySelector(s);
  const world = Object.fromEntries(Object.keys(DEPTH).map(k => [k, k === 'words' ? $('.words') : $(`.world .${k}`)]));
  const cat = $('.caterpillar'), silk = $('.silk'), night = $('.night'), film = $('.film'), change = $('.change');
  const poses = [...change.children], twig = $('.twig'), flyer = $('.flyer'), flap = $('.flyer img'), hush = $('.hush'), her = $('.her'), two = $('.two'), wings = $('.wings');
  const evening = $('.evening'), track = document.querySelector('.track');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the pictures further down the story, once the first screen has loaded: the memories first, then the frames
  addEventListener('load', () => stage.querySelectorAll('img[data-src]').forEach(img => (img.src = img.dataset.src)), { once: true });

  let tl, length, H;
  const p = { cam: 0, flap: 0, sway: 0, zoom: 1 };

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
      const leaf = LEAVES[i % 2], y = vTop + (1 + Math.floor(i / 2)) * H + leaf.y * H, d = 0.3 * CW;
      const disc = { left: colL + leaf.x * CW - d / 2, top: y - d / 2, width: d, height: d };
      px(m.querySelector('.pic'), disc);
      // the words go on the empty side of the stem, opposite the picture, if there's room for them there (150 px);
      // otherwise on whichever side has more, under the picture
      const leafSide = leaf.x < 0.5 ? 'left' : 'right', other = leafSide === 'left' ? 'right' : 'left';
      const beside = y + d * 0.2, below = y + d / 2 + 10;
      if (room(beside, 0.16 * H)[other] >= 150) place(m.querySelector('figcaption'), beside, other, 0.16 * H);
      else place(m.querySelector('figcaption'), below, side(below, 0.16 * H, other), 0.16 * H);
    });

    // the film box: the twig travels up with the vine and comes to rest at the top of it; the frames hang from its
    // knot (they sway from there), and the flyer starts exactly over the butterfly in the frame with open wings
    px(film, { left: boxL, top: 0, width: boxW, height: H });
    px(twig, { left: CHRYSALIS.left * boxW, top: CHRYSALIS.top * H, width: chrysW });
    const fr = { left: CHRYSALIS.left * boxW + FRAMES.left * chrysW, top: CHRYSALIS.top * H + FRAMES.top * chrysW, width: FRAMES.width * chrysW };
    px(change, { ...fr, height: fr.width * FRAMES.ratio });
    change.style.transformOrigin = `${boxW / 2 - fr.left}px 0`;
    px(flyer, { left: fr.left + BUTTERFLY.left * fr.width, top: fr.top + BUTTERFLY.top * fr.width, width: BUTTERFLY.width * fr.width });

    // her, standing a screen further down; the butterfly lands on her wings (the top half of her picture)
    const herH = Math.min(0.66 * H, 1.28 * W), herW = (herH * 1007) / 1430, herTop = H - 24 - herH;
    px(her, { left: (W - herW) / 2, top: herTop, width: herW, height: herH });
    const land = { x: (W - herW) / 2 - boxL + 0.5 * herW, y: herTop + 0.34 * herH, w: herW }; // in the film box's coordinates
    const fw = BUTTERFLY.width * fr.width;
    const fly0 = { x: fr.left + BUTTERFLY.left * fr.width + fw / 2, y: fr.top + BUTTERFLY.top * fr.width + (fw * BUTTERFLY.ratio) / 2, w: fw };

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
      .to(p, { zoom: ZOOM, duration: 1.2, ease: 'sine.inOut' }, arrive)
      // the twig: the caterpillar has let itself down on a thread; night falls, and the camera leans in
      .fromTo(night, { opacity: 0 }, { opacity: 1, duration: 0.9 }, t1 - 0.6)
      .to($('.words'), { autoAlpha: 0, duration: 0.4 }, t1 - 0.6) // the vine's words go with the light
      .fromTo(hush, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, t1 - 0.2)
      .to(hush, { autoAlpha: 0, duration: 0.25 }, t1 + 1.4)
      .to([cat, silk], { autoAlpha: 0, duration: D }, t1 + POSES[0] + D / 2)
      .fromTo(film, { scale: 1 }, { scale: 1.06, duration: 1.9 }, t1 + 0.8)
      .fromTo(p, { sway: 0 }, { sway: 1, duration: 0.5 }, t1 + POSES[0])
      .to(p, { sway: 0, duration: 0.4 }, tE - 0.5) // still when the butterfly lets go
      .fromTo(flyer, { autoAlpha: 0 }, { autoAlpha: 1, duration: D }, t1 + POSES[8])
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
    // the change, frame by frame: each frame dissolves in over the one before, which goes once it's half in
    poses.forEach((el, i) => {
      tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: D }, t1 + POSES[i]);
      if (i) tl.to(poses[i - 1], { autoAlpha: 0, duration: D }, t1 + POSES[i] + D / 2);
    });

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
    gsap.set(change, { y: camHold - cam, rotation: still ? 0 : 1.5 * p.sway * Math.sin(tl.time() * 5) }); // hangs from it
    // the dawn garden leaves the screen early on; stop painting it once it's gone
    for (const k of ['sky', 'hills', 'wisteria', 'meadow', 'blossoms']) world[k].style.visibility = cam > 1.6 * H ? 'hidden' : '';

    // the caterpillar rides the vine until it reaches the middle of the screen, then the camera follows it down
    const cy = Math.max(c0, cam + follow);
    const grow = ((p.zoom - 1) * catW) / 2; // near the end it grows, from its tail, so it stays on the vine and the thread
    if (cy < vEnd) {
      const { x, slope } = stem(cy + grow);
      const inch = still ? 0 : Math.sin(cam / 26);
      gsap.set(cat, { x, y: cy + grow - cam, rotation: 90 - (Math.atan(slope) * 180) / Math.PI, scaleX: p.zoom * (1 + 0.05 * inch), scaleY: p.zoom * (1 - 0.04 * inch) });
      silk.style.height = '0px';
    } else { // past the end of the vine: hanging from the twig on a thread, head down
      gsap.set(cat, { x: W / 2, y: cy + grow - cam, rotation: 90, scale: p.zoom });
      Object.assign(silk.style, { left: `${W / 2}px`, top: `${vEnd - cam}px`, height: `${Math.max(0, cy - catW / 2 - vEnd)}px` });
    }

    if (!still) gsap.set(flap, { scaleX: 1 - 0.35 * Math.abs(Math.sin(p.flap * Math.PI)) });
    gsap.set(her, { y: herRise - cam });

    // the story's last moment: the burst, once
    if (!burstDone && tl.time() > t2 + 0.1) {
      burstDone = true;
      burst(stage);
    }
    // what the stage shows, for scroll-craft's harness: rendered values only, never the scroll position itself (its
    // verify.md)
    const o = el => Math.round(gsap.getProperty(el, 'opacity') * 20);
    stage.dataset.scVerifyState = [Math.round(cam / 4), ...poses.map(o), o(night), o(cat), o(flyer), o(two), o(wings), o(evening),
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
