# LLD-003 - Workout Logging and Snapshotting

## 1. Overview
**Reference:**
- Related Plan Item: PLAN-003
- Related Requirements: R2, R3, R4, R7

## 2. Architecture Design
### Component responsibilities
- **`WorkoutEngine`**: Orchestrates the creation of a `WorkoutLog` from a `ProgramDay`. Performs the deep clone (snapshot) of the template data.
- **`WorkoutLoggerUI`**: The interface for tracking a live workout. Optimized for mobile, minimal-click entry.

### Interaction diagrams
- **Start Workout**: UI -> `WorkoutEngine.createLog(dayTemplate)` -> `PersistenceService.save('workoutLogs', log)` -> UI redirect.
- **Update Set**: UI -> `WorkoutEngine.updateSet(logId, exerciseId, setIndex, actuals)` -> `PersistenceService.save(...)`.

## 3. Data Model Changes
### Workout Log (`WorkoutLog`)
```json
{
  "id": "workout_YYYY_MM_DD_day_ID",
  "date": "YYYY-MM-DD",
  "dayTemplateId": "String",
  "exercises": ["LoggedExercise[]"],
  "status": "draft/completed",
  "startedAt": "ISO String",
  "endedAt": "ISO String"
}
```

### Logged Exercise (`LoggedExercise`)
Contains a `targetSnapshot` field, which is a deep clone of the `ExerciseTemplate` properties as they were at the time of creation. This is critical for immutability of historical data.

### Logged Set (`LoggedSet`)
```json
{
  "setNumber": "Number",
  "targetReps": "Number",
  "actualReps": "Number",
  "targetWeight": "Number",
  "actualWeight": "Number",
  "isCompleted": "Boolean",
  "notes": "String"
}
```

## 4. API Design (Internal Logic)
`WorkoutEngine`:
- `createLogFromTemplate(dayTemplate)`: Snapshots a program day.
- `updateActuals(logId, exerciseId, setIndex, reps, weight)`: Updates a specific set.
- `addSetToExercise(logId, exerciseId)`: Adds a new set row to an exercise.
- `removeSetFromExercise(logId, exerciseId, setIndex)`: Removes a set row.
- `addExerciseToWorkout(logId, exerciseTemplate)`: Adds a new exercise to the current workout log.
- `removeExerciseFromWorkout(logId, exerciseId)`: Removes an exercise from the log.
- `completeWorkout(logId)`: Sets status and end timestamp.

## 5. Internal Class Design
- **`SetInputComponent`**: A highly reactive input for entering reps and weight.
- **`ExerciseLogCard`**: Displays the target values alongside the input fields. Includes controls for adding/removing sets.
- **`ExerciseSearchModal`**: Modal for selecting an existing exercise template to add to the workout.
- **`ManualExerciseForm`**: Form for adding a custom exercise manually.

## 6. Concurrency & Consistency
- **Snapshot Immutability**: The `targetSnapshot` is never updated once the log is created, ensuring history is preserved.
- **Auto-Save**: Any input change triggers an async save to IndexedDB.

## 7. Error Handling Strategy
- Prevent finishing a workout with invalid data (e.g., negative reps).
- Save draft state if the app is closed/crashed.

## 8. Observability
- Logging of workout start/end times.

## 9. Security Considerations
- Client-side validation of inputs.

## 10. Testing Strategy
- **Unit test**: Verify deep clone logic (modifying template after log creation shouldn't change the log).
- **Integration test**: Start workout -> enter reps -> reload -> verify state is recovered.
- **Edge cases**: Adding an "extra" exercise to a log that wasn't in the template.
