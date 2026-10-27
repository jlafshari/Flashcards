# Manual Test: Unbury Button Opacity Fix

## Issue
The unbury button appeared washed out/disabled when displayed on buried cards because it inherited the 50% opacity from the parent `.card-item-buried` container.

## Fix Applied
Added `opacity: 1` to `.btn-unbury` class to explicitly override parent opacity.

## Test Steps

1. Open index.html in a browser
2. Go to "Manage Cards" tab
3. Add a test card (e.g., Bulgarian: "здравей", English: "hello")
4. Click "Bury" button on the card
5. Observe the result:
   - ✓ The card content should be dimmed (opacity 0.5) with strikethrough text
   - ✓ The "Unbury" button should be fully opaque and vibrant blue (#2196f3)
   - ✓ The "Unbury" button should NOT appear washed out or disabled
   - ✓ The button should look clearly interactive even without hovering

## Expected Visual Comparison

### Before Fix:
- Unbury button: Washed out blue (inherited 50% opacity from parent)
- Appeared disabled and less clickable

### After Fix:
- Unbury button: Vibrant blue (#2196f3) at full opacity
- Clearly interactive and clickable
- Same visual prominence as "Bury" button on non-buried cards

## CSS Implementation
```css
.btn-unbury {
    background: #2196f3;
    color: white;
    padding: 8px 16px;
    font-size: 0.9em;
    opacity: 1; /* Ensure button is fully opaque even inside buried card */
}
```

## Result
✓ The unbury button now appears fully interactive and not disabled, even when the parent card is dimmed.
