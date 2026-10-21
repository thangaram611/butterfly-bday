# Taneira turns two: the butterfly invite

A one-page invitation website for Taneira's second birthday. It's built for phones, because the link goes out on WhatsApp. The story: a caterpillar a year ago, wings this year.

Status: **milestone 2, rough build** (plan approved 2026-10-21; style test approved the same day).

## Event facts (single source: `event.json`)

| Field | Value |
|---|---|
| Name | Taneira |
| Turning | 2 |
| Date | Saturday 28 November 2026 |
| Time | 6:00 – 8:00 PM IST |
| Venue | Party Hall, Ramaniyam Magnum, Perungudi, Chennai. Pin `12.977811, 80.245802` (from the host's Maps link) |
| Dress code | Any shade of purple |
| Language | English only |
| Music | None |

## Decision log

| Decision | Choice | Why |
|---|---|---|
| Budget | $0, pay only if the result truly needs it | User, 2026-10-21 |
| Stack | Plain HTML, CSS and JS modules. GSAP and ScrollTrigger kept in the repo. No framework, no build step | User asked for no frameworks. Last year's React re-rendered the whole page on every scroll frame |
| Smooth scrolling | **No Lenis** | Lenis leaves touch scrolling alone by default (`syncTouch` off). GSAP's own smooth-scroll plugin skips touch screens on purpose. Guests are on phones. `scrub: 0.4` already smooths mouse wheels |
| Scroll structure | **One stage for the whole page, scroll plays one continuous film** (scroll-craft's "worldflight"). Nothing pins or unpins | Your iPhone test, 2026-10-21: pinned scenes made the scroll stop and start at every boundary ("three different screens"). scroll-craft: "Acts cut the page into pinned blocks… the wrong shape for one continuous camera move" |
| Art style | Layered paper-cut, like a shadow box | Every element is a flat layer, so depth comes naturally. Paper is rigid, so code-driven motion looks right |
| Story | Caterpillar, then chrysalis, then butterfly. The peak is the wings unfolding | One clear high point |
| Peak technique | Paper wings unfolding in CSS 3D, driven by GSAP. **No video** | $0, sharp at any size, tiny download. Scrubbed video freezes on iPhones in Low Power Mode |
| Her likeness | One AI-styled paper-cut portrait made from a recent photo. No raw photos published | Links get forwarded beyond the guest list |
| Personal links | `?to=Name` greets each family by name. A private helper page makes the links | Guests feel personally invited |
| RSVP | Never called "RSVP". An optional "Tell us you're coming" button opens WhatsApp with the message written and **no phone number**. The guest picks the host's chat | The guest must feel definitely invited, and no number on the page means nothing to scrape |
| Hosting | Cloudflare Pages, free, `*.pages.dev` | Free, has a Chennai edge server, supports caching headers |
| Search | `noindex` in a meta tag and an HTTP header. **No** robots.txt disallow | Keeps the page out of search engines without blocking WhatsApp's preview fetcher |
| 3D engine | **No Three.js** | About 170 KB compressed against a 120 KB code budget, GPU start-up and context loss on phones, and paper layers don't need it. Revisit only for the peak if the CSS unfold falls flat at milestone 2 (user, 2026-10-21) |
| Image format | WebP only, plus `<picture>` for separate phone and desktop crops | Supported everywhere we care about, and quick to decode. AVIF saves bytes but its decode cost on phones is unmeasured |

## What a guest sees (phone, portrait)

About 10 screens of scrolling, roughly a minute. The whole page is one sticky stage; the five parts sit on top of each other inside it and scroll plays them as one continuous film, handing over through half-screen seams (the camera keeps moving while one part dissolves into the next). "Film time" is measured in screens of scroll.

| # | Part | Film time (screens) | What scrolling does | Feeling |
|---|---|---|---|---|
| 1 | **Dawn garden** (opening) | 0 – 1.2, seam to 1.8 | Paints immediately. There is no loading screen. Four paper layers (hills, wisteria, meadow, foreground blossoms) separate at different speeds as the camera pushes in. "Taneira is turning two" sits between the meadow and the blossoms. 3 to 5 butterflies flutter. The `?to=` greeting shows above the title | Delight |
| 2 | **Year one** | 1.8 – 4.0, seam to 4.6 | A paper caterpillar (head plus 5 segments) crawls along a stem, passing four paper vignettes that slide by sideways in its direction of her, each one cut in her paper-cut likeness: the no-teeth smile, the blank stare, the confident babbled stories, the finger-heart "love you" | Warmth |
| 3 | **Chrysalis to wings** (quiet, then the peak) | 4.6 – 7.5 (0.6 quiet, then the 2.3-screen peak), seam to 8.1 | One stage, one chrysalis (merged 2026-10-21 so it never appears twice). Dusk. One chrysalis hangs from a twig and glows warmer and trembles a little as you scroll. Deliberately calm before the peak Then: The chrysalis halves fall away. Each wing is a sheet of folded paper that opens fold by fold, then the whole butterfly lifts. The camera pulls back to show her paper-cut portrait with paper wings beside a large "2". On first arrival, about 30 butterflies burst out across the screen
| 4 | **You're invited** | 8.1 – 9.0, seam to 9.6 | Cards for when (date and time in one card, so it fits an SE-sized screen), venue and dress code (a strip of all five palette colours), each with a butterfly landing on it. Buttons: Add to calendar, Directions. A countdown such as "38 days to go" | Clarity |
| 5 | **We've saved a spot for you** (close) | 9.6 – 10.2, where the page ends | Dusk garden. A "Tell us you're coming 🦋" button with the line "So we know how much cake to make 🍰". Tapping it sends a butterfly flying off the screen carrying the guest's name while WhatsApp opens. The page holds here and does not fade out | Belonging |

Scene 3's peak is the only peak. It gets the most scroll room, the richest art, and the chrysalis's quiet right before it, on the same stage.

**Reduced motion** (`prefers-reduced-motion`): the same scenes as still compositions, nothing pinned, all text and buttons visible.
**No JS**: the HTML stays readable as an invitation, with every detail and link present.

### Copy draft (to refine together)

1. "Dear Ravi Uncle & family," / **Taneira is turning two**
2. "A year ago, she was our little caterpillar." · "Smiles with no teeth." · "Very serious blank stares." · "Long, confident stories, in her own language." · "And 'love you' with a tiny finger heart 🫰"
3. "Lately, something has been changing…"
4. **"She's got her wings!"** / big **2**
5. "Come celebrate with us" · Sat 28 Nov · 6 PM · Party Hall, Ramaniyam Magnum, Perungudi · "Wear any shade of purple 💜" · "38 days to go"
6. "We've saved a spot for you." · [Tell us you're coming 🦋] · "So we know how much cake to make 🍰" · "Made with love by Taneira's family"

The WhatsApp message: "Hi! {Ravi Uncle & family} will be there for Taneira's 2nd birthday 🦋". If there's no `?to=` name, it reads "We'll be there…".

## Architecture

```
site/                       deployed as-is to Cloudflare Pages
  index.html                all content as real HTML; OG tags written in (WhatsApp runs no JS)
  links.html                private helper: type a name → copy or share that family's link (noindex, not linked)
  css/site.css              tokens, layout, the paper-shadow system, reduced-motion layout
  js/main.js                boot: personal greeting, gsap.matchMedia, scene setup
  js/scenes.js              one ScrollTrigger timeline per scene
  js/butterflies.js         ambient CSS butterflies and the canvas burst at the peak
  js/invite.js              countdown, WhatsApp message, calendar links
  js/vendor/gsap.min.js     3.15.0
  js/vendor/ScrollTrigger.min.js
  img/…                     WebP: portrait crops for phones, landscape crops for desktop
  fonts/…                   self-hosted woff2, Latin subset
  taneira-2nd-birthday.ics
  og.jpg  icons/  manifest.webmanifest  sw.js  _headers
tools/                      dev only, never deployed
  gen.sh                    one image via Codex: prepends the style paragraph, attaches references, saves to art/raw/
  event-sync.mjs            event.json → date/venue text in index.html, OG description, .ics, Google Calendar and Maps links
  art.py                    art/raw PNG → site/img WebP: crops layers to their artwork (prints --top), centres butterflies, makes paper-back silhouettes
  check.mjs                 screenshot sheet (6 positions per scene × 3 sizes + reduced motion), flicker test, long-task test
package.json                dev only: playwright-core and the npm scripts serve / shots / flicker / tasks
art/
  STYLE.md                  the style preamble, used word for word in every prompt, plus the palette
  prompts/                  one prompt file per asset (in git)
  raw/                      Codex outputs (git-ignored)
  private/                  her photos, plus EXIF-free downscaled copies in ref/ (git-ignored, never deployed)
event.json
```

### Scroll mechanics

- `<main class="world" style="--T:10.2">` holds one `.stage` (`position: sticky; top: 0; height: 100lvh`) and the world is `(T + 1)` screens tall. The five `.seg` parts sit stacked inside the stage. All of this only under the `.anim` class, which an inline script in `<head>` sets before first paint when motion is allowed (no layout shift; it falls back to the plain page if GSAP hasn't arrived after 4 s). Without it, the parts are plain stacked screens.
- One GSAP timeline, time in screens of scroll, scrubbed over the whole world with `scrub: 0.5` (the smoothing scroll-craft uses so uneven wheel and trackpad input doesn't read as stutter). Every screen of scroll moves something; a hard flick plays the film fast, as one motion.
- Seams: the outgoing part's pieces keep moving and fade while the next part dissolves in (`autoAlpha`, so hidden parts are `visibility: hidden` and cost no graphics memory). Text of one part clears before the next part's text arrives.
- Parts after the first are `display: none` until the page has loaded (or the guest starts scrolling), so their images don't compete with the first screen.
- Portrait art sits in a 2:3 `.frame` (covers a phone; a centred column on a laptop until the landscape art exists), centred with a negative margin. Layers are cropped to their artwork and placed with `--top`, a % of the frame.
- Anything GSAP moves is positioned with top/left/margins, never a CSS transform, because GSAP owns the transform. Only small pieces are promoted (`will-change`); never a full-screen box.
- Backgrounds fill `lvh`. Text and buttons stay inside `svh` plus the safe-area insets, so the address bar never covers them.
- Everything is set up inside `gsap.matchMedia()`. The animated build exists only under `(prefers-reduced-motion: no-preference)`. Phone and desktop get different travel distances.

### Butterflies

- **Ambient:** each butterfly is two half-width elements showing the left and right halves of one small sprite (`background-size: 200%`), so no cutting step is needed. The flap is a CSS `rotateY` keyframe and the drift is a CSS transform keyframe, so both run on the compositor and cost no JS per frame. Capped at 8 on phones and 14 on desktop. An IntersectionObserver pauses off-screen ones. One flock of 6 (10 on larger screens) lives in the garden band below the headline; it leaves with the garden and comes back over the dusk meadow at the end, so butterflies never fly over words being read.
- **Peak burst:** one canvas. About 30 sprites, wings flapped with `setTransform` x-scale. It runs for 2.5 s, pixel density is capped at 2, and the canvas is removed afterwards. It fires once, when the peak timeline passes 0.85 going forward.
- **Unfolding wings (peak), as built:** two wings hinged at the body (`--h`), each with one outer panel hinged on a slanted crease (`--f`, `rotate3d`). The panel's back is `butterfly-a-back.webp`, a plain paper silhouette that fades in while the panel faces away. The wrapper `.peak` fades, never `.bfly`, because opacity below 1 flattens 3D.
- **Original design:** one image per wing. Fold panels are made from that same image with `clip-path` polygons, so no extra art is needed. Each outer panel hinges on its crease with `rotateY`/`rotateX`, and the back of the paper is a plain colour face. Folds go **one level deep only**: `clip-path` flattens 3D for an element's children, so panels never nest. Prototyped first thing in milestone 2 on a real iPhone, since this is the main technical risk.

### Performance rules (each fixes one of last year's lag causes)

| Rule | Last year's cause |
|---|---|
| Nothing re-renders on scroll. GSAP writes transforms directly | React `setState` on every scroll frame |
| Animate only `transform` and `opacity` | Animated `filter: drop-shadow` on a 767 KB castle |
| No `mix-blend-mode`. No live `filter` or `backdrop-filter`. Paper shadows and depth blur are drawn into the images | Four full-screen screen-blended layers. `backdrop-blur` over moving layers |
| No loading screen. The first scene paints from HTML and CSS and its images load progressively | A loader that waited for every image |
| No startup particle effects. The one burst comes at the peak and then stops | Three seconds of confetti plus rockets at load |
| Correctly sized icons | A 2.5 MB `favicon.svg` and a 546 KB app icon |
| Images sized per screen with `srcset`; off-screen scenes lazy-load. Scene 4's art is fetched as soon as scene 2 comes into view | One full-size image for every device |
| Layers are cropped to their artwork and positioned inside an aspect-locked frame, never full-screen boxes. Only the near layers zoom, and by 12% at most; the sky never moves | Style test, 2026-10-21: five full-screen layers zooming 1.45× flashed blank in desktop Chrome when graphics memory was tight. Cropped, they pass at 48 MB |

### Budgets, checked with the Playwright network log and Lighthouse

- Code (HTML, CSS, JS, fonts): **≤ 120 KB** compressed.
- First screen in total: **≤ 450 KB**. The headline is the largest element and shows within **2.5 s** on throttled 4G.
- Whole page: **≤ 2.5 MB**.
- Lighthouse mobile performance **≥ 90**, layout shift (CLS) **< 0.05**.
- Scrolling with the CPU slowed 4× (390×844 emulation): **no main-thread task over 50 ms** while scrolling.

## Art direction and asset pipeline ($0)

### Style bible (`art/STYLE.md`), used word for word in every prompt

> Layered paper-cut illustration in a handmade shadow-box style. Matte coloured cardstock with fine paper-fibre texture, clean scalpel-cut edges, each layer casting a soft short drop shadow onto the layer behind. Palette strictly lilac #C8A2C8, lavender #967BB6, amethyst #9966CC, violet #6F2DA8, indigo #4B0082, off-white paper #FBF7FD, and soft sunlight gold #F4C95D as the only accent. Leaves and stems are in violet and indigo shades too: an all-purple garden. Soft warm light from the top left. Gentle, joyful picture-book mood for a two-year-old. No text, no letters, no logos.

- **The all-purple garden** ties to the "any shade of purple" dress code and keeps green out of the palette. That also lets green act as a clean chroma-key background if transparent output fails.
- **Gold** is the only warm colour. It goes on the "2", the wing tips and the buttons. It gets confirmed at the style test.
- **Text colours:** indigo `#4B0082` on paper `#FBF7FD`, or white on violet `#6F2DA8` (about 8:1 contrast). Both pass WCAG AA with room to spare.
- **Fonts:** Fredoka for display (rounded, friendly, variable) and Nunito for body text. Both OFL, self-hosted, `font-display: swap`. Subset with `pyftsubset` to Basic Latin plus typographic punctuation: 19 KB + 21 KB, down from 30 + 39. Names typed in other scripts fall back to the system font.

### Generation (Codex `$imagegen` on the ChatGPT plan, no API key)

1. **Reference sheet first:** one image showing a paper butterfly, a leaf, a flower and a hill slice in the style. It's attached (`-i`) to every later generation so 40 images look like one set.
2. **Scene first, then layers:** each scene is generated whole, then every layer is recreated from it (scene and reference sheet attached), each with a transparent background. This keeps shapes and positions lined up across layers. Portrait (phones) and landscape (desktop) are separate compositions, not crops.
3. **Edge check:** every cut-out is inspected on both a dark and a light background for halos and soft alpha, and checked for stray elements from neighbouring layers. Codex returned real transparency in the style test, so the fallbacks (flat `#00FF00` key-out, or local `rembg`) haven't been needed.
4. **Butterflies:** 4 designs, top-down, wings open, symmetric. `tools/art.py butterfly` centres the body line at exactly 50% and writes the full-size art, a 256 px sprite and the paper-back silhouette.
5. **Her likeness:** the reference photos are `art/private/t2.1.jpg` (front face, the main reference), `t3.jpg` (smile), `t2.jpg` (profile) and `t1.jpg` (full body). Her look: twin pigtails with pale-blue bows and big round eyes. First a paper-cut **character sheet** of her is made from those photos and approved. That sheet, not the photos, then drives the portrait (paper wings, transparent background) and the four year-one vignettes, so she looks the same in all five. The photos are git-ignored and never deployed. They do get uploaded to OpenAI through Codex.
6. **Export:** `cwebp -q 82 -alpha_q 90`. Portrait layers at 768 and 1024 wide; landscape at 1152 and 1536 wide (more if Codex returns larger).

### Asset list (about 40 images)

| Scene | Assets |
|---|---|
| Shared | paper texture tile (512 px, seamless) · 4 butterflies → 8 wings · reference sheet |
| 1 Dawn garden | far hills · wisteria · meadow · foreground blossoms (blur drawn in) · sun disc (or CSS). Portrait and landscape of each |
| 2 Year one | stem/leaf rail · caterpillar head and segment · her character sheet · 4 vignettes: no-teeth smile, blank stare, babbled stories (paper speech bubbles), finger heart |
| 3 Chrysalis to wings | chrysalis halves · glow · 4 wing sheets (2 forewings, 2 hindwings) · body · her portrait with wings · paper "2" |
| 4 Invitation | card paper texture (or CSS) · small flowers for card corners |
| 5 Close | dusk garden layers (variations on scene 1 to save generations) |
| Share | `og.jpg` 1200×630 under 300 KB with the subject centred (WhatsApp sometimes crops to a square) · icons 180, 192, 512, maskable 512 · favicon 32 plus a small SVG |

## Invitation features

- **Personal greeting:** read `?to=` and limit it to 40 characters. Insert with `textContent` only, so a name like `<script>` shows as plain text.
- **Link helper (`links.html`):** type "Ravi Uncle", then **Copy link** or **Share on WhatsApp**. Sharing opens WhatsApp with a short invite line plus the personal link, and you pick that family's chat.
- **Tell us you're coming:** a real `<a href="https://wa.me/?text=…">` link with no number, so WhatsApp asks which chat to send to. The butterfly animation starts on tap while the link opens straight away; delaying the navigation could stop iOS opening the WhatsApp app. When the guest comes back, the page shows "Thank you! See you there 💜".
- **Calendar:** a static `.ics` file in UTC (6–8 PM IST is `20261128T123000Z`–`20261128T143000Z`) for iPhone, and a Google Calendar link for Android.
- **Directions:** `https://www.google.com/maps/dir/?api=1&destination=12.977811,80.245802`, which opens turn-by-turn directions in the Maps app on both platforms. The venue line reads "Party Hall, Ramaniyam Magnum" so guests know it's inside the complex.
- **Countdown:** "N days to go" in Asia/Kolkata time. After the party it changes to a thank-you line.
- **Single source of truth:** edit `event.json`, then run `node tools/event-sync.mjs`. It updates every place the date or venue appears.

## Home-screen and offline support (last priority)

- `manifest.webmanifest`: name, violet theme colour, standalone display, icons including a maskable one.
- `sw.js`, about 50 lines:
  - Pre-caches the page shell and scene 1's art.
  - Serves other images from cache first.
  - Fetches the HTML from the network first, so a changed date or venue reaches everyone, and falls back to the cached copy offline.
- The payoff: after one visit, time and venue open even with no signal at the venue.

## Hosting and deploy

- Cloudflare Pages connected to this GitHub repo, with the output folder set to `site/`. Every push to `main` deploys. Connecting is a one-time click in the Cloudflare dashboard, done by you.
- `_headers`:
  - `/img/*` and `/fonts/*`: `max-age=31536000, immutable`. A changed image gets a new file name.
  - HTML, CSS and JS: `max-age=0, must-revalidate`. Cheap ETag checks, and edits show up immediately.
  - Every page: `X-Robots-Tag: noindex`.
- Local development: `npm run serve` (port 8000). To test on a phone over Wi-Fi, serve with the system Python (`/usr/bin/python3 -m http.server 8642 --bind 0.0.0.0 --directory site`): the Mac's firewall blocks Homebrew's Python from accepting connections. Stop the server afterwards.

## Verification

Tools: Chrome DevTools (CPU slowdown, Performance panel), Lighthouse, `tools/check.mjs` (Playwright with the installed Chrome: `npm run shots`, `npm run flicker`, `npm run tasks`), and your real phones: an iPhone 13 or newer, an Android, and a borrowed family phone as the worst case.

Every visual change is checked against:
- Screenshot sheet at 390×844, 360×800 and 1440×900, plus reduced motion. Read by eye, not just generated.
- No console errors. Byte budgets measured.
- Flicker and stop test (`npm run flicker`): headed Chrome records a slow scroll through the whole page at phone and laptop size, with graphics memory cut to 48 MB on the phone screen and the same four screens' worth on the laptop (107 MB). Flash: the picture jumps away and is back within 4 frames (validated on the flickering style-test preview and its fix). Hit: the picture goes from moving to nearly frozen within a few frames while the scroll keeps going. Also reports the longest still stretch. Baseline with pinned scenes: 6 hits on the phone; one film: 2, one of them a dissolve the detector over-reads, the other the folded butterfly that the wing upgrade replaces.
- Layout audit (`npm run layout`): steps through the whole film at 1001 points (about 7 px of scroll apart) on seven setups: iPhone 13 in WebKit (Safari's engine) and in Chrome, an SE-sized phone in WebKit, a large Android, a 360 px Android, a laptop, and the reduced-motion page. At every point it fails on: anything (another text, a card, the stem, the caterpillar, her portrait, the chrysalis, the "2", a butterfly) covering readable text; fully visible text off screen; painted scenery not reaching the bottom edge (or both sides on a phone); a visible image that failed to load; sideways scrolling. Once per page: buttons under 44 px, console errors, failed requests. Proven on the two bugs you found on 2026-10-21 (moment cards over "A year ago…", the gap under the closing garden): it caught both, plus seven more of the same kind, before any fix.
- The burst is drawn on a canvas, which the audit can't see into, so it is kept inside the peak's part by construction and leaves with it.

Real-phone checklist, before launch:
- [ ] Scrolling all six scenes stays smooth on Android and iPhone.
- [ ] The same holds on an iPhone in Low Power Mode.
- [ ] Nothing jumps when the address bar collapses or expands.
- [ ] The wing unfold renders correctly in iOS Safari (3D plus `clip-path`).
- [ ] The personal greeting renders, including an odd name like `Ravi & Priya <3`.
- [ ] Tell us you're coming: WhatsApp opens its chat picker with the message filled in.
- [ ] `.ics` opens in iPhone Calendar. The Google Calendar link works on Android.
- [ ] Directions opens the correct venue pin.
- [ ] Countdown is right in IST.
- [ ] Rotating the phone redraws cleanly.
- [ ] Airplane mode after one visit: the invitation details still show.
- [ ] A WhatsApp message to yourself shows the preview card with image, title and description.

## Milestones (each ends with its check; dates are targets with buffer)

| # | Milestone | Check that ends it | Target |
|---|---|---|---|
| 1 | **Style test:** style bible, reference sheet, scene 1 layers (portrait), her paper-cut character sheet | You approve the look and her likeness on your phone | Oct 24 |
| 2 | **Rough build:** all 6 scenes with placeholder art. Wing-fold prototype. Personal greeting | 4× CPU slowdown run with no long tasks. Flicker test passes. Real iPhone and Android: smooth, no jumps, wing fold correct. **Peak judged here, at $0** | Oct 29 |
| 3 | **Final art:** every asset, cut-outs checked, phone and desktop versions | Screenshot sheet passes. Budgets met | Nov 5 |
| 4 | **Invitation features and portrait** | The feature items in the real-phone checklist | Nov 8 |
| 5 | **Home-screen/offline support and full QA** | The whole real-phone checklist. Lighthouse ≥ 90 | Nov 11 |
| 6 | **Launch:** Cloudflare Pages, preview card checked, links made | You send the first real invite | Nov 12–14 (two weeks before the party) |

### Milestone 2 results (2026-10-21, before your phone test)

- Built: all six scenes; scene 1 with its real layers; real butterflies, chrysalis and a first winged portrait (A of two); placeholders for the year-one vignettes (emoji cards) and the stem and caterpillar (CSS).
- Long-task test: no main-thread task over 50 ms with the CPU slowed 4×. Flicker test: no flashes at phone or laptop size.
- Code 95 KB compressed (budget 120). Whole page 1.3 MB (budget 2.5). **First screen 538 KB, over the 450 KB budget**, as forecast: fixed in milestone 3 by tuning the heavy layers.
- Personal greeting renders `Ravi & Priya <3` as plain text; the WhatsApp message carries the name.

### If the peak falls flat at milestone 2 (cheapest fix first)

1. More in-between drawings from Codex: fold stages and wing poses that crossfade over the 3D unfold. Free.
2. Free tiers of video tools, but only if their output has no watermark. Checked at that point, not assumed.
3. A paid clip (about $5–10: Kling, Seedance, Luma or Gemini Omni, with our chrysalis and open-wing stills as first and last frames), converted to about 90 WebP frames on a canvas (about 3 MB, loaded coarse-first). Adds a small sequence module.

## What we took from the references

- **scroll-craft:** one engineered peak with quiet before it; independent depth planes in the hero; phones art-directed separately; a style preamble used word for word; verifying by scrolling and screenshots, with a real phone as a first-class target. Left out: its engine, its uniqueness-gate process, and its paid image service (kie.ai).
- **scroll-world:** every asset generated from one style source; the iOS lessons (address-bar resizes, safe areas, decoders that behave differently from desktop); native portrait art for phones. Left out: the video chain (paid and fragile).

## Open items

- [x] Recent photos of Taneira (4, in `art/private/`, git-ignored).
- [x] Venue pin and end time (8 PM).
- [x] Year-one moments: no-teeth smile, blank stare, babbled stories, finger heart.
- [x] Sign-off: "Taneira's family". Button line: "So we know how much cake to make 🍰".
- [ ] Final polish of the rest of the copy (draft above).
- [x] Gold accent: yes.
- [x] Her drawing sheet: B (`art/raw/taneira-sheet.png`).
- [ ] Year-one vignettes: draw her a year younger (gummy smile) or as she is now? Decide before milestone 3.
- [ ] First-screen weight: the five scene-1 layers are about 410 KB at 1024 px wide, which leaves little room in the 450 KB budget. Tune quality per layer in milestone 3 (wisteria alone is 143 KB).
