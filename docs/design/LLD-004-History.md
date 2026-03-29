# LLD-004 - History and Exercise Progress

## 1. Overview
**Reference:**
- Related Plan Item: PLAN-004
- Related Requirements: R6, R8

## 2. Architecture Design
### Component responsibilities
- **`HistoryUI`**: Browsing past workouts filtered by date/type.
- **`ProgressionService`**: Aggregates workout logs for specific exercise IDs over time.
- **`ProgressionUI`**: Displays historical performance (reps/weight) for a single exercise across all dates it was performed.
- **`LogEditorUI`**: Detailed view for a specific historical `WorkoutLog`, allowing editing of sets, reps, and exercises.

### Interaction diagrams
- **View Progress**: UI -> `ProgressionService.getHistory(exerciseId)` -> fetches all `WorkoutLog` items -> filter and sort -> UI.
- **Edit Log**: UI -> `WorkoutEngine.updateSet(logId, ...)` or `WorkoutEngine.addSet(logId, ...)` -> `PersistenceService.save('workoutLogs', updatedLog)`.
- **Delete Log**: UI -> `WorkoutEngine.deleteWorkoutLog(logId)` -> `PersistenceService.delete('workoutLogs', logId)`.

## 3. Data Model Changes
- No new tables required. This design relies on efficient indexing of existing `WorkoutLogs` in IndexedDB.

## 4. API Design (Internal Logic)
`ProgressionService`:
- `async getExerciseHistory(exerciseId)`: Returns a list of `(date, actuals)` tuples.
- `async filterLogs(criteria)`: Filters logs by body part or date range.

`WorkoutEngine` (Extended for History):
- `async deleteWorkoutLog(logId)`: Deletes a log from persistence.
- (Existing `updateSet`, `addSet`, `removeLastSet`, `addExtraExercise`, `removeExercise` work on any logId).

## 5. Internal Class Design
- **`HistoryList`**: Displays summary cards of past workouts with "Edit" and "Delete" options.
- **`LogDetailView`**: Reuses components from `ActiveWorkoutUI` to display and edit a historical log.

## 6. Concurrency & Consistency
- When editing historical logs, ensure the `updatedAt` field is refreshed.
- Deletion should be irreversible and prompted for confirmation.

## 7. Error Handling Strategy
- Handle cases where an exercise ID has changed.
- Graceful empty states if no history exists.
- Prevent editing of logs that don't exist.

## 8. Observability
- Logging of deletions and significant edits.

## 9. Security Considerations
- Confirmations for all destructive actions.

## 10. Testing Strategy
- **Unit test**: Test the grouping and sorting logic of the `ProgressionService`.
- **Integration test**: Create a log, edit a set, verify persistence, then delete it and verify removal.
- **Edge cases**: Deleting the most recent log; editing a log with deleted exercise templates.
