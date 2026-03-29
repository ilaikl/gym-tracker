# Requirements Document

## 1. Introduction
### Application purpose
A local-first workout tracking app for Android (PWA) designed for quick data entry during training, based on a fixed weekly program.

### System scope
The system handles workout program management, daily workout logging, local persistence, and data portability via JSON.

### Key functionality
- Quick entry of actual reps and weight during workouts.
- Fixed weekly program template.
- Workout logging based on program templates (snapshotting).
- Historical tracking by date, body part, and exercise.
- Local storage (IndexedDB) and JSON import/export.

### Non-goals
- User authentication/cloud sync.
- Advanced charts/analytics.
- Mandatory RPE tracking.
- Rest timers.

## 2. Functional Requirements

### R1: Program Template Management
**User Story**
As a user, I want to define a fixed weekly workout program so that I don't have to rebuild my workout structure every time I train.

**Acceptance Criteria**
- WHEN the user opens the program editor
- THEN the system SHALL allow adding/editing/deleting workout days (e.g., Push, Pull).
- WHEN a workout day is edited
- THEN the system SHALL allow defining exercises, target sets, target reps (fixed or range), and target weight.
- WHEN an exercise is added to a day
- THEN the system SHALL allow specifying body parts, category, equipment, and notes/cues.

### R2: Workout Logging from Template
**User Story**
As a user, I want to start a workout based on a specific day in my program so that the structure is pre-filled.

**Acceptance Criteria**
- WHEN the user starts a new workout
- THEN the system SHALL prompt for a date and a program day template.
- WHEN the template is selected
- THEN the system SHALL create a `WorkoutLog` containing a snapshot of all exercises and target sets from the template.
- THEN the system SHALL pre-generate input fields for actual reps and weight for each set.

### R3: Quick Data Entry during Workout
**User Story**
As a user, I want to enter my actual performance (reps/weight) with minimal friction during my workout.

**Acceptance Criteria**
- WHEN a workout is active
- THEN the system SHALL display exercise notes and target values clearly.
- WHEN the user enters `actualReps`
- THEN the system SHALL automatically save the progress locally.
- WHEN the user finishes a set
- THEN the system SHALL allow marking the set as completed.

### R4: Workout Snapshotting (Immutability of History)
**User Story**
As a user, I want my past workouts to remain unchanged even if I update my program template later.

**Acceptance Criteria**
- WHEN a `WorkoutLog` is created
- THEN the system SHALL store a full snapshot of the target exercises/sets at that moment.
- WHEN the program template is modified
- THEN the system SHALL NOT affect existing `WorkoutLog` entries.

### R5: Data Portability (Backup/Restore)
**User Story**
As a user, I want to export and import my data as JSON so that I can backup my progress or move to another device.

**Acceptance Criteria**
- WHEN the user selects "Full Export"
- THEN the system SHALL generate a single JSON file containing the program, all workout logs, and settings.
- WHEN the user selects "Full Import" and provides a valid JSON file
- THEN the system SHALL replace the local data with the content of the file.
- WHEN the user selects "Export Program Only"
- THEN the system SHALL generate a JSON file containing only the program template.
- WHEN the user selects "Import Program"
- THEN the system SHALL replace only the current program with the imported one.
- WHEN the user selects "Export Workout History"
- THEN the system SHALL generate a JSON file containing all workout logs.
- WHEN the user selects "Import Workout History"
- THEN the system SHALL merge the imported logs with the current history, avoiding duplicates by ID.

### R9: Individual Workout Export/Import
**User Story**
As a user, I want to export and import a single workout log so that I can share or move individual sessions without transferring my entire history.

**Acceptance Criteria**
- WHEN the user views the details of a specific workout log (active or historical)
- THEN the system SHALL provide an "Export Workout" button.
- WHEN the user selects "Export Workout"
- THEN the system SHALL generate a JSON file containing only that specific `WorkoutLog` with correct metadata.
- WHEN the user imports a single `WorkoutLog` file
- THEN the system SHALL merge it into the history, avoiding duplicates by ID.

### R10: Historical Tracking and Review
**User Story**
As a user, I want to see my progress for a specific exercise over time.

**Acceptance Criteria**
- WHEN the user views an "Exercise-over-time" screen
- THEN the system SHALL display a list of all logged performances for that exercise ID across different dates.
- WHEN the user views the history screen
- THEN the system SHALL allow filtering by date, workout day, and body part.

### R7: Dynamic Workout Adjustment
**User Story**
As a user, I want to add/remove sets and exercises during my workout so that I can adapt my training in real-time.

**Acceptance Criteria**
- WHEN a workout is active
- THEN the system SHALL allow adding a new set to any exercise.
- THEN the system SHALL allow removing an existing set from any exercise.
- THEN the system SHALL allow adding a new exercise to the workout (from a list of existing templates or manually).
- THEN the system SHALL allow removing an exercise from the current workout.
- WHEN these changes are made
- THEN the system SHALL immediately persist them to the `WorkoutLog`.

### R8: History Management and Editing
**User Story**
As a user, I want to view full details of my past workouts, edit them, and delete them if needed, so that my history is accurate and manageable.

**Acceptance Criteria**
- WHEN the user views the history screen
- THEN the system SHALL allow clicking on a workout log to view its full details (all exercises, sets, reps, and weights).
- WHEN a historical workout log is being viewed
- THEN the system SHALL allow editing any `actualReps`, `actualWeight`, or notes.
- THEN the system SHALL allow adding or removing sets and exercises (similar to an active workout).
- WHEN changes are made to a historical log
- THEN the system SHALL immediately persist them to that `WorkoutLog`.
- WHEN the user views the history screen
- THEN the system SHALL allow deleting an entire workout log.
- WHEN a workout log is deleted
- THEN the system SHALL remove it permanently from the history.

### R11: Documentation and User Guidance
**User Story**
As a user, I want to have clear documentation and JSON examples so that I can understand how the app works and how to manage my data.

**Acceptance Criteria**
- WHEN the user opens the repository or documentation
- THEN the system SHALL provide a README file with an overview of the app.
- THEN the system SHALL include detailed JSON examples for all import types (Full, History, Program).
- THEN the system SHALL explain the "Template vs. Log" architecture.
- THEN the system SHALL provide instructions for local setup and deployment.

## 3. Non-Functional Requirements

### Performance
- UI must be responsive and "snappy" on mobile devices (Android).
- Data saving should be near-instant to avoid data loss.

### Scalability
- System should handle at least several years of workout logs (hundreds of logs) without significant lag.

### Reliability
- Auto-save must ensure that closing the app does not lose current workout progress.

### Observability
- Basic console logging for storage operations.

### Security
- Data is stored locally; no external transmission of workout data.

### Maintainability
- Code should be modular, separating persistence, logic, and UI.
