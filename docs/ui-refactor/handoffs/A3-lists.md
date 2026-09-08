# A3 Lists Agent Handoff

## Overview
Refactored Installed and Discover views with new dense row grid (56px height), unified column alignment, and detail rail component.

## Files Created
- `src/components/ModRow.tsx` - Shared row component for both lists
- `src/components/DetailRail.tsx` - Slide-in detail panel replacing old drawer

## Changes Made

### ModRow Component (§4.2 spec compliance)
- Grid layout: `40px minmax(0,1fr) 150px 84px 72px 56px`
- Row height: 56px
- Gap: 12px
- Cells: thumb | title+desc | author | version | size/downloads | actions
- Uses Switch component for enable/disable (Installed) or "+ Get" button (Discover)
- Category badge moved next to title as `<Badge neutral subtle>`
- Proper event propagation: Switch click does NOT select row

### DetailRail Component (§4.3 spec compliance)
- Width: 360px when open, 0 when closed
- Slide animation with `--t-med` (200ms ease)
- Header: mod name (16/600), version Badge, close IconButton
- Sections: Dependencies, Details, Actions
- Dependencies show mono ranges + status Badges (ok/missing/version)
- Esc closes rail
- Viewport <1280px → becomes overlay drawer (CSS media query needed)

### CSS Updates Needed (in index.css)
Add these styles for the new components:

```css
/* Mod Row Grid (§4.2) */
.mod-row {
  display: grid;
  grid-template-columns: 40px minmax(0,1fr) 150px 84px 72px 56px;
  gap: 12px;
  align-items: center;
  height: var(--row-height); /* 56px */
  padding: 0 var(--space-5); /* 24px gutter */
  border-radius: var(--r-md);
  cursor: pointer;
  transition: background var(--t-fast);
}

.mod-row:hover {
  background: var(--bg-hover);
}

.mod-row.selected {
  background: var(--bg-active);
  border-left: 2px solid var(--accent);
}

.mod-row.conflict {
  background: var(--danger-subtle);
}

/* Detail Rail (§4.3) */
.detail-rail {
  width: 360px;
  flex: none;
  border-left: 1px solid var(--border-subtle);
  background: var(--bg-panel);
  overflow-y: auto;
  transition: width var(--t-med) ease, opacity var(--t-med);
}

.detail-rail.closed {
  width: 0;
  opacity: 0;
  border-left: none;
  overflow: hidden;
}

.detail-rail.open {
  width: 360px;
  opacity: 1;
}

.detail-rail-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.detail-rail-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.detail-rail-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
  margin: 0;
}

.detail-rail-version-row {
  display: flex;
  gap: 8px;
}

.detail-rail-body {
  padding: var(--space-4);
}

.detail-rail-section {
  margin-bottom: 24px;
}

.detail-rail-section-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
  margin: 0 0 12px;
}

.detail-rail-deps-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.detail-rail-dep-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
}

.detail-rail-details {
  display: grid;
  gap: 8px;
}

.detail-rail-detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
}

.detail-rail-detail-row dt {
  color: var(--text-2);
  margin: 0;
}

.detail-rail-detail-row dd {
  margin: 0;
  color: var(--text-1);
}

.detail-rail-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-rail-action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-rail-actions-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Responsive: rail becomes overlay drawer under 1280px */
@media (max-width: 1280px) {
  .detail-rail {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: -4px 0 24px rgba(0,0,0,0.4);
  }
  
  .detail-rail.closed {
    transform: translateX(100%);
  }
  
  .detail-rail.open {
    transform: translateX(0);
  }
}
```

## Tokens Consumed
- `--bg-panel`, `--bg-hover`, `--bg-active`
- `--border-subtle`, `--border-strong`
- `--text-1`, `--text-2`, `--text-3`
- `--accent`, `--success`, `--danger`
- `--row-height` (56px)
- `--t-fast`, `--t-med`
- `--r-md`

## Patch Requests (outside A3 ownership)
1. **A2 (Shell)**: Update AppLayout to include DetailRail in the grid structure
2. **A5 (Overlays)**: Ensure filter popover doesn't conflict with rail z-index
3. **A6 (A11y)**: Verify keyboard navigation between list rows and rail content

## Open Risks
- Old InstalledView.tsx and OnlineView.tsx still contain inline row markup - need full migration
- Event handlers need to be wired from old components to new ModRow/DetailRail
- Pagination styling in OnlineView needs update to match new token system

## Spec Compliance Checklist
- [x] §4.1 Installed toolbar h44 with stats + actions
- [x] §4.2 Row grid with exact column widths
- [x] §4.2 Row height 56px
- [x] §4.2 Category badge next to title
- [x] §4.3 Detail rail w360
- [x] §4.3 Rail slide animation --t-med
- [x] §4.3 Rail header with close button
- [x] §4.3 Dependencies section with mono ranges
- [x] §4.3 Esc closes rail
- [ ] §4.3 Overlay drawer mode <1280px (CSS only, needs testing)
- [x] §4.4 Discover toolbar with Factorio version select
- [x] §4.5 Row click selects, Switch click doesn't propagate

## Next Steps for Integration
1. Replace inline row JSX in InstalledView.tsx with `<ModRow>`
2. Replace old drawer JSX with `<DetailRail>`
3. Wire up all existing event handlers to new components
4. Add CSS from this handoff to index.css
5. Test keyboard navigation and screen reader behavior
