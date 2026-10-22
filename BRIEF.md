# Brief: Taneira is turning two

The scroll-craft brief for the rebuild, written before any act or asset exists. Everything downstream (`site/`, the art, the checks) reads from this file.
Follows nateherkai/scroll-craft `SKILL.md` steps 0 to 2, `feel.md` and `uniqueness.md`. Written 2026-10-22; revised the same day after a second-opinion review (Fable) and the first skeleton (see "Revisions" at the end).

**How it was written:** from your answers across our sessions, quoted where you said it. Lines marked *authored* are my decisions where you delegated ("its your call ultimately") or never said; change any of them.

## Step 0: the eight topics

1. **Vibe.** *Authored:* butterflies, violet, handmade paper, joyful. Your words: "The theme of the birthday this time is butterflies and main color is violet". Art style: "Layered paper-cut". References: "take apple site for example … no matter how hard i scroll or flick it doesnt stop anywhere it just scrolls smoothly to the bottom. the animations are a part of the scroll". Anti-reference: last year's site, "too laggy and not perfect on the asserts and didnt quite hit the mobile audience properly".
2. **The journey, in your words.** "Caterpillar to butterfly". The year-one moments: "her 'smile with no teeth', her 'Blank staring', her 'Confident wobbly stories', her 'love you with finger gesture'". Then the party details, then "Tell us you're coming", signed "Taneira's family".
3. **Energy curve.** *Authored:* calm open, tender middle, a hush, one big peak, calm and clear details, a warm ending.
4. **Feeling and the one moment.** The peak is the butterfly's wings opening (approved in `PLAN.md`). Guests must feel "definitely included" ("The thing about RSVP is that the guest should not think that they are optional").
5. **The one thing no other site does.** Your seed: "Some of the small butterflies that reacts to scroll and touch would be a great addition". It becomes the signature move below.
6. **Aesthetic range.** *Authored:* **playful** (scroll-craft `uniqueness.md` §5: "Kids, games, consumer apps"), a picture book for a two-year-old's family. Not premium-minimal.
7. **One world or distinct scenes.** One world, one story: "This still feels like scenes stitched together not a single unified story from top to bottom!" (2026-10-22; the full direction is quoted under Grammar). Earlier: "I like apple style".
8. **Assets we have.** Her photos in `art/private` (never published); the approved paper-cut garden (5 layers), drawing sheet B (her likeness), butterflies A and B, the chrysalis, her winged portrait (version A). Codex image generation on your ChatGPT plan. No footage. $0 ("Try to make it $0 as much as possible").

## Step 1: what it is and what it does

- **What and who:** the invitation to Taneira's 2nd birthday, for family and friends, opened from WhatsApp, almost always on a phone.
- **What the guest must believe by the end:** *we can't wait to see you there.* You're invited, not asked whether you might come.
- **The one next action:** **Tell us you're coming** (a WhatsApp message to the family; no number on the page). One label, used everywhere. Add to calendar and Directions are tools inside the details, not calls to action.
- **World:** genuinely illustrated, because this is a children's invite (`worlds.md` allows that and asks to commit to it properly). The style preamble in `art/STYLE.md` is reused word for word in every prompt. *To add:* a negative list ("not 3D render, not clay, not plastic, no digital glow"), which `worlds.md` says holds models on style.

**Journey** (what the guest learns):

| Beat | |
|---|---|
| 1 Welcome | something lovely is happening for Taneira |
| 2 Remember | a year ago she was our little caterpillar |
| 3 Anticipate | something has been changing |
| 4 Celebrate | she's got her wings: she's turning two |
| 5 Know | when, where, what to wear |
| 6 Come | we've saved a spot for you |

## Step 2: grammar, signature move, gate, feeling curve, score

### Grammar: continuous world, one story

Your direction (2026-10-22): *"The website should start with a garden, when scrolling it should take the users into the garden where we take them through the first years moments as caterpiller and the same caterpiller animates and transfomes to chrysalis and then to a butterful which then continues to transform to 2 yearold baby taneira. Now we can end the animation and we can hit something. Its fine. below are two sections that go well with the website blend in."*

So the page is one story on one pinned picture (`uniqueness.md` §2.4, continuous world), with one camera and one character from the first screen to her portrait, then two ordinary sections over the same garden. The earlier versions failed this in the same way: every scene was its own picture, so it felt stitched, whatever moved between them.

- **No video legs.** scroll-craft's worldflight mode crossfades video clips; here the world is our layered paper art moved live, and the transformation is played frame by frame from eight Codex drawings, like paper stop-motion. Its guidance for bespoke stages applies: the stage publishes what it draws in `data-sc-verify-state`, so the harness can check it.
- **Navigation:** none (unchanged).
- **The one place it stops:** when she has her wings. That's the end of the story, and you said a stop there is fine.

### Signature move: butterflies come out of your finger

Unchanged from the review, and now it can join the story: the butterflies released by your finger follow the caterpillar down the vine, gather at the twig while it changes, and settle around **Tell us you're coming** at the end.

**"It's the site where…"** *you follow a little paper caterpillar down a vine, past her first year, and watch it become Taneira with wings.*

### Fingerprint gate

First build in this workspace, so the registry is empty and the gate passes by construction.

### The story, beat by beat

Timeline time is screens of scroll, and nothing smooths or delays it, so it moves exactly with the thumb. The camera is one number; every layer moves by it times its depth (sky 0.15, hills 0.4, meadow 0.85, the vine and its words 1, near foliage 1.3, the flowers 1.35).

| Beat | Feeling | What happens | Screens |
|---|---|---|---|
| Garden | Wonder | The dawn garden and her name; a little paper caterpillar sits on the flowers | first screen |
| Into the garden | Curiosity | The camera sinks: sky and hills stay back, the meadow and flowers rise past, and the meadow fades into the dark ground under it. The vine comes up with the caterpillar on it | 0 – 1 |
| Year one | Tenderness | The camera follows the caterpillar down the vine. "A year ago, she was our little caterpillar." Four memories hang on the leaves, each with its words on a paper tag: no-teeth smile, serious stares, babbled stories, finger heart | 1 – 3.1 |
| The twig | Hush | The camera slows to a stop as the vine ends at a twig (it eases in at the speed it was going, so there's no jolt). The caterpillar, grown a little, lowers itself on a silk thread; night falls; "Lately, something has been changing…" | 3.1 – 4.0 |
| The change | Awe (the peak) | It hangs in a J and curls up asleep, and paper petals close round it into the chrysalis; the chrysalis glows, opens, and a butterfly climbs out, crumpled, and spreads its wings, the camera leaning in | 4.0 – 6.7 |
| Her | Joy | The camera follows the butterfly down; she rises into view; it flutters down behind her and becomes her wings. "She's got her wings!", the gold 2, a burst of butterflies from behind her. The story ends | 6.7 – 8.6 |
| Details | Clarity | She steps away, and the same garden comes back at evening behind the date, venue and dress code | after the story |
| Close | Warmth | "We've saved a spot for you." Tell us you're coming. A few butterflies come out once it has arrived | the last screen |

**The peak, as a guest would tell it:** *"the caterpillar I'd followed down the vine turned into a butterfly under my thumb, and then it became her wings."*

### Art

| Piece | State |
|---|---|
| Dawn garden (5 layers) | Approved, reused |
| Vine, near foliage, paper caterpillar | Drawn by Codex 2026-10-22 for this story; stem line traced so the caterpillar crawls exactly on it. The caterpillar is cut into its paper pieces (`tools/art.py segments`), each placed on the stem at its own point along the body, so it bends with the vine and hangs straight from its thread. The foliage's seam was repaired by Codex (`tools/art.py tile`) so it repeats without a line; the vine's stem ends inside the twig's branch |
| Twig | Cut from the chrysalis drawing; the frames hang from its knot |
| The change | Eight Codex drawings (2026-10-22), each drawn from the one before it: J, curling up, wrapped, chrysalis, glowing, crumpled wings, half open, then the empty shell with the butterfly that flies to her hanging from it (Codex's own open-winged drawing is dropped: its shell and butterfly didn't match the ones after it). `tools/art.py frames` lines each one up on the twig, and the empty shell on the shell before it. The scroll picks the drawing and it dissolves in over 0.3 s on its own, so the picture always rests on a whole drawing |
| The four memories | Baby drawing sheet from `b1`, `b2`, `b4`, `b5` and her drawing sheet B (`art/raw/baby-sheet-a.png`), awaiting your approval; four paper medallions drawn from it: gummy smile, serious stare, a long story, finger heart |
| Her portrait | Version A; the butterfly lands on its wings |
| Evening garden | The dawn layers under a dusk wash |

### Taste floor

As before: no scroll hint, no emoji icons, no identical cards, balanced headlines, a scrim only behind the title, words over art only on their own paper tags.

## Mechanism

- **The story:** our own GSAP timeline (`site/js/story.js`), played by the scroll once per frame. One pinned stage (CSS sticky), laid out in the small viewport (`svh`, the browser's bars showing) so nothing on it shifts when they collapse, and reaching down to the large one (`lvh`) so nothing shows below it when they do.
- **scroll-craft's engine, unedited,** reveals the details and the close as they arrive, and its harness checks the page.
- **GSAP 3.15.0** (latest). ScrollTrigger isn't loaded.

## How it gets checked

- `npm run layout`: overlaps (art painting over words, unless the words sit on their own paper and the art passes behind), words off the side or off a pinned screen, a drawing left half-dissolved once the scroll rests or more than two showing at once, tap targets, sideways scroll, broken images, errors; 7 setups, 1001 points each. Proven on planted faults.
- `npm run craft`: scroll-craft's harness at phone, laptop and reduced motion; dead scroll checked through the stage's drawn state, densely sampled. Its contrast pass only grades words the engine cues, so it doesn't cover this page's words; contrast is read by eye on the sheets.
- `npm run tasks` and `npm run flicker`.
- The feel check, then your phones.

## Build order

Each step is its own branch, compared on your phone and merged only when you say so.

1. **The story with stand-in art** (branch `feat/one-story`): judge the feel, especially the stop at the twig and that it reads as one story.
2. **The change, done properly:** done on `feat/story-art`, nine drawings played frame by frame (eight since `fix/phone-notes-2`).
3. **The signature butterflies.**
4. **Year one:** done on `feat/story-art`, the baby drawing sheet and the four memory pictures.
5. **Details and close polish,** then milestones 3 to 6 from `PROGRESS.md`.

## Revisions

- 2026-10-22, after the second-opinion review and the first skeleton:
  - The garden and the close scroll normally; the peak is the only pin. A pin holds the words still under a moving thumb, which is the "hit something" feeling, and on an iPhone the engine's pin measurements shift when the address bar collapses.
  - The title doesn't build line by line (a hero must greet); the line-by-line headline moved to the peak.
  - GSAP is driven from the engine's progress, and ScrollTrigger is dropped.
  - The signature move starts from the first scroll touch, not only taps, and gathers at the chrysalis.
  - Build order: the signature moves before the year-one art.
  - Suggested by the review, not decided: cut desktop landscape art, offline support and the countdown before launch.
- 2026-10-22, your direction after the skeleton ("This still feels like scenes stitched together not a single unified story"): one continuous story on one pinned picture, from the garden to her portrait, with the caterpillar as the one character; then the details and the close over the same garden at evening. Supersedes the five-act score above it.
