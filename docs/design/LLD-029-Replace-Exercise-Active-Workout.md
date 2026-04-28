# LLD-029: Replace Exercise in Active Workout

## 1. Overview
Allow the user to swap an exercise in an active workout for a suggested replacement that targets the same primary muscle group. The existing set count, targets, and logged data are preserved on the replacement.

**Related Requirements:** R36
**Related Plan:** PLAN-029

---

## 2. Architecture Design

### Flow
1. User taps **Replace** on an exercise card in the active workout.
2. App reads the exercise's `muscle` value.
3. App queries the `exercises` IndexedDB store for all exercises with the same `muscle`, excluding the current one.
4. A modal displays the suggestions grouped/sorted by source (user library first, then imported).
5. User selects a replacement.
6. `WorkoutEngine.replaceExercise(logId, oldExerciseId, newExerciseTemplate)` is called.
7. The `LoggedExercise` record is updated in the `WorkoutLog` and persisted.
8. The active workout screen re-renders the updated exercise card.

### Components Affected
- `WorkoutEngine` — new `replaceExercise` method
- `PersistenceService` — `getExercisesByMuscle(muscle)` query
- `AppUI` / `app.js` — "Replace" button, suggestion modal render
- `css/style.css` — modal styling

---

## 3. Data Model

### LoggedExercise (existing, no schema change)
```json
{
  "id": "uuid",
  "exerciseId": "ex-id",
  "name": "DB Chest Press",
  "muscle": "chest",
  "notes": "...",
  "targetSets": 3,
  "targetReps": 10,
  "targetWeight": 30,
  "sets": [
    { "setNumber": 1, "targetReps": 10, "actualReps": null, "actualWeight": null }
  ]
}
```

When replaced, `exerciseId`, `name`, `muscle`, `notes` are overwritten with the new template values. `sets` array structure is **preserved** (set count, set numbers, existing `actualReps`/`actualWeight` remain intact).

---

## 4. API Design

### WorkoutEngine
```js
/**
 * Replaces an exercise in an active WorkoutLog.
 * Preserves existing sets (count + any logged values).
 * @param {string} logId
 * @param {string} oldExerciseId - LoggedExercise.id to replace
 * @param {object} newTemplate   - Exercise record from exercises store
 * @returns {Promise<void>}
 */
async replaceExercise(logId, oldExerciseId, newTemplate)
```

### PersistenceService
```js
/**
 * Returns all exercises matching the given muscle group.
 * @param {string} muscle
 * @returns {Promise<Exercise[]>}
 */
async getExercisesByMuscle(muscle)
```

---

## 5. UI Components

### 5.1 Replace Button
- Added to the exercise card action row in the active workout (`.horizontal-actions`).
- Label: **Replace** (icon: 🔄 or text only).

### 5.2 Replacement Suggestion Modal
```
┌─────────────────────────────────────┐
│  Replace: DB Chest Press            │
│  Same muscle: Chest                 │
│─────────────────────────────────────│
│  ★ Your Library                     │
│    • Machine Chest Press            │
│    • Incline DB Press               │
│─────────────────────────────────────│
│  📦 Exercise Database               │
│    • Barbell Bench Press            │
│    • Cable Fly                      │
│    • Pec Deck Machine               │
│─────────────────────────────────────│
│              [Cancel]               │
└─────────────────────────────────────┘
```
- "Your Library" = exercises already in any program day or previously used in logs.
- "Exercise Database" = remaining entries from the `exercises` store.
- Tapping a row confirms the replacement and closes the modal.

---

## 6. Implementation Details

### 6.1 WorkoutEngine.replaceExercise
```js
async replaceExercise(logId, oldExerciseId, newTemplate) {
  const log = await this.persistence.getWorkoutLog(logId);
  const idx = log.exercises.findIndex(e => e.id === oldExerciseId);
  if (idx === -1) throw new Error('Exercise not found in log');
  const old = log.exercises[idx];
  log.exercises[idx] = {
    ...old,                        // preserve sets, displayOrder, id
    exerciseId: newTemplate.id,
    name: newTemplate.name,
    muscle: newTemplate.muscle,
    notes: newTemplate.notes || newTemplate.safetyTips || '',
  };
  await this.persistence.saveWorkoutLog(log);
}
```

### 6.2 Suggestion Fetch (app.js)
```js
async function openReplaceModal(logId, loggedExercise) {
  const allSameMuscle = await persistenceService.getExercisesByMuscle(loggedExercise.muscle);
  const suggestions = allSameMuscle.filter(e => e.id !== loggedExercise.exerciseId);
  // Separate library vs database
  renderReplaceModal(logId, loggedExercise, suggestions);
}
```

---

## 7. Testing Strategy
- Verify that after replacement the set count and any already-logged `actualReps`/`actualWeight` are unchanged.
- Verify the exercise name, muscle, and notes update to the new template values.
- Verify the change is persisted and survives a page refresh.
- Verify the modal shows same-muscle exercises only.
- Verify "Your Library" section appears before "Exercise Database".
