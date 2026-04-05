# LLD-021: Bug Fixes (History & Progress)

## 1. Overview
This phase addresses critical bugs in exercise progression tracking and workout history detail visualization.

## 2. Bug Fixes

### 2.1 Progress History Logic (`ProgressionService.js`)
- **Issue**: Exercise history included exercises even if no reps were recorded (actual reps were `null`).
- **Fix**: Filter `actualSets` to only include those where `actualReps` is non-null.
- **Implementation**:
  ```javascript
  const performedSets = exercise.actualSets.filter(s => s.actualReps !== null && s.actualReps !== undefined);
  ```

### 2.2 Workout History View Details (`js/app.js`)
- **Issue**: Viewing details from history was inconsistent and could interfere with active workout state.
- **Fix**:
  - `showActiveWorkout(log)` explicitly switches to `activeWorkoutScreen`.
  - Ensure `isEditingHistory` is correctly set to `true` when viewing historical logs.
  - Update cancellation logic to return to the history list if `isEditingHistory` is active.

## 3. Verification
- Verify `ProgressionService` correctly filters sets.
- Verify "View Details" in history displays the correct data and returns to history list on close.
