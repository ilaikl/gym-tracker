# LLD-020: Exercise Drag Handle

## Overview
Currently, the entire exercise item in both the Program Editor and Active Workout views is draggable via SortableJS. This leads to accidental drag-and-drop actions when the user interacts with other elements inside the exercise item (buttons, inputs, etc.) or just tries to scroll. This LLD proposes adding a dedicated "drag handle" component to each exercise item and restricting the drag trigger to that handle.

## Proposed Changes

### 1. UI Enhancements (index.html & css/style.css)
- Define a CSS class `.drag-handle` for the new handle element.
- The handle will be a visual indicator (e.g., a "⠿" icon or a vertical bar) placed on the side of the exercise item.
- Styling:
    - `cursor: grab` (and `grabbing` when active).
    - Touch-friendly sizing (at least 24x24px).
    - Subtle visual appearance to avoid cluttering.

### 2. JavaScript Logic (js/app.js)
- **`renderProgram`**:
    - Inject a `<div class="drag-handle">⠿</div>` into each `dayElEx`.
    - Remove `cursor: grab` from the `exercise-item` container.
- **`renderActiveExercises`**:
    - Inject a `<div class="drag-handle">⠿</div>` into each `exEl`.
    - Remove `cursor: grab` from the `logged-exercise-card` container.
- **Sortable Initialization**:
    - Update both `Sortable` instances (program and active workout) to include the `handle: '.drag-handle'` option.

### 3. Data Model Impact
- No changes to the data model.

## User Experience
- Clicking or touching the exercise body will no longer trigger a drag.
- Users must explicitly grab the handle to reorder exercises.
- Provides a clear visual cue that exercises are reorderable.

## Alternatives Considered
- **Long Press to Drag**: Harder to discover and can conflict with native browser behaviors.
- **Side Bar**: Similar to a drag handle but might take up more horizontal space on mobile.
