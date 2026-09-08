---
name: Foundry
colors:
  ink: '#17140f'
  panel: '#1e1a13'
  panel-2: '#251f16'
  raised: '#2c2419'
  line: '#3a3122'
  line-soft: '#2a2419'
  text: '#ece3d2'
  text-dim: '#a89c85'
  text-faint: '#736853'
  copper: '#e0954a'
  copper-dim: '#7a5227'
  copper-glow: 'rgba(224,149,74,0.16)'
  good: '#8faa63'
  good-bg: 'rgba(143,170,99,0.12)'
  warn: '#d9a441'
  warn-bg: 'rgba(217,164,65,0.12)'
  bad: '#c15a3f'
  bad-bg: 'rgba(193,90,63,0.12)'
typography:
  display:
    fontFamily: Zilla Slab
    fontWeight: '600'
    usage: App name, drawer/panel titles only
    sizes: [19px, 17px]
  body-lg:
    fontFamily: Inter
    fontSize: 14.5px
    fontWeight: '600'
    usage: Mod names, primary row text
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 1.55
    usage: Descriptions, drawer copy, buttons
  body-sm:
    fontFamily: Inter
    fontSize: 12.5px
    fontWeight: '400'
    usage: Metadata - authors, stats, list header
  label:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    letterSpacing: 0.02em
    case: sentence
    usage: Section labels in sidebar and drawer (never all-caps)
  data:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: '400'
    usage: Version numbers, file sizes, paths only - not general UI text
spacing:
  unit: 2px
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 14px
  gutter-lg: 22px
  gutter-xl: 24px
  sidebar-width: 232px
  drawer-width: 340px
  topbar-height: 60px
  row-radius: 8px
  panel-radius: 7-10px
---

## Brand & Style

Foundry is a mod manager for Factorio players: people who will have this window open for ten minutes at a time, several times a week, deciding what to enable before a play session. The job of the UI is to make that decision fast and calm - not to perform "advanced software" at the user.

The style is **workshop, not HUD**: warm oiled-steel surfaces, a single copper accent, and restraint everywhere else. Concretely, that means:

- **One glow, not forty.** Only the thing the user is actively looking at (a selected row, an enabled toggle, the primary action) gets color. Idle rows are quiet by design.
- **Sentence case throughout.** No tracked-out all-caps labels, no bracketed `[ LIKE_THIS ]` affixes, no decorative telemetry strings. If a label reads like a system log, rewrite it as something a person would say.
- **Real information over invented instrumentation.** Never fabricate heap size, latency, checksum, or "signal" readouts to look technical. Every number on screen must answer a question the user actually has (how big is this download, is this mod on, what's missing).
- **Monospace is a data type, not a decoration.** Reserve `IBM Plex Mono` for version strings, file sizes, and file paths. Everything else - including labels, buttons, and status text - uses the sans body face.

If a screen feels like it needs a glowing border or a pulsing animation to be noticed, that's a sign the hierarchy is wrong, not a reason to add the glow.

## Colors

The palette reads as **oiled steel and copper** rather than a sci-fi terminal - warm dark neutrals with a single warm accent, closer to stamped industrial signage than a CRT display.

### Surfaces
- **Ink (`#17140f`):** App background. Warm near-black, never pure black or blue-black.
- **Panel (`#1e1a13`):** Hover state for list rows, resting state for the detail drawer content.
- **Panel-2 (`#251f16`):** Search field, pills, buttons at rest.
- **Raised (`#2c2419`):** Icon tiles, toggle track background - the highest surface, used sparingly.
- **Line / Line-soft (`#3a3122` / `#2a2419`):** All borders and hairline dividers. One border weight (1px) everywhere; no double borders or nested outlines.

### Text
- **Text (`#ece3d2`):** Primary content - names, headings, active labels. Warm paper white, not pure `#fff`.
- **Text-dim (`#a89c85`):** Secondary content - descriptions, metadata, inactive tab labels.
- **Text-faint (`#736853`):** Tertiary - placeholder text, disabled counts, chevrons.

### Accent & status
- **Copper (`#e0954a`):** The single interactive accent. Used for: the primary button, the active nav item, an enabled toggle, a selected tag, an "overhaul" badge. If more than ~10% of a screen is copper, pull it back.
- **Good (`#8faa63`) / Warn (`#d9a441`) / Bad (`#c15a3f`):** Muted, desaturated status hues - never neon. Each pairs with a low-opacity background tint (`*-bg` tokens) for badges and inline notices. These are the only other colors allowed on screen besides copper and neutrals.

Status color communicates one thing at a time: green = on/healthy, amber = needs attention but not broken, brick red = broken/missing. Don't reuse copper for "warning" - it's already the interactive accent and would blur the two meanings.

## Typography

Two families, each with one job:

- **Zilla Slab (display):** App name and panel/drawer titles only. A slab serif gives the industrial-signage feel without going full sci-fi mono. Used at most once or twice per screen.
- **Inter (everything else):** All UI text - mod names, descriptions, buttons, labels, metadata. Weight and size carry the hierarchy (600 for names, 400 for descriptions), not color or case.
- **IBM Plex Mono (data only):** Version numbers, file sizes, file paths, keyboard shortcuts. Never used for a label, a button, or a sentence.

Avoid: all-caps text anywhere (including small labels), letter-spacing used as a substitute for hierarchy, and mixing in a third typeface.

## Layout & Spacing

A conventional three-region shell, because a mod list is a browsing task, not a mission-control task:

```
+----------+--------------------------------------------+
|  brand   |  search --------------- updates | launch    |
+----------+--------------------------------------------+
| sidebar  |  tabs: Installed / Discover / Profiles      |
| (232px)  |  list header: counts + sort                 |
| categories|-------------------------------+ drawer     |
| tags     |  mod row                       | (340px,   |
| footer   |  mod row                       | opens on  |
|          |  mod row (selected)             | selection)|
+----------+--------------------------------------------+
```

- **Sidebar (232px, fixed):** Category filters and tag chips. Always visible on desktop; collapses away below 980px rather than shrinking.
- **List:** The default, full-width view. Rows, not cards - a mod list is inherently a list, and card chrome (shadows, borders per item) adds weight without adding information.
- **Drawer (340px):** Appears only when a mod is selected. Nothing about a single mod's dependencies, changelog, or details should permanently occupy screen space when no mod is selected - show an empty state instead of a half-populated panel.
- **Spacing scale:** 2px base unit, stepping 4 / 8 / 14 / 22px. Row padding is generous (14px vertical) so the list breathes at 32-40px effective row height - dense enough to scan 8-10 mods without scrolling, not so dense it feels like a spreadsheet.

### Responsive behavior
- **Desktop (980px+):** Full three-region layout as above.
- **Below 980px:** Sidebar and drawer both hide. The list becomes the entire screen; selecting a mod would push a full-screen detail view rather than a side panel (not yet built - implement as a slide-over if needed).

## Elevation & Depth

No drop shadows, no soft ambient blur. Depth comes from exactly two devices:

1. **Tonal steps.** `ink` → `panel` → `panel-2` → `raised`, each one step lighter. A row's hover state is one tonal step up from the list background; the selected state adds a 1px `line` border on top of that same tonal step. Nothing gets both a shadow and a glow.
2. **The copper glow, reserved for state.** `copper-glow` (a 16%-opacity copper wash) marks the *one* active thing per region: the active sidebar category, an enabled toggle's track, an "overhaul" badge. It is a state indicator, not a hover effect - hovering a row should never add glow, only a tonal shift.

Status notices (the dependency warning, badges) use a flat, low-opacity tint of their status color as background, with a matching 1px border at ~35% opacity - calm enough to read as "information," not "alarm."

## Shapes

Soft-industrial, not sharp-military: **7-10px corner radius** across buttons, panels, pills, and the drawer, with icon tiles slightly larger (8-10px) than small controls (5-7px). This is a deliberate departure from the sharp 90-degree / chamfered-corner language of terminal-HUD designs - Foundry should feel like a well-made physical tool (a toolbox, a control panel) rather than a weapons display.

No clip-path chamfers, no corner brackets, no decorative crosshairs. If a corner needs visual interest, that's a sign to add a real icon or label there instead.

## Components

### Buttons
- **Primary (`Launch Factorio`):** Solid copper fill, dark ink text for contrast, 7px radius, 600 weight. One per screen, reserved for the single most important action.
- **Secondary (`Updates`, `Disable`, tab-style actions):** `panel-2` fill, `line` border, primary text color. Hover only firms the border to `text-faint` - no color shift, no glow.
- **Destructive-adjacent actions** (fixing a broken dependency) use the `bad` status color as a solid fill, reserved strictly for that context - never as a general secondary button style.

### Toggle switches
34×20px track, `raised` fill when off with a `text-faint` knob; when on, track tints to `copper-glow` with a `copper-dim` border and the knob turns solid copper. This is the only place a color "flips" on interaction - deliberately, since enabling/disabling a mod is the core action of the whole app.

### List rows
Full-width rows, not cards: icon tile (42px, `raised` fill, 8px radius) + name/description column + right-aligned metadata (author, version, size) + toggle. A row in conflict gets a flat `bad-bg` background tint and an inline warning line with an icon - no border pulse, no animation. Selected state: `panel` background + `line` border, nothing more.

### Detail drawer
Opens only on selection. Structure, top to bottom: icon + title + author/version, one-paragraph description in plain language, two actions (a secondary "Disable" and a text "View changelog"), then stacked sections (`Dependency issue` if any, `Dependencies`, `Details`) each with an 11px sentence-case label. Key-value rows use `text-dim` for the key and `IBM Plex Mono` for the value - this is the one place mono text is expected, since every value here is a version, count, or size.

### Sidebar
Category rows are plain text + icon + trailing count, not boxed buttons. The active category is marked with `copper-glow` background and copper text - no border, no icon change beyond full opacity. Tag chips below are outlined, not filled, and only fill on hover.

### Empty & error states
Write in plain language, from the user's point of view: "Missing dependency - needs Alien Biomes HR Terrain," not "ERR_MOD_DEP_NOT_FOUND." Always pair a problem with the fix as a button in the same component, not a separate panel elsewhere on screen.
