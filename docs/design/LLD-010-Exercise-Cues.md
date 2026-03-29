# LLD-010-Exercise-Cues

## 1. Overview
**Reference:**
- Related Plan Item: PLAN-010
- Related Requirements: R15

This LLD describes the implementation of exercise-specific training cues (notes/tips). These cues help users maintain proper form and are stored as part of the exercise template and the workout log snapshot.

## 2. Architecture Design
- **Data Integrity:** Cues are stored in the `ExerciseTemplate` (Program) and snapshotted into `LoggedExercise` (Workout Log).
- **Presentation:** Cues are displayed as a small, non-obtrusive text block within the exercise cards in both the Program view and the Active Workout view.
- **Editing:** The Exercise Editor (inline) will include a new text area for editing these cues.

## 3. Data Model Changes
- **ExerciseTemplate:** Add `notes` (string, optional).
- **LoggedExercise:** Add `targetSnapshot.notes` (string, optional).

## 4. UI Design
### Active Workout Screen
- Under the exercise name, display the cues text in a small, slightly dimmed font.
- Example: "Shoulder blades back and down; controlled descent..."

### Program Management Screen
- Display the cues in the exercise summary list.
- **Exercise Editor:** Add a label "Notes/Cues" and a `<textarea>` or `<input type="text">` for editing.

## 5. Implementation Details
### AppInitializer.js
- Update the default program data to include the `notes` field for all exercises with the provided content.

### js/app.js
- **renderActiveWorkout:** Update to include `exercise.targetSnapshot.notes` if present.
- **renderProgram:** Update the exercise display list to show `exercise.notes`.
- **openExerciseEditor:** Populate the new "Notes/Cues" field in the editor.
- **saveExercise:** Collect the value from the "Notes/Cues" field and save it to the template.

## 6. Testing Strategy
- Verify that default cues appear after a fresh install (seeding).
- Verify that cues can be edited and saved in the Program Editor.
- Verify that cues correctly snapshot into new workout logs.
- Verify that cues are visible during an active workout.
