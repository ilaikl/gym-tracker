# LLD-031: Fix Per-Set Rep Targets Display & Manual Exercise Defaults

## 1. Overview
Two related bugs:
1. **Per-set targets** — set rows in the active workout do not display each set's individual `targetReps` value; they either show nothing or a single global value.
2. **Manual exercise defaults** — when a new exercise is added manually during an active workout, `targetReps` is not populated on the generated `LoggedSet` objects, causing missing/broken target display.

**Related Requirements:** R38, R39
**Related Plan:** PLAN-031

---

## 2. Data Model

### LoggedSet (target field clarification)
```json
{
  "setNumber": 1,
  "targetReps": 12,
  "targetWeight": 30,
  "actualReps": null,
  "actualWeight": null,
  "completed": false
}
```
- `targetReps` on each `LoggedSet` is the authoritative per-set target for display.
- When an exercise has a single rep target (e.g., `targetReps: 10`), all sets share the same value.
- When an exercise has a descending or array-based target (e.g., `[12, 11, 10]`), each set uses `targetReps[setIndex]`.

### ExerciseTemplate / LoggedExercise
```json
{
  "targetReps": 10,          // number OR array [12,11,10]
  "targetSets": 3,
  "targetWeight": 30
}
```

---

## 3. Architecture Design

### Components Affected
- `WorkoutEngine` — `addExerciseToLog` set-generation logic
- `app.js` — active workout set row render template

---

## 4. Implementation Details

### 4.1 WorkoutEngine — Set Generation Fix
When generating sets for an exercise (both at snapshot time and when adding manually), `targetReps` per set must be resolved:

```js
function resolveTargetReps(exerciseTargetReps, setIndex) {
  if (Array.isArray(exerciseTargetReps)) {
    return exerciseTargetReps[setIndex] ?? exerciseTargetReps[exerciseTargetReps.length - 1];
  }
  return exerciseTargetReps ?? 0;
}

// Inside addExerciseToLog / snapshotExercise:
const sets = Array.from({ length: targetSets }, (_, i) => ({
  setNumber: i + 1,
  targetReps: resolveTargetReps(exercise.targetReps, i),
  targetWeight: exercise.targetWeight ?? exercise.defaultWeight ?? 0,
  actualReps: null,
  actualWeight: null,
  completed: false,
}));
```

### 4.2 Manual Exercise Defaults Fix
When the user adds a manual exercise during an active workout with no template:
```js
const DEFAULT_TARGET_REPS = 10;
const DEFAULT_TARGET_SETS = 3;
const DEFAULT_TARGET_WEIGHT = 0;

// Ensure the manually entered exercise has sensible defaults before set generation
const exerciseTemplate = {
  targetReps: parsedReps || DEFAULT_TARGET_REPS,
  targetSets: parsedSets || DEFAULT_TARGET_SETS,
  targetWeight: parsedWeight || DEFAULT_TARGET_WEIGHT,
  ...otherFields,
};
```

### 4.3 Set Row Render — Show Per-Set Target (app.js)
```js
// In the set row HTML template:
`<span class="set-target-label">× ${set.targetReps ?? '?'}</span>`
```
CSS for the label:
```css
.set-target-label {
  font-size: 0.75rem;
  color: var(--text-muted, #888);
  margin-left: 4px;
}
```

---

## 5. UI Wireframe

```
Set 1   ×12   [reps input]  [weight input]  [✓]
Set 2   ×11   [reps input]  [weight input]  [✓]
Set 3   ×10   [reps input]  [weight input]  [✓]
```
- `×12` is the `targetReps` label in muted text.
- Inputs remain for `actualReps` and `actualWeight`.

---

## 6. Testing Strategy
- Create a workout with a 3-set exercise using `targetReps: [12, 11, 10]`; verify each set row shows the correct individual target.
- Create a workout with a 3-set exercise using `targetReps: 10`; verify all rows show `×10`.
- Add a manual exercise mid-workout; verify sets are generated with `targetReps: 10` (default) and no JS errors.
- Verify that `actualReps` input is independent of the target label.
