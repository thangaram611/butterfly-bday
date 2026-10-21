# Style bible

Every image prompt starts with this paragraph, word for word. `tools/gen.sh` prepends it, so prompt files in `art/prompts/` hold only what is specific to one image.

> Layered paper-cut illustration in a handmade shadow-box style. Matte coloured cardstock with fine paper-fibre texture, clean scalpel-cut edges, each layer casting a soft short drop shadow onto the layer behind. Palette strictly lilac #C8A2C8, lavender #967BB6, amethyst #9966CC, violet #6F2DA8, indigo #4B0082, off-white paper #FBF7FD, and soft sunlight gold #F4C95D as the only accent. Leaves and stems are in violet and indigo shades too: an all-purple garden. Soft warm light from the top left. Gentle, joyful picture-book mood for a two-year-old. No text, no letters, no logos.

## Palette

| Name | Hex | Use |
|---|---|---|
| Lilac | `#C8A2C8` | light petals, highlights |
| Lavender | `#967BB6` | far hills, mid tones |
| Amethyst | `#9966CC` | wings, meadow |
| Violet | `#6F2DA8` | leaves, buttons; white text sits on it |
| Indigo | `#4B0082` | stems, deepest layers, body text |
| Paper | `#FBF7FD` | backgrounds |
| Gold | `#F4C95D` | the only warm accent: the "2", wing tips, buttons |

Her skin (warm brown) and hair (near-black) are the only colours outside the palette.

## Rules

- `art/raw/ref-sheet.png` is attached to every generation after it, so the whole set reads as one.
- Layers have real transparency. Each cut-out is checked on a dark and a light background before use.
- Her likeness comes from the approved character sheet. Only the sheet itself is made from her photos.
