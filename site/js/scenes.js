import { burst } from './butterflies.js';

const { gsap, ScrollTrigger } = window;

// The whole page is one film on one stage. Scroll drives a single timeline from top to bottom, 0.5 s behind
// (smoothing, so uneven wheel and trackpad input doesn't read as stutter). Timeline time is measured in
// screens of scroll, so every screen scrolled moves something: nothing pins, unpins or waits.
// Segments hand over inside a seam of about half a screen: the camera keeps moving while one dissolves
// into the next. Only transforms and opacity move. Start states are set here, so without JS every
// segment shows its final picture.
export function film() {
  const world = document.querySelector('.world');
  const T = parseFloat(getComputedStyle(world).getPropertyValue('--T'));
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  gsap.set('.seg:not(.s1)', { autoAlpha: 0 });

  // 1 · dawn garden (0 – 1.2): the camera pushes in; near layers move most
  tl.to('.s1 .hills', { y: '-4vh', scale: 1.04, duration: 1.2 }, 0)
    .to('.s1 .wisteria', { y: '-18vh', scale: 1.1, duration: 1.2 }, 0)
    .to('.s1 .meadow', { y: '6vh', scale: 1.05, duration: 1.2 }, 0)
    .to('.s1 .blossoms', { y: '22vh', scale: 1.12, duration: 1.2 }, 0)
    .to('.s1 .copy > *', { y: '-8vh', duration: 1.2 }, 0)
    .to('.s1 .hint', { opacity: 0, duration: 0.2 }, 0);

  // seam (1.2 – 1.8): the push-in carries on into the meadow, faster, as year one dissolves in
  tl.to('.s1 .sky', { scale: 1.1, duration: 0.6, ease: 'power1.in' }, 1.2)
    .to('.s1 .hills', { y: '12vh', scale: 1.2, duration: 0.6, ease: 'power1.in' }, 1.2)
    .to('.s1 .wisteria', { y: '-55vh', scale: 1.3, duration: 0.6, ease: 'power1.in' }, 1.2)
    .to('.s1 .meadow', { y: '40vh', scale: 1.35, duration: 0.6, ease: 'power1.in' }, 1.2)
    .to('.s1 .blossoms', { y: '75vh', scale: 1.6, duration: 0.6, ease: 'power1.in' }, 1.2)
    .to('.s1 .copy > *', { y: '-35vh', autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 1.2)
    .to('.s2', { autoAlpha: 1, duration: 0.35 }, 1.4)
    .fromTo('.s2 .rail', { y: '25vh' }, { y: 0, duration: 0.6, ease: 'power2.out' }, 1.3)
    .fromTo('.s2 .lead', { y: '20vh' }, { y: 0, duration: 0.25, ease: 'power2.out' }, 1.5) // after the title has gone, in place before the first moment
    .to('.s2 .lead', { y: '-2vh', duration: 2.2 }, 1.75)
    .set('.s1', { autoAlpha: 0 }, 1.8);

  // 2 · year one (1.8 – 4.0): the caterpillar crawls the whole way; the moments pass by one at a time in the
  //     direction it crawls (sideways, so they never drift into the line above them) and are never still on screen
  tl.fromTo('.s2 .cat', { x: '-30vw' }, { x: '105vw', duration: 2.6 }, 1.4);
  gsap.utils.toArray('.s2 .moments li').forEach((li, i) => {
    const at = 1.75 + i * 0.55;
    tl.fromTo(li, { autoAlpha: 0, x: '45vw' }, { autoAlpha: 1, x: 0, duration: 0.2, ease: 'power1.out' }, at)
      .to(li, { x: '-6vw', duration: 0.25 }, at + 0.2)
      .to(li, { autoAlpha: 0, x: '-45vw', duration: 0.15, ease: 'power1.in' }, at + 0.45);
  });

  // seam (4.0 – 4.6): night falls and the chrysalis comes down on its twig
  tl.to('.s2 .copy > *, .s2 .rail', { y: '-30vh', autoAlpha: 0, duration: 0.25, ease: 'power1.in' }, 3.95)
    .to('.s3', { autoAlpha: 1, duration: 0.4 }, 4.05)
    .fromTo('.s3 .pod', { y: '-90svh' }, { y: 0, duration: 0.6, ease: 'power2.out' }, 4.25) // after year one's words have gone
    .fromTo('.s3 .hush', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: -10, duration: 0.9 }, 4.3)
    .fromTo('.s3 .pod', { scale: 0.92 }, { scale: 1.08, duration: 1.2, ease: 'sine.inOut' }, 4.0)
    .set('.s2', { autoAlpha: 0 }, 4.6);

  // 3 · chrysalis to wings (4.6 – 7.5). Quiet first: it warms up and trembles a little. Then the peak: it
  //     splits, a folded paper butterfly opens wing by wing, lifts away, and the camera pulls back to her
  //     portrait and a big gold 2.
  const P = 2.3, at = t => 5.2 + t * P; // peak time t (0 – 1) → film time
  tl.fromTo('.s3 .glow', { opacity: 0.1, scale: 0.7 }, { opacity: 0.8, scale: 1, duration: 0.9 }, 4.3)
    .to('.s3 .pod', { keyframes: { rotation: [0, 1.5, -1.5, 2, -2, 2.5, -2.5, 0] }, duration: 0.6 }, 4.6)
    .to('.s3 .hush', { autoAlpha: 0, y: -20, duration: 0.2 }, 5.0)
    .to('.s3 .pod', { keyframes: { rotation: [0, 3, -3, 4, -4, 0] }, duration: 0.1 * P }, at(0))
    .to('.s3 .glow', { opacity: 1, scale: 1.2, duration: 0.2 * P }, at(0))
    .to('.s3 .half.l', { x: '-22vw', y: '45svh', rotation: -35, autoAlpha: 0, duration: 0.14 * P, ease: 'power1.in' }, at(0.1))
    .to('.s3 .half.r', { x: '22vw', y: '45svh', rotation: 35, autoAlpha: 0, duration: 0.14 * P, ease: 'power1.in' }, at(0.1))
    .set('.s3 .pod', { autoAlpha: 0 }, at(0.25))
    // folded: wings swung up towards us, outer panels folded over; paper backs showing
    .fromTo('.s3 .peak', { autoAlpha: 0, scale: 0.55 }, { autoAlpha: 1, scale: 0.8, duration: 0.1 * P }, at(0.1))
    .to('.s3 .peak', { scale: 0.92, duration: 0.44 * P }, at(0.2))
    .fromTo('.s3 .wing', { '--h': '74deg' }, { '--h': '0deg', duration: 0.22 * P, ease: 'power2.out' }, at(0.15))
    .fromTo('.s3 .pane.out', { '--f': '172deg' }, { '--f': '0deg', duration: 0.2 * P, ease: 'power1.inOut' }, at(0.36))
    .fromTo('.s3 .pane .back', { opacity: 1 }, { opacity: 0, duration: 0.01 }, at(0.455))
    // two flaps, then it lifts away while she appears
    .to('.s3 .wing', { '--h': '42deg', duration: 0.03 * P, ease: 'sine.inOut', yoyo: true, repeat: 3 }, at(0.57))
    .to('.s3 .peak', { y: '-50svh', scale: 0.35, autoAlpha: 0, duration: 0.12 * P, ease: 'power1.in' }, at(0.64))
    .fromTo('.s3 .portrait', { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1, duration: 0.18 * P, ease: 'power2.out' }, at(0.72))
    .fromTo('.s3 .two', { autoAlpha: 0, scale: 0.4, rotation: -20 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.12 * P, ease: 'back.out(2)' }, at(0.78))
    .fromTo('.s3 h2', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.1 * P }, at(0.8));

  // seam (7.5 – 8.1): she rises away as day comes back and the invitation slides up
  //     (her picture is gone before the invitation's words arrive)
  tl.to('.s3 .portrait, .s3 .two', { y: '-25vh', scale: 0.8, autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, 7.5)
    .to('.s3 h2, .s3 .glow', { y: '-15vh', autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 7.5)
    .to('.s4', { autoAlpha: 1, duration: 0.4 }, 7.6)
    .from('.s4 .copy > *', { y: '25vh', autoAlpha: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out' }, 7.85)
    .set('.s3', { autoAlpha: 0 }, 8.1);

  // 4 · invitation (8.45 – 9.0): it settles, drifting gently
  tl.to('.s4 .copy > *', { y: '-2vh', duration: 0.55 }, 8.45);

  // seam (9.0 – 9.6) and 5 · close (9.6 – T): the dusk garden rises in behind the last words, then rests
  tl.to('.s4 .copy > *', { y: '-35vh', autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 9.0)
    .to('.s5', { autoAlpha: 1, duration: 0.4 }, 9.05)
    .fromTo('.s5 .frame', { y: '25vh' }, { y: 0, duration: 0.6, ease: 'power2.out' }, 9.0)
    .to('.s5 .frame', { scale: 1.04, duration: T - 9.6 }, 9.6) // grows from its bottom edge, which stays on the screen's
    .from('.s5 .copy > *', { y: '15vh', autoAlpha: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out' }, 9.4)
    .set('.s4', { autoAlpha: 0 }, 9.6);

  // the small butterflies live in the garden: they leave with it and come back over the dusk meadow at the end,
  // so they never fly over words the guest is reading
  tl.to('.flock', { autoAlpha: 0, duration: 0.15 }, 1.2)
    .set('.flock', { y: '24vh' }, 5) // over the meadow: below the words, above the sign-off
    .to('.flock', { autoAlpha: 1, duration: 0.3 }, 9.4)
    .set({}, {}, T);

  // the burst plays once, when the film first reaches it. Its canvas lives inside the peak's part, so it leaves with it
  // (the invitation's paper covers it as it dissolves in) instead of flying over the invitation's words.
  let burstDone = false;
  const stage = document.querySelector('.s3');
  tl.eventCallback('onUpdate', () => {
    const t = tl.time();
    if (!burstDone && t >= at(0.85) && t < at(1)) {
      burstDone = true;
      burst(stage);
    }
  });

  ScrollTrigger.create({ trigger: world, start: 'top top', end: 'bottom bottom', scrub: 0.5, animation: tl });
}
