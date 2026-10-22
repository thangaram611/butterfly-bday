const { gsap } = window;

// The garden scrolls away at the page's speed with its title and nearest flowers, while the farther layers trail
// behind by depth: data-lag is the share of the scroll a layer lags by (scroll-craft's layered scene, devices.md §6).
// Driven here rather than by the engine's data-sc-parallax, whose rate depends on the window height: on an iPhone
// that changes when the address bar collapses and every layer would jump. The section's own height never does.
export function garden() {
  const section = document.querySelector('.garden');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const layers = [...section.querySelectorAll('[data-lag]')].map(el => ({ set: gsap.quickSetter(el, 'y', 'px'), lag: +el.dataset.lag }));
  let height = section.offsetHeight;
  addEventListener('resize', () => (height = section.offsetHeight), { passive: true });
  return () => {
    const y = Math.min(scrollY, height);
    for (const l of layers) l.set(y * l.lag);
  };
}
