# LLD-030: Fix Drag-and-Drop Order Persistence in Active Workout

## 1. Overview
The SortableJS drag-and-drop in the active workout screen currently reorders elements visually but does not persist the new order to IndexedDB. This fix ensures the `onEnd` callback correctly calls `WorkoutEngine.reorderExercises` so the order is saved.

**Related Requirements:** R37
**Related Plan:** PLAN-030

---

## 2. Root Cause Analysis

In the Program Editor, SortableJS is initialised with an `onEnd` handler that calls `WorkoutEngine.reorderExercises(logId, orderedIds)`. In the Active Workout screen the same SortableJS instance is created but the `onEnd` callback either:
- Is missing, or
- Reads the wrong container / log ID, so `reorderExercises` is never called.

The fix is purely in `app.js` — no new methods are required.

---

## 3. Architecture Design

### Components Affected
- `app.js` — active workout SortableJS initialisation block
- `WorkoutEngine.reorderExercises` — already exists (PLAN-018), just needs to be wired

### Flow
1. Active workout screen renders exercise list inside `#active-exercise-list` (or equivalent container).
2. SortableJS is initialised on that container with `handle: '.drag-handle'`.
3. On `onEnd`: collect ordered `data-exercise-id` attributes → call `workoutEngine.reorderExercises(currentLogId, orderedIds)`.
4. `WorkoutEngine.reorderExercises` updates `displayOrder` on each `LoggedExercise` and persists the `WorkoutLog`.

---

## 4. API Design

No new methods. Existing API used:
```js
// WorkoutEngine (already implemented — PLAN-018)
async reorderExercises(logId, orderedExerciseIds)
```

---

## 5. Implementation Details

### 5.1 Corrected SortableJS Init (app.js)
```js
// Active Workout — exercise reorder
const activeListEl = document.getElementById('active-exercise-list');
if (activeListEl) {
  Sortable.create(activeListEl, {
    handle: '.drag-handle',
    animation: 150,
    onEnd: async () => {
      const orderedIds = [...activeListEl.querySelectorAll('[data-exercise-id]')]
        .map(el => el.dataset.exerciseId);
      await workoutEngine.reorderExercises(currentWorkoutLogId, orderedIds);
    }
  });
}
```

### 5.2 WorkoutEngine.reorderExercises (existing — no change needed)
Confirm the method updates `displayOrder` on every `LoggedExercise` in the log and saves via `PersistenceService.saveWorkoutLog`.

---

## 6. Testing Strategy
- Drag exercise 3 above exercise 1 in an active workout.
- Reload the page / navigate away and back.
- Verify exercises render in the new persisted order.
- Verify Program Editor drag order is unaffected.
