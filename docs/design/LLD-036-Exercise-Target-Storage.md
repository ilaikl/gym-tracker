# LLD-036: Exercise Target Storage in IndexedDB

## 1. Overview
Persist `defaultWeight`, `targetSets`, and `targetReps` directly on each exercise record in the `exercises` IndexedDB store. When the user adds an exercise to a program day or active workout, these stored targets pre-fill the form automatically. Updating targets via the Program Editor or "Set as Target" also writes back to the exercise record.

**Related Requirements:** R50
**Related Plan:** PLAN-036

---

## 2. Data Model Changes

### exercises store — extended schema
```json
{
  "id": "uuid-or-slug",
  "name": "DB Chest Press",
  "muscle": "chest",
  "type": "strength",
  "notes": "Keep elbows at 45°...",
  "source": "manual | imported | seeded",
  "defaultWeight": 30,
  "targetSets": 3,
  "targetReps": 10,
  "createdAt": "ISO timestamp"
}
```
- `defaultWeight`, `targetSets`, `targetReps` are added to the schema (already defined in LLD-032 for new exercises).
- For existing exercises in the store these fields default to `0` / `3` / `10` if not present (handled defensively in read paths).

---

## 3. Architecture Design

### Components Affected
- `PersistenceService.js` — new `updateExerciseTargets(id, targets)` method
- `TemplateService.js` — call `updateExerciseTargets` when program exercise targets change
- `WorkoutEngine.js` — call `updateExerciseTargets` when "Set as Target" is invoked
- `app.js` — read exercise targets when auto-filling the add-exercise form in picker

### Write-back Triggers
| User Action | Calls |
|---|---|
| Edit exercise targets in Program Editor | `TemplateService.updateExercise(dayId, exId, data)` → also calls `PersistenceService.updateExerciseTargets` |
| "Set as Target" from active/history workout | `WorkoutEngine.promoteToTarget(...)` → also calls `PersistenceService.updateExerciseTargets` |
| Manual exercise creation (LLD-032) | `PersistenceService.saveExercise(exercise)` — targets included at creation |

---

## 4. API Design

### PersistenceService (new method)
```js
/**
 * Update only the target fields on an exercise record.
 * @param {string} exerciseId
 * @param {{ defaultWeight: number, targetSets: number, targetReps: number|number[] }} targets
 * @returns {Promise<void>}
 */
async updateExerciseTargets(exerciseId, targets) {
  const exercise = await this.getExercise(exerciseId);
  if (!exercise) return;  // exercise may not be in global store (legacy)
  Object.assign(exercise, {
    defaultWeight: targets.defaultWeight ?? exercise.defaultWeight,
    targetSets:    targets.targetSets    ?? exercise.targetSets,
    targetReps:    targets.targetReps    ?? exercise.targetReps,
  });
  await this.saveExercise(exercise);
}
```

### PersistenceService — existing method used
```js
async getExercise(exerciseId)   // retrieve single exercise by id
async saveExercise(exercise)    // upsert (defined in LLD-032)
```

---

## 5. Auto-fill on Exercise Picker Selection (app.js)

When the user selects an exercise from the categorised picker (LLD-032), pre-fill the form with stored targets:

```js
function onExerciseSelected(exercise) {
  document.getElementById('ex-name').value         = exercise.name;
  document.getElementById('ex-muscle').value       = exercise.muscle;
  document.getElementById('ex-notes').value        = exercise.notes ?? '';
  document.getElementById('ex-weight').value       = exercise.defaultWeight ?? 0;
  document.getElementById('ex-sets').value         = exercise.targetSets ?? 3;
  document.getElementById('ex-reps').value         = Array.isArray(exercise.targetReps)
    ? exercise.targetReps.join(',')
    : (exercise.targetReps ?? 10);
}
```

---

## 6. Write-back on Program Editor Save

In `TemplateService.updateExercise` (or the save handler in `app.js`), after saving the exercise to the program day, write targets back:

```js
// After saving to program template:
await persistenceService.updateExerciseTargets(exercise.exerciseId ?? exercise.id, {
  defaultWeight: exercise.targetWeight ?? exercise.defaultWeight,
  targetSets:    exercise.targetSets,
  targetReps:    exercise.targetReps,
});
```

---

## 7. Write-back on "Set as Target"

In `WorkoutEngine.promoteToTarget`, after updating the program template:

```js
await this.persistence.updateExerciseTargets(exerciseId, {
  defaultWeight: actualWeight,
  targetSets:    actualSets,
  targetReps:    actualReps,
});
```

---

## 8. Testing Strategy
- Set a custom weight/sets/reps for an exercise via the Program Editor; verify `exercises` store record is updated.
- Use "Set as Target" in an active workout; verify the exercise store record reflects the new values.
- Add the same exercise to a new program day via the picker; verify the form pre-fills with the saved targets.
- Verify exercises without stored targets still work (defaults applied defensively).
