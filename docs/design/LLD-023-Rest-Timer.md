# LLD-023: Persistent Rest Timer

## 1. Overview
Add a floating, screen-locked rest timer during active workouts to allow users to track their recovery time between sets.

## 2. UI Design

### 2.1 Component Structure
- A fixed `div` (`#rest-timer`) in the bottom-right or top-right corner.
- **Display**: Large timer text (MM:SS).
- **Controls**:
  - `Start/Stop` button.
  - `Reset` button.
  - `Hide` (Minimizes to a small icon or hides completely).

### 2.2 Styling (`css/style.css`)
```css
#rest-timer {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  padding: 10px;
  border-radius: 10px;
  z-index: 1000;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}
```

## 3. Implementation Logic

### 3.1 State Management
- `timerInterval`: Reference to the `setInterval`.
- `secondsElapsed`: Total seconds since start.
- `isTimerRunning`: Boolean flag.

### 3.2 Methods
- `startTimer()`: Starts the `setInterval` (increments `secondsElapsed`).
- `stopTimer()`: Clears the `setInterval`.
- `resetTimer()`: Stops the timer and sets `secondsElapsed = 0`.
- `toggleVisibility()`: Toggles the display of the timer component.

## 4. Integration
- Show the timer only when the workout screen is active (`activeWorkoutScreen` is visible).
- Hide the timer when switching to other screens.
