import { burst } from './butterflies.js';

const { gsap } = window;

// The peak's own moments, on top of what the engine plays there (the frame sequence, then the iris onto her portrait,
// then her headline once the iris has closed over the butterfly so the words never sit on its wings): the gold 2 lands,
// and the butterflies burst once, the first time the guest gets there. Driven by the engine's own progress for this
// act, so GSAP and the frames can never disagree.
export function peak(sc) {
  const act = document.querySelector('#peak');
  const stage = act.querySelector('[data-sc-stage]');
  const film = act.querySelector('.film');
  const rec = sc.acts.find(a => a.el === act);

  // Fetch the frames in order once the page has loaded, so they are cached long before the guest gets here (the
  // engine asks for all of them at once, three screens ahead).
  const [tpl, count, first] = act.querySelector('[data-sc-sequence]').dataset.scSequence.split(':');
  addEventListener('load', async () => {
    for (let i = +first; i < +first + +count; i++) {
      const img = new Image();
      img.fetchPriority = 'low';
      img.src = tpl.replace('{ii}', String(i).padStart(2, '0'));
      await img.decode().catch(() => {});
    }
  }, { once: true });

  // Under reduced motion the 2 simply stands there (site.css) and nothing bursts. The timeline is only built when it
  // will run: building it renders its start state, which would hide the 2 for good.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The camera never stops: a slow push-in on the chrysalis while it is still (and on through the unfolding), then
  // her portrait settles from a little closer, so the picture moves under the thumb for the whole pin.
  const tl = still || gsap.timeline({ paused: true, defaults: { ease: 'none' } })
    .fromTo(film, { scale: 1 }, { scale: 1.08, duration: 0.66 }, 0)
    .fromTo('.her img', { scale: 1.08 }, { scale: 1, duration: 0.36 }, 0.64)
    .fromTo('.two', { autoAlpha: 0, scale: 0.4, rotation: -20 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.06, ease: 'back.out(2)' }, 0.88)
    .set({}, {}, 1);
  let burstDone = still;

  return () => {
    // the canvas is opaque black until the engine draws its first frame, so it stays hidden until then
    if (rec.seq.drawn >= 0) film.classList.add('drawn');
    // what the canvas shows, for scroll-craft's harness: it can't see into a canvas (verify.md, custom stages)
    stage.dataset.scVerifyState = rec.seq.drawn;
    if (still) return;
    tl.progress(rec.p);
    if (!burstDone && rec.p > 0.9) {
      burstDone = true;
      burst(stage);
    }
  };
}
