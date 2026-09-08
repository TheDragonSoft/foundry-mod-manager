# UI Review: Foundry Mod Manager

Based on a visual review of the Foundry Mod Manager interface, here is a consolidated list of identified issues and proposed improvements, categorized by severity and type.

## 🔴 Critical Layout Bugs

### 1. Overlapping Text in Bottom-Left Corner
*   **Issue:** At the very bottom of the left sidebar (under the Filters section), there is overlapping and cut-off text that appears to say "Load order" and "verified". This looks like a broken CSS layout or an unfinished footer.
*   **Fix:** Wrap this content in a proper container with adequate padding. If it's a toggle or a status indicator, ensure it has enough vertical space and doesn't collide with the scrollable area above it.

## 🟡 UX (User Experience) Improvements

### 2. Missing Inline Toggle for Mods
*   **Issue:** While there are global "Enable all" and "Disable all" buttons, the individual mod row (e.g., "Bottleneck") lacks an obvious inline checkbox or toggle switch. Forcing a user to click a mod just to enable/disable it in the right-hand panel adds unnecessary friction.
*   **Fix:** Add a clear toggle switch or checkbox directly to the mod list item (usually on the far left next to the icon, or on the far right next to the version number).

### 3. Unwieldy Author Lists
*   **Issue:** The author list for the "Bottleneck" mod is extremely long. It stretches across the UI and pushes the version number (`0.12.1`) awkwardly to the far right edge. This makes the list hard to scan.
*   **Fix:** Truncate long author lists. Show the first 1-2 authors followed by `et al.` or an ellipsis (e.g., *by Troels Bjerre Lund, et al.*). The full list of authors can be displayed in the details panel on the right when the mod is selected.

### 4. Unclear Profile Status
*   **Issue:** In the top left, the profile selector says `Default 1/1 on`. It's slightly cryptic what "1/1 on" means without context (presumably 1 out of 1 mods enabled?).
*   **Fix:** Consider rewording this to be more human-readable, such as `Default (1 enabled)`, or simply show the profile name `Default` and rely on the "1 enabled" text already present in the main content area.

## 🔵 Accessibility & Visual Polish

### 5. Low Contrast Text
*   **Issue:** Several text elements are too dark against the dark background, making them difficult to read and failing accessibility standards:
    *   The `0` counts next to the inactive categories in the left sidebar.
    *   The text inside the unselected Filter tags (e.g., "logistics", "trains").
    *   The empty-state text in the right panel ("Select a mod from the list...").
*   **Fix:** Lighten the font color for these secondary/tertiary text elements to ensure a higher contrast ratio (e.g., switch from dark gray to a medium/light gray).

### 6. Cramped Filter Tags
*   **Issue:** The tags under the "Filters" section (space-age, planets, etc.) are packed very tightly together vertically.
*   **Fix:** Increase the vertical gap (margin or gap in CSS flexbox/grid) between the rows of tags by a few pixels to give them more breathing room and make them easier to click on touchscreens or with a mouse.

### 7. Visual Hierarchy of Mod Titles
*   **Issue:** The mod title ("Bottleneck") doesn't stand out quite enough from the description text below it.
*   **Fix:** Increase the font weight of the mod title (make it bolder) or slightly increase the font size so users can quickly scan down the list of mod names.
