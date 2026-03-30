# LLD-018: Exercise Selection and Reordering

## 1. Overview
This design document describes the implementation of:
1.  **Exercise Selection from Dropdown**: In the program editor, when adding a new exercise, users can select from a dropdown of existing exercises from all days in the program.
2.  **Exercise Reordering via Drag-and-Drop**: Users can drag and drop exercises to reorder them in both the program editor and during an active workout session.

## 2. Architecture Design
-   **TemplateService**: Already contains `reorderExercises(dayId, exerciseIds)`.
-   **WorkoutEngine**: Needs a new method `reorderExercises(logId, exerciseIds)` to handle reordering during an active workout.
-   **UI Layer (app.js)**:
    -   Update `showExerciseEditor` to populate a datalist for exercise names.
    -   Integrate a drag-and-drop library (SortableJS via CDN) for reordering.

## 3. Data Model Changes
-   No schema changes. Existing `displayOrder` fields will be used.

## 4. API Design

### WorkoutEngine
-   `reorderExercises(logId, exerciseIds)`: Reorders exercises in a specific `WorkoutLog` and persists to IndexedDB.

## 5. UI Components

### Exercise Selection Dropdown
-   In `index.html`, add a `<datalist id="existing-exercises-list">` and link it to the `#ex-name` input.
-   In `app.js`, create a function `populateExerciseDatalist()` that gathers unique exercise names and details (body part, notes, targets) from the entire program.
-   When a user selects an exercise from the datalist, if it matches an existing exercise, pre-fill the other fields (body part, notes, targets).

### Exercise Reordering (Drag-and-Drop)
-   **Program Editor**:
    -   Each exercise card in a day will have a drag handle (or be draggable).
    -   Use SortableJS to enable reordering within the `#program-days-list`.
    -   On `end` event, call `templateService.reorderExercises`.
-   **Active Workout**:
    -   Each exercise card in the active workout will be draggable.
    -   On `end` event, call `workoutEngine.reorderExercises`.

## 6. Implementation Details

### Populating Datalist
```javascript
async function populateExerciseDatalist() {
    const program = await templateService.getProgram();
    const uniqueExercises = new Map();
    program.days.forEach(day => {
        day.exercises.forEach(ex => {
            if (!uniqueExercises.has(ex.name)) {
                uniqueExercises.set(ex.name, ex);
            }
        });
    });
    // Render <option> elements to datalist
}
```

### Auto-fill Logic
-   Add an `input` event listener to `#ex-name`.
-   If the entered value matches one of the unique exercises, offer to "Clone" its details.

### Drag and Drop
-   Include `<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>` in `index.html`.
-   Initialize Sortable on each exercise list container.

## 7. Testing Strategy
-   **Exercise Selection**: Verify that the dropdown shows all existing exercises and selecting one pre-fills details.
-   **Program Reordering**: Drag an exercise to a new position, refresh/reload, and verify the order is preserved.
-   **Active Workout Reordering**: Drag an exercise during a workout, ensure it stays in that position even after adding/removing sets or returning to the workout later.
