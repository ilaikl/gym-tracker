# LLD-008: Advanced Exercise & Target Management

## 1. Overview
Reference:
- Related Plan Item: PLAN-008
- Related Requirements: R12, R13, R14

This LLD describes the design for:
1.  **Inline Exercise History**: Showing the last 3-5 performances of an exercise directly within the Program Editor or Workout screens.
2.  **Global Target Synchronization**: Updating target weight/sets/reps for all instances of an exercise across different program days.
3.  **Performance Promotion ("Set as Target")**: Updating the program template's targets based on the actual performance in a workout log.

## 2. Architecture Design
- **ProgressionService**: Enhanced to provide efficient "Recent History" retrieval.
- **TemplateService**: Enhanced to handle cross-day exercise synchronization.
- **WorkoutEngine**: Enhanced to bridge the gap between historical "Actuals" and template "Targets".
- **UI (app.js)**: New components for inline tables, sync toggles, and promotion buttons.

## 3. Data Model Changes
No structural changes to the database. The `exerciseId` is already used as the stable identifier for these operations.

## 4. API / Service Design

### 4.1 ProgressionService.getRecentHistory(exerciseId, limit = 5)
- **Input**: `exerciseId` (string), `limit` (number).
- **Logic**:
  1. Fetch all `workoutLogs`.
  2. Iterate and collect all `LoggedExercise` entries matching `templateExerciseId === exerciseId`.
  3. Sort by log date descending.
  4. Return the first $N$ entries.
- **Return**: `Array<{ date: string, weight: number, unit: string, reps: Array<number> }>`.

### 4.2 TemplateService.syncExerciseAcrossDays(exerciseId, updatedData)
- **Input**: `exerciseId` (string), `updatedData` (Object containing `targetSets`, `defaultWeight`, etc.).
- **Logic**:
  1. Fetch the entire `Program`.
  2. Iterate through all `days` and `exercises`.
  3. If `exercise.id === exerciseId`, update its fields with `updatedData`.
  4. Persist the updated `Program`.

### 4.3 WorkoutEngine.promoteToTarget(logExercise)
- **Input**: `logExercise` (The `LoggedExercise` object from a log).
- **Logic**:
  1. Extract `templateExerciseId`, `actualWeight`, and `actualSets` from `logExercise`.
  2. Format `actualSets` into the `targetSets` structure (remapping `actualReps` to `targetReps`).
  3. Call `TemplateService` to update the template for this exercise.
  4. Support optional "Apply to all days" logic by calling `syncExerciseAcrossDays`.

## 5. UI Components

### 5.1 Inline History Table
- Small, compact table rendered inside the exercise card.
- Columns: Date, Weight, Reps (e.g., "8, 8, 7").
- Shown when "Progress" is clicked (replacing navigation).

### 5.2 Exercise Editor Enhancements
- Checkbox: "Apply changes to all days where this exercise appears".
- If checked, the save operation calls `syncExerciseAcrossDays` instead of just updating the current day.

### 5.3 "Set as Target" Button
- Present on each exercise card in `ActiveWorkoutUI` and History Detail view.
- Trigger confirmation: "Update future targets for [Exercise Name] based on this performance?".
- Includes option to "Apply to all days".

## 6. Testing Strategy
- **Unit Tests**:
  - `ProgressionService.getRecentHistory` sorts and limits correctly.
  - `TemplateService.syncExerciseAcrossDays` updates multiple days correctly.
- **Edge Cases**:
  - Exercise with no history.
  - Promoting a performance with different number of sets than the current target.
  - Exercise with `repGoalType: "range"`.
