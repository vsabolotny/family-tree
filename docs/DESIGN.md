# Design System Specification: The Digital Archivist

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Curated Legacy."** We are not building a database; we are crafting a digital heirloom. This system moves away from the sterile, rigid grids of modern SaaS and instead draws inspiration from high-end editorial layouts and physical family archives.

To break the "template" look, designers must embrace **Intentional Asymmetry**. Larger serif displays should often be offset, and imagery should feel "placed" rather than "slotted," utilizing overlapping elements and generous white space to evoke the feeling of a bespoke scrapbook. We prioritize tonal depth and tactile layers over flat, digital-first structures.

## 2. Color & Surface Philosophy
The palette is rooted in the "Deep Mahogany" (`primary`), "Cream" (`background`), and "Soft Gold" (`secondary`) requested, balanced by a sophisticated neutral scale.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning content. Boundaries must be defined solely through:
- **Background Color Shifts:** Placing a `surface-container-low` section against a `surface` background.
- **Tonal Transitions:** Using depth to imply edges rather than strokes.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of fine parchment or frosted glass. Use the `surface-container` tiers to define importance:
- **Level 0 (Background):** `surface` (#fcf9ef) – The base "paper."
- **Level 1 (Sections):** `surface-container-low` (#f7f4e9) – Subtle grouping.
- **Level 2 (Cards/Content):** `surface-container` (#f1eee4) – Primary content containers.
- **Level 3 (Interactive/Pop-overs):** `surface-container-highest` (#e5e2d9) – Elements requiring immediate focus.

### The "Glass & Gradient" Rule
To avoid a flat appearance, use **Glassmorphism** for floating elements (like navigation bars or modals). Utilize semi-transparent versions of `surface` with a `backdrop-filter: blur(12px)`. 
**Signature Texture:** Main CTAs or Hero sections should employ a subtle linear gradient from `primary` (#421518) to `primary_container` (#5d2a2c) at a 135-degree angle to provide a "leather-bound" visual soul.

## 3. Typography
The typography scale creates a dialogue between the historical (`notoSerif`) and the functional (`manrope`).

- **Display & Headline (Noto Serif):** These are your "Editorial Voices." Use `display-lg` for moments of high emotion (e.g., a family patriarch's name). The high contrast of the serif evokes authority and timelessness.
- **Title & Body (Manrope):** These are your "Curator’s Notes." `manrope` provides a clean, modern counterpoint that ensures legibility for long-form family histories and metadata.
- **Label (Manrope):** Used for metadata and micro-copy. Always use `label-md` or `label-sm` in `on_surface_variant` (#524343) to maintain a soft, non-intrusive hierarchy.

## 4. Elevation & Depth
Hierarchy is achieved through **Tonal Layering** and ambient light, mimicking a physical archive under soft gallery lighting.

- **The Layering Principle:** Stack `surface-container-lowest` cards onto `surface-container-low` backgrounds. This creates a "natural lift" that feels organic rather than synthetic.
- **Ambient Shadows:** When an element must float, use extra-diffused shadows. 
    - *Formula:* `box-shadow: 0 12px 32px rgba(28, 28, 22, 0.06);` (Using a tinted `on_surface` color instead of pure black).
- **The "Ghost Border" Fallback:** If a container lacks contrast, use a "Ghost Border": `outline-variant` (#d7c2c1) at **15% opacity**. Never use 100% opaque borders.
- **Backdrop Blur:** Use `surface_variant` with 80% opacity and a 10px blur for "archival overlays" to keep the user grounded in the previous context.

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `on_primary` text, `round-md` (0.75rem).
- **Secondary:** `secondary_container` (#fed488) fill with `on_secondary_container` (#785a1a) text.
- **Tertiary:** No fill. `notoSerif` text with a `secondary` (#775a19) underline of 2px.

### Cards & Lists
**Strict Rule:** No divider lines. Separate items using `md` spacing (0.75rem) or subtle background shifts. 
- **Archival Cards:** Use `surface-container-lowest` with `xl` rounding (1.5rem) to mimic the rounded corners of vintage photographs.

### Input Fields
- **Styling:** Use `surface_container_highest` for the field background. Instead of a full border, use a 2px bottom-border in `outline` (#857373) that transitions to `primary` on focus.
- **Typography:** Labels should use `label-md` in `secondary`.

### New Component: The "Heritage Timeline"
A vertical track using `outline_variant` at 20% opacity. Timeline nodes should be `secondary_fixed_dim` (#e9c176) circles, glowing slightly with a `secondary` tinted shadow.

### New Component: "The Artifact Slot"
A container for historical photos. Use `lg` rounding, a `surface-dim` inner glow to simulate a frame, and an `on_surface_variant` caption in `body-sm` italics.

## 6. Do’s and Don’ts

### Do:
- **Do** use asymmetrical padding (e.g., more padding at the top of a container than the bottom) to create an editorial feel.
- **Do** allow images to "break the grid" by overlapping container edges slightly.
- **Do** use `notoSerif` for short, punchy quotes or dates to add "history" to the page.

### Don't:
- **Don't** use pure black (#000000). Use `on_surface` (#1c1c16) for all dark text.
- **Don't** use standard "Material Design" blue for links. Use `secondary` (#775a19).
- **Don't** use sharp 90-degree corners. The minimum rounding should be `sm` (0.25rem) to keep the system "warm."
- **Don't** use heavy dividers. If you feel the need for a line, increase the whitespace instead.