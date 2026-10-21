import { burst } from './butterflies.js';

const { gsap, ScrollTrigger } = window;

// One timeline per scene, 0 → 1, scrubbed by scroll while that scene's stage is pinned.
// Only transforms and opacity move. Start states are set here, so without JS every scene shows its final picture.
function scrub(sel, build, onUpdate) {
  const scene = document.querySelector(sel);
  const tl = gsap.timeline({ defaults: { ease: 'none', duration: 1 } });
  build(tl, scene);
  ScrollTrigger.create({ trigger: scene, start: 'top top', end: 'bottom bottom', scrub: 0.4, animation: tl, onUpdate });
}

export function scenes() {
  // 1 · dawn garden: the camera pushes in; near layers move most
  scrub('.s1', tl => tl
    .to('.s1 .hills', { y: '-2vh', scale: 1.03 }, 0)
    .to('.s1 .wisteria', { y: '-16vh', scale: 1.1 }, 0)
    .to('.s1 .meadow', { y: '6vh', scale: 1.05 }, 0)
    .to('.s1 .blossoms', { y: '22vh', scale: 1.12 }, 0)
    .to('.s1 .copy', { y: '-6vh' }, 0)
    .to('.s1 .hint', { opacity: 0, duration: 0.15 }, 0));

  // 2 · year one: the caterpillar crawls along the stem past four moments, one at a time
  scrub('.s2', (tl, scene) => {
    tl.fromTo('.s2 .cat', { x: '-30vw' }, { x: '105vw' }, 0);
    const moments = scene.querySelectorAll('.moments li');
    moments.forEach((li, i) => {
      const at = 0.06 + i * 0.23;
      tl.fromTo(li, { opacity: 0, y: 40, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.07, ease: 'power2.out' }, at);
      if (i < moments.length - 1) tl.to(li, { opacity: 0, y: -40, scale: 0.95, duration: 0.07, ease: 'power2.in' }, at + 0.17);
    });
  });

  // 3 · chrysalis to wings, on one stage. First quiet: it warms up and trembles a little.
  //     Then the peak: it splits, a folded paper butterfly opens wing by wing, lifts away,
  //     and the camera pulls back to her portrait and a big gold 2.
  const Q = 0.5, P = 2.2, at = t => Q + t * P; // timeline time = screens of scroll: Q quiet, P peak
  let burstDone = false;
  const stage = document.querySelector('.s3 .stage');
  gsap.set('.s3 .pod', { opacity: 1 });
  scrub('.s3', tl => tl
    .fromTo('.s3 .glow', { opacity: 0.1, scale: 0.7 }, { opacity: 0.8, scale: 1, duration: Q }, 0)
    .to('.s3 .pod', { keyframes: { rotation: [0, 1.5, -1.5, 2, -2, 2.5, -2.5, 0] }, duration: Q }, 0)
    .to('.s3 .hush', { opacity: 0, y: -20, duration: 0.15 }, Q - 0.1)
    .to('.s3 .pod', { keyframes: { rotation: [0, 3, -3, 4, -4, 0] }, duration: 0.1 * P }, at(0))
    .to('.s3 .glow', { opacity: 1, scale: 1.2, duration: 0.2 * P }, at(0))
    .to('.s3 .half.l', { x: '-22vw', y: '45svh', rotation: -35, opacity: 0, duration: 0.14 * P, ease: 'power1.in' }, at(0.1))
    .to('.s3 .half.r', { x: '22vw', y: '45svh', rotation: 35, opacity: 0, duration: 0.14 * P, ease: 'power1.in' }, at(0.1))
    // folded: wings swung up towards us, outer panels folded over; paper backs showing
    .fromTo('.s3 .peak', { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 0.8, duration: 0.1 * P }, at(0.1))
    .fromTo('.s3 .wing', { '--h': '74deg' }, { '--h': '0deg', duration: 0.2 * P, ease: 'power2.out' }, at(0.2))
    .fromTo('.s3 .pane.out', { '--f': '172deg' }, { '--f': '0deg', duration: 0.2 * P, ease: 'power1.inOut' }, at(0.36))
    .fromTo('.s3 .pane .back', { opacity: 1 }, { opacity: 0, duration: 0.01 }, at(0.455))
    // two flaps, then it lifts away while she appears
    .to('.s3 .wing', { '--h': '42deg', duration: 0.03 * P, ease: 'sine.inOut', yoyo: true, repeat: 3 }, at(0.57))
    .to('.s3 .peak', { y: '-50svh', scale: 0.35, opacity: 0, duration: 0.12 * P, ease: 'power1.in' }, at(0.64))
    .fromTo('.s3 .portrait', { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.18 * P, ease: 'power2.out' }, at(0.72))
    .fromTo('.s3 .two', { opacity: 0, scale: 0.4, rotation: -20 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.12 * P, ease: 'back.out(2)' }, at(0.78))
    .fromTo('.s3 h2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.1 * P }, at(0.8))
    .set({}, {}, Q + P), // hold the final picture for the rest of the scroll
  self => {
    if (!burstDone && self.direction === 1 && self.progress > at(0.85) / (Q + P)) {
      burstDone = true;
      burst(stage);
    }
  });

  // 4 · invitation: the cards settle in as the stage arrives
  gsap.from('.s4 .cards li', {
    y: 40, opacity: 0, stagger: 0.08, ease: 'power2.out',
    scrollTrigger: { trigger: '.s4', start: 'top 70%', end: 'top 10%', scrub: 0.4 },
  });
}
