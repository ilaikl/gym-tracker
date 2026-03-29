# LLD-002 - Program Template Management

## 1. Overview
**Reference:**
- Related Plan Item: PLAN-002
- Related Requirements: R1

## 2. Architecture Design
### Component responsibilities
- **`ProgramEditor`**: A UI component that manages the user's weekly program.
- **`TemplateService`**: Provides logic for creating and updating program days and exercises.

### Interaction diagrams
- **Edit Exercise**: UI -> `TemplateService.updateExercise(exerciseId, newValues)` -> `PersistenceService.save('program', updatedProgram)`.

## 3. Data Model Changes
### Program Day (`ProgramDay`)
```json
{
  "id": "String (e.g., day_1_push)",
  "order": "Number",
  "name": "String",
  "type": "String (push/pull/rest/etc.)",
  "bodyParts": ["String"],
  "isRestDay": "Boolean",
  "exercises": ["ExerciseTemplate[]"]
}
```

### Exercise Template (`ExerciseTemplate`)
```json
{
  "id": "String (stable technical ID)",
  "name": "String",
  "bodyPartPrimary": "String",
  "bodyPartSecondary": ["String"],
  "category": "String (compound/isolation)",
  "equipment": "String",
  "defaultWeight": { "value": "Number", "unit": "String", "label": "String" },
  "targetSets": ["TargetSet[]"],
  "repGoalType": "String (fixed/range/range_open)",
  "notes": ["String"],
  "progressionRule": { "increaseWhen": "String", ... },
  "isOptional": "Boolean",
  "isActive": "Boolean",
  "displayOrder": "Number"
}
```

## 4. API Design (Internal UI Logic)
`TemplateService`:
- `addDay(program, dayData)`: Appends a new day.
- `addExercise(dayId, exerciseData)`: Appends exercise to a specific day.
- `updateExercise(dayId, exerciseId, newData)`: Updates existing exercise.
- `reorderExercises(dayId, newOrder)`: Updates `displayOrder`.

## 5. Internal Class Design
- **`ExerciseTemplateEditor`**: Handles the form logic for exercise-specific fields (sets, reps, weights).
- **`DayTemplateEditor`**: Manages the list of exercises within a day.

## 6. Concurrency & Consistency
- Ensure that updating a program day does not automatically affect `WorkoutLog` entries already created (this logic is handled by the snapshotting in LLD-003).

## 7. Error Handling Strategy
- Prevent saving exercises without a name or at least one set.
- Warn user before deleting a day template.

## 8. Observability
- Logging of program version updates.

## 9. Security Considerations
- Sanitize exercise names/notes to avoid XSS in the UI.

## 10. Testing Strategy
- **Unit test**: Verify CRUD operations on the `program` object.
- **Integration test**: Add an exercise and verify it persists in IndexedDB.
- **Edge cases**: Managing a rest day with zero exercises.
