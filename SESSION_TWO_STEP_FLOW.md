# Study Session Flow Documentation

## Overview
The study session uses a simple one-step flow where options are visible upfront and the user clicks once to start studying.

## User Flow

### Step 1: Initial State (Before Session)
When the user first opens the Study tab (with cards available):
- **Visible**: 
  - Stats (Total Cards, Reviewed Today)
  - Study options (categories + direction selector)
  - "Start Study Session" button
- **Hidden**: 
  - Flashcard and controls

Users can:
- Select which categories to include (if multiple categories exist)
- Choose study direction (Bulgarian → English or English → Bulgarian)
- Click "Start Study Session" when ready

### Step 2: Active Session State
When the user clicks "Start Study Session":
- **Visible**: 
  - Stats
  - Flashcard with front/back content
  - Navigation controls (Previous, Flip, Next)
  - Feedback buttons (Easy ✓, Review Again ↻) - shown after flipping
  - "End Session" button
- **Hidden**: 
  - Study options (locked during session)
  - "Start Study Session" button

### Step 3: End Session
When the user clicks "End Session" or completes all cards:
- Returns to Step 1 (Initial State)
- Options become visible again
- User can reconfigure and start a new session

## Technical Implementation

### State Property
```javascript
this.inSession = false;  // Tracks if session is active
```

### State Transitions

#### startSession() Method
```javascript
startSession() {
    // Start actual session with selected options
    const filteredCards = this.getFilteredCards();
    if (filteredCards.length === 0) {
        alert('No cards match the selected categories...');
        return;
    }
    
    this.inSession = true;
    this.sessionCards = filteredCards;
    // ... initialize session
}
```

#### endSession() Method
```javascript
endSession() {
    this.inSession = false;  // Exit session
    // ... clear session data
}
```

### UI Update Logic

The `updateStudyTab()` method handles two states:

1. **Initial State** (`!inSession`):
   - Show study options
   - Show start button
   - Hide flashcard and controls

2. **Active Session** (`inSession`):
   - Show flashcard and controls
   - Hide options and start button
   - Show end session button

## Edge Cases Handled

### No Cards Available
- Only shows "No flashcards yet!" message
- All buttons and options hidden

### No Cards Match Selected Categories
- Shows alert: "No cards match the selected categories. Please select at least one category with cards."
- Remains in initial state (doesn't start session)
- User can adjust category selection and try again

### Direction and Category Changes
- Allowed before session starts (initial state)
- Blocked during Active Session state
- Allowed again after session ends

## Benefits of This Flow

1. **Immediate Access**: Users see their options right away
2. **Single Click**: One click to start studying after choosing options
3. **Transparency**: All configuration is visible upfront
4. **Simple**: Only two states to manage (before session / during session)

## Change History

### December 2024 (Latest)
- Simplified from two-step to one-step flow
- Options now visible from the start
- Single click starts session immediately

### October 2026
- Implemented two-step flow with `showingOptions` state
- Required two clicks: one to show options, one to start

### Previous
- Options were always visible
- Single click to start (like current implementation)
