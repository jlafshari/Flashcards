# Two-Step Session Flow Documentation

## Overview
The study session now uses a two-step flow to allow users to configure their session before starting.

## User Flow

### Step 1: Initial State
When the user first opens the Study tab (with cards available):
- **Visible**: 
  - Stats (Total Cards, Reviewed Today)
  - "Start Study Session" button
- **Hidden**: 
  - Study options (categories + direction selector)
  - Flashcard and controls

### Step 2: Configuration State (After First Click)
When the user clicks "Start Study Session" the first time:
- **Visible**: 
  - Stats
  - Study options (category checkboxes + direction selector)
  - "Start Study Session" button (still visible for second click)
- **Hidden**: 
  - Flashcard and controls

Users can now:
- Select which categories to include (if multiple categories exist)
- Choose study direction (Bulgarian → English or English → Bulgarian)

### Step 3: Active Session State (After Second Click)
When the user clicks "Start Study Session" the second time:
- **Visible**: 
  - Stats
  - Flashcard with front/back content
  - Navigation controls (Previous, Flip, Next)
  - Feedback buttons (Easy ✓, Review Again ↻) - shown after flipping
  - "End Session" button
- **Hidden**: 
  - Study options (locked during session)
  - "Start Study Session" button

### Step 4: End Session
When the user clicks "End Session" or completes all cards:
- Returns to Step 1 (Initial State)

## Technical Implementation

### New State Property
```javascript
this.showingOptions = false;  // Tracks if options are being shown
this.inSession = false;       // Tracks if session is active
```

### State Transitions

#### startSession() Method
```javascript
startSession() {
    if (!this.showingOptions) {
        // First click: show options
        this.showingOptions = true;
        this.updateUI();
    } else {
        // Second click: start actual session
        const filteredCards = this.getFilteredCards();
        if (filteredCards.length === 0) {
            alert('No cards match the selected categories...');
            return;
        }
        
        this.inSession = true;
        this.sessionCards = filteredCards;
        // ... initialize session
    }
}
```

#### endSession() Method
```javascript
endSession() {
    this.showingOptions = false;  // Reset configuration state
    this.inSession = false;       // Exit session
    // ... clear session data
}
```

### UI Update Logic

The `updateStudyTab()` method handles three states:

1. **Initial State** (`!showingOptions && !inSession`):
   - Show start button only
   - Hide everything else

2. **Configuration State** (`showingOptions && !inSession`):
   - Show study options
   - Show start button
   - Hide flashcard

3. **Active Session** (`inSession`):
   - Show flashcard and controls
   - Hide options and start button
   - Show end session button

## Edge Cases Handled

### No Cards Available
- Only shows "No flashcards yet!" message
- All buttons and options hidden

### No Cards Match Selected Categories
- Shows alert: "No cards match the selected categories. Please select at least one category with cards."
- Remains in configuration state (doesn't start session)
- User can adjust category selection

### Direction and Category Changes
- Allowed in Initial and Configuration states
- Blocked during Active Session state

## Benefits of Two-Step Flow

1. **User Control**: Users explicitly choose what to study before starting
2. **No Surprises**: Users see their options before committing to a session
3. **Flexibility**: Can review and adjust settings before starting
4. **Clear Intent**: Two distinct actions (configure vs. start) are separate

## Migration from Previous Flow

### Previous Behavior
- Options were visible immediately
- Click "Start Study Session" → immediately started session with current options

### New Behavior
- Options hidden until user clicks "Start Study Session"
- First click shows options
- Second click starts session

### Why the Change
Users expected to:
1. Press button to initiate the setup process
2. See and configure options
3. Press button again to start actual studying

The new flow matches this mental model better.
