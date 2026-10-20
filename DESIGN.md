---
name: "World TV — Orbita"
description: "An interactive television atlas in midnight blue, powder blue and apricot."
colors:
  surface: "#111c30"
  panel: "#1c2c43"
  text: "#f2ede5"
  muted: "#abbbd0"
  line: "#445a74"
  land: "#59799a"
  selected: "#ffa879"
  accent: "#ffa879"
  accent-hover: "#ffba94"
  ocean: "#192f49"
  on-ivory-muted: "#586171"
  grid: "#304a67"
  land-line: "#1a3049"
  neighbor: "#20334b"
  neighbor-line: "#364c66"
  other-region: "#2c435e"
typography:
  display:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "clamp(46px, 4.72vw, 68px)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  display-mobile:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "44px"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "28px"
    fontWeight: 500
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  metadata:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  caption:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  square: "0"
  control: "3px"
  circle: "50%"
spacing:
  gap-small: "8px"
  gap: "12px"
  inset-small: "16px"
  inset: "20px"
  section: "24px"
  sidebar-inset: "28px"
  section-large: "32px"
  desktop-gutter: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.surface}"
  button-on-ivory:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "10px 12px"
  button-icon:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    width: "44px"
    height: "44px"
  button-text:
    textColor: "{colors.muted}"
    typography: "{typography.metadata}"
  search:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.square}"
    padding: "0 14px"
  navigation:
    textColor: "{colors.muted}"
  tabs:
    textColor: "{colors.muted}"
  channel-row:
    textColor: "{colors.text}"
    padding: "16px 4px"
  channel-poster:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.square}"
    padding: "20px"
  mobile-summary:
    backgroundColor: "{colors.text}"
    textColor: "{colors.surface}"
    rounded: "{rounded.square}"
    padding: "20px"
---

# Design System: World TV — Orbita

## Overview

**Creative North Star: "Orbita"**

Orbita treats television discovery as an atlas to explore. Midnight blue surrounds powder-blue geography; apricot markers and primary actions guide exploration, while ivory type and occasional light panels establish the reading order. Large, regular-weight headings give the map space, while restrained lists make choosing a channel straightforward.

The visual character comes from the globe, real boundaries, compact controls and a single type family. Photography identifies places; it does not imply that a channel is playing. The approved direction is recorded from the implemented interface, with source authority in `src/components/orbita/Orbita.module.scss`, `src/app/globals.scss` and `src/app/layout.tsx`. The diagnostic `/lab` surface has been removed.

**Key Characteristics:**

- Midnight-blue canvas with powder-blue cartography, apricot actions and ivory foregrounds.
- Archivo across expressive headings and compact operating controls.
- Flat, mostly square surfaces separated by tone and fine rules.
- Spacious geography alongside dense, readable channel lists.
- Explicit hover, keyboard focus and selected states.

## Colors

The palette combines cool blue geography with warm apricot actions and ivory text. The user selected this direction from the Figma alternative “Blu notte e albicocca”; it supersedes the earlier green palette.

### Primary

- **Apricot** (`accent`, `selected`): primary actions, marker centers, highlighted geography, keyboard focus and loading indication.
- **Light apricot** (`accent-hover`): primary-button hover on dark and light surfaces.
- **Powder blue** (`land`): geographic land; the selected region also uses it in the close regional view.
- **Ocean blue** (`ocean`): the globe's water field.

### Neutral

- **Midnight blue** (`surface`): application background, dark text on apricot and ivory, and map label backing.
- **Raised blue** (`panel`): controls, search field, channel initials, row hover and the regional play surface.
- **Warm ivory** (`text`): primary text, marker outlines and inverted mobile surfaces.
- **Blue gray** (`muted`): supporting copy, secondary controls and location metadata on dark surfaces.
- **Divider blue** (`line`): borders, separators and icon-button hover.
- **Slate** (`on-ivory-muted`, CSS `--on-light-muted`): supporting text inside ivory mobile panels.
- **Context blue** (`neighbor`, `neighbor-line`, `other-region`): subdued geography around the active country or region.
- **Map structure** (`grid`, `land-line`): graticule and country boundaries.

**The Geographic Emphasis Rule.** Use blue tones to distinguish geographic context and apricot for selection and direct actions; preserve ivory for readable labels and marker outlines.

## Typography

**Display Font:** Archivo, with Arial and sans-serif fallbacks.

**Body Font:** Archivo, with the same fallbacks.

The four locally hosted WOFF2 weights are regular, medium, semibold and bold (400/500/600/700). The application uses the `--font-archivo` variable supplied by `next/font/local`. Regular display text and medium channel names create hierarchy without introducing another type family. The font is loaded with `display: swap`.

### Hierarchy

- **Display:** the `display` token governs the desktop world heading; `display-mobile` governs its mobile counterpart. Country and region headings use a related fluid size (`clamp(40px, 4.45vw, 64px)`) and become smaller on mobile (38px).
- **Headline:** sidebar headings use `headline`; player headings use the same size and weight with slightly looser tracking (-0.025em).
- **Title:** `title` is the featured channel name. Empty-state headings use the same size with regular weight and compact leading (1.1).
- **Body:** `body` is explanatory and empty-state copy. The desktop map introduction is larger (17px, line-height 1.5).
- **Metadata:** `metadata` supports channel, source and player context.
- **Label:** `label` is the primary action and desktop channel-name treatment.
- **Caption:** `caption` supports compact channel metadata. Mobile channel names and metadata increase to 16px and 12px respectively.

**The One Family Rule.** Use Archivo for both discovery and operation; change scale, weight and spacing to establish hierarchy.

## Layout

The desktop application occupies the dynamic viewport height, with a minimum height (640px). Its header is shallow (77px); content below uses a flexible geographic stage and a fixed companion column (368px), separated by a one-pixel rule. The main gutters use `desktop-gutter`; the companion column uses `sidebar-inset`. Content is padded above and below (34px and 24px), and the companion column scrolls independently.

At intermediate widths (761–1150px), outer gutters reduce to `section`, the companion column becomes narrower (330px) and its inset becomes `inset`. The world heading is fixed at 48px. These are layout adaptations, not a separate visual theme.

At mobile widths (760px and below), the interface becomes a single stage with a header (80px), bottom navigation (76px plus the safe-area inset) and `inset` gutters. Lists and the player replace the map in the available workspace. The app minimum height becomes 600px. The map's projection additionally adapts to its measured container width (below 650px); this is separate from the viewport breakpoint.

Spacing is a practical set of recurring gaps and insets, not a strictly enforced mathematical scale. Use `gap-small` for compact icon relationships, `gap` for ordinary rows, `section` for component separation and `section-large` for larger reading pauses. Keep channel rows compact on desktop and roomier on touch screens (minimum height 76px).

## Elevation & Depth

The interface uses no box shadows. Depth comes from the contrast between the canvas, panels and inverted ivory surfaces, plus thin separators. The globe gains its form from projection, contours and its graticule. The player overlays the companion column using the same surface color; it does not introduce a floating-card material.

**The Flat Surface Rule.** Separate regions with tone and rules, preserving the restrained material language of the map and controls.

## Shapes

Primary buttons, text fields, media surfaces, channel initials and summary panels have square corners. Small icon controls alone have a slight corner softening (`control`). Circles are reserved for geographic markers, status dots, the globe and the play control inside a regional poster.

Media and regional play surfaces use a widescreen proportion (16:9). Map boundaries retain their geographic silhouettes. Icons are inline stroked SVG, typically 20px with a 1.7px stroke, rounded caps and joins; arrows inside channel rows reduce to 16px. Favorites fill the existing heart icon when selected.

## Components

### Buttons

Primary actions are compact apricot rectangles with midnight-blue text, centered content and a trailing icon. Use the `button-primary` padding and a minimum height (48px). Their hover becomes light apricot. Inside an ivory mobile preview, the action keeps the same colors, uses `button-on-ivory` padding and a smaller minimum height (44px). The mobile random-discovery action is secondary: blue panel, ivory text and divider-blue hover.

Icon controls use `button-icon` and change to divider blue on hover. Text buttons remain unboxed, use muted text and brighten on hover. Buttons transition background and text color over 160ms. Disabled buttons have reduced opacity (0.45) and a default cursor.

Keyboard focus uses a solid apricot outline (2px) with an offset (4px). Buttons on ivory use a dark outline; map controls use ivory for contrast against the land. Inputs use the apricot ring with no offset. SVG regions and pins express focus with a stronger ivory stroke.

### Cards / Containers

Containers stay flat and square. The sidebar uses a fine left divider and no separate card background. A mobile summary uses ivory, dark text and `inset` padding. The world mobile preview uses a slightly tighter inset (`inset-small`), a place thumbnail and an apricot action.

The regional channel poster is a full-width button with a panel background, widescreen proportions, `inset` padding, regular-weight channel title and circular ivory play control. Its hover uses divider blue. It is a launch surface, not a fake video frame.

### Inputs / Fields

Search is an unbordered panel-colored field with a leading search icon, horizontal padding (14px), and a minimum height (48px). Placeholder text uses blue gray; the caret uses apricot. Desktop input text is 14px and becomes 16px on mobile.

Source selection uses a square native select, panel background and a thin divider-colored border. Its minimum height matches search; mobile text also becomes 16px. Do not invent an error-input pattern: the current interface communicates failures in the surrounding content.

### Navigation

Desktop navigation uses spaced text buttons (14px) with muted defaults and ivory active/hover states. Mobile navigation sits at the bottom, combines icons and small labels (11px), and preserves the same color hierarchy. Breadcrumbs show geographic depth; current locations are ivory.

Catalog tabs use text rather than pills. Their active state is ivory with a one-pixel underline; the containing row has a divider beneath it. Tab gaps reduce from 24px to 18px at intermediate widths.

### Channel Rows

A row combines a square initials block (44px), a flexible name/location column and an arrow. Fine dividers separate rows, while panel fill indicates hover or selection. The favorite control is a distinct adjacent button. Long names wrap; the text column can shrink without hiding the action.

Desktop rows use `channel-row` padding and `gap`. Mobile rows use larger name and metadata text, a wider gap (14px) and larger favorite targets (44px).

### Map and Place Imagery

The map is projected from actual geographic data. Ocean, land, selection, boundaries, graticule and label backings have separate jobs. Local views retain neighboring countries in context blue using the active projection, without changing the fit bounds or making those countries interactive. Local pins use a dark 24px disc with a 2px ivory outline and 12px apricot center, within a 44px hit area. Region and city labels remain supported by dark strokes or backings.

The globe can rotate; local views can pan and zoom. Map arrival scales gently from 0.96 to 1 and fades from 0.7 to 1 over 650ms with `cubic-bezier(.16, 1, .3, 1)`. Region fill transitions over 150ms. Reduced-motion preferences disable animations and transitions.

Place photography is cropped with `object-fit: cover` and explicitly captioned. It supplies geographic context. Channel availability, counts and playback states come from real data and user actions.

## Do's and Don'ts

### Do:

- **Do** use Archivo and the existing blue/apricot/ivory roles across new controls and surfaces.
- **Do** use flat tonal fields, fine dividers and mostly square geometry.
- **Do** preserve visible keyboard focus and readable states on both dark and ivory backgrounds.
- **Do** keep long channel names readable and touch layouts spacious enough for their actions.
- **Do** describe place photography as a place and display real geographic and playback information.
- **Do** respect reduced-motion preferences.

### Don't:

- **Don't** add decorative eyebrows above headings; begin with the meaningful title or geographic breadcrumb.
- **Don't** turn the map and channel lists into a collection of rounded, shadowed cards.
- **Don't** use a text glyph in place of the existing stroked SVG icon language.
- **Don't** present a place photograph or idle launch surface as a playing broadcast.
- **Don't** promote unused declarations or isolated status colors into new brand accents.
