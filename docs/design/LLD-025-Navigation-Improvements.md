# LLD-025: Navigation Improvements

## 1. Overview
Implement a screen-locked "Back" button on the workout page to facilitate returning to the home screen.

## 2. UI Design

### 2.1 Component Structure
- A fixed `button` (`#workout-back-btn`) positioned in a consistent, non-intrusive area (e.g., top-left or bottom-left corner).
- **Label**: "Back" or a back-arrow icon.

### 2.2 Styling (`css/style.css`)
```css
#workout-back-btn {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 1000;
  padding: 8px 15px;
  border-radius: 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}
```

## 3. Implementation Details

### 3.1 Functionality
- Clicking the button should execute `cancelActiveWorkoutBtn.click()` or directly call the navigation function that hides the workout screen and shows the home screen.

### 3.2 Visibility
- Show the button only when `activeWorkoutScreen` is visible.
- Hide the button on all other screens (Home, History list, Nutrition, Data Management).
