# Phase 2 Complete — Shell, Lists, Views, Overlays

## Agents Completed

### A2 (shell) ✅
- Titlebar.tsx — Custom h40 titlebar with window controls
- Topbar.tsx — h56 topbar with profile pill, search, actions
- TabBar.tsx — h40 tabbar with sliding accent underline
- Sidebar.tsx — w240 sidebar with categories + filters button
- AppLayout.tsx — Unified grid layout with 24px gutters

### A3 (lists) ✅
- ModRow.tsx — Shared row component (56px height, spec grid columns)
- DetailRail.tsx — Slide-in detail panel (w360, transition --t-med)
- InstalledView.tsx — Refactored to use new primitives
- DiscoverView.tsx — NEW: Refactored discover view with same patterns

### A4 (views) ✅
- ProfilesView.tsx — NEW: SectionHeader, active card, two-column form grid
- DependenciesView.tsx — NEW: Table-like card with load order index

### A5 (overlays) ✅
- SettingsModal.tsx — NEW: Rebuilt per spec §6.1 (w640, sections, sticky footer)
- FilterPopover.tsx — NEW: Searchable checkbox list (w280)
- OverflowMenu.tsx — NEW: Keyboard-navigable menu (w220)
- index.ts — Barrel exports

## Files Created

### New Directories
- `/workspace/src/views/discover/`
- `/workspace/src/views/profiles/`
- `/workspace/src/views/dependencies/`
- `/workspace/src/overlays/`

### New Files (Phase 2)
1. `src/views/discover/DiscoverView.tsx` (299 lines)
2. `src/views/profiles/ProfilesView.tsx` (285 lines)
3. `src/views/dependencies/DependenciesView.tsx` (218 lines)
4. `src/overlays/SettingsModal.tsx` (280 lines)
5. `src/overlays/FilterPopover.tsx` (139 lines)
6. `src/overlays/OverflowMenu.tsx` (121 lines)
7. `src/overlays/index.ts`
8. `src/primitives/SectionHeader.tsx` (37 lines)

### Modified Files
- `src/primitives/index.ts` — Added SectionHeader export

## Build Status
✅ **Build passes** — No TypeScript errors or warnings
```
dist/index.html                   0.82 kB │ gzip:   0.46 kB
dist/assets/index-DxRWPoe7.css   35.50 kB │ gzip:   8.00 kB
dist/assets/index-cDDSRdjQ.js   419.40 kB │ gzip: 126.44 kB
```

## Spec Compliance

### §3 Global Layout & Shell (A2)
- ✅ T1: Custom titlebar h40 (Electron frameless)
- ✅ T2: Topbar h56 with 3 zones (profile, search, actions)
- ✅ T3: TabBar h40 with sliding underline
- ✅ L1: Unified content container with 24px gutters
- ✅ L3: Sidebar w240 fixed, single scroll region
- ✅ L4: Removed Load order/Verified footer
- ✅ L6: Hover/selected clarity on rows
- ✅ C4: Primary button budget enforced
- ✅ C6: Row hover/selected states distinct

### §4 Lists & Detail Rail (A3)
- ✅ L2: Detail rail NOT rendered by default, slides in on selection
- ✅ L5: Row grid with exact column template
- ✅ C1: Switch replaces "✓ on" indicator
- ✅ C3: Columns align across all rows
- ✅ C5: EmptyState used appropriately
- ✅ C6: Selection doesn't trigger on Switch click

### §5 Profiles & Dependencies (A4)
- ✅ L1: Left-aligned forms (no centered narrow column)
- ✅ L5: Compact empty states
- ✅ C1: Badge usage for status
- ✅ C7: Inline status in header slot
- ✅ T3: Typography hierarchy (overline/title/description)

### §6 Overlays (A5)
- ✅ C2: Custom Select replaces native selects
- ✅ C8: IconButton with tooltip + aria-label
- ✅ Settings modal rebuilt per spec §6.1
  - Width 640, E2 elevation, r-lg radius
  - Sticky footer with Cancel/Save
  - Sections with overline headers (PATHS/DOWNLOADS/LAUNCH)
  - Input groups with fused Browse buttons
  - Custom Checkbox components

## Next Steps: Phase 3
**A6 (a11y-polish)** will perform:
1. Contrast audit against §1.2 tokens
2. Focus ring verification (§1.9)
3. Keyboard navigation audit (tablist, menu, modal trap)
4. Motion preferences (@media reduced-motion)
5. Scrollbar theming (§1.10)
6. Dead CSS cleanup

## Next Steps: Phase 4
**A7 (verify)** will run:
1. Parity checklist (§8) — all handlers preserved
2. axe-core accessibility scan
3. Screenshot capture (docs/ui-refactor/shots/)
4. Density verification (row heights, sidebar width, gutters)
5. Final REPORT.md with issue status table
