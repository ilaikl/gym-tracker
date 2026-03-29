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
- WHEN the user selects "Import Data" and provides a valid JSON file
- THEN the system SHALL correctly detect the type of file (Full Backup, Program, or History) based on metadata.
- THEN the system SHALL replace or merge the local data based on the file type.
- WHEN the user opens the Program Management editor
- THEN the system SHALL provide an "Export Program" button inside the editor to save only the workout template.
- WHEN the user opens the History section view
- THEN the system SHALL provide an "Export History" button inside the history list view to save all workout logs.
- WHEN the user views the History section list
- THEN the system SHALL provide an "Export" button for each individual workout day.
- WHEN an individual workout is exported
- THEN the system SHALL generate a JSON file that can be re-imported into history on any device.

### R9: Individual Workout Export/Import
**User Story**
As a user, I want to export and import a single workout log so that I can share or move individual sessions without transferring my entire history.

**Acceptance Criteria**
- WHEN the user views the history list
- THEN the system SHALL provide an "Export" button for each entry.
- WHEN the user selects "Export" for a specific workout
- THEN the system SHALL generate a JSON file containing only that specific `WorkoutLog` with correct metadata.
- WHEN a single `WorkoutLog` file is imported via the main "Import Data" button
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
As a user, I want to view full details of my past workouts, edit them, and delete them if needed, so that my history is accurate and manageable, without interfering with any active training.

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
- **WHEN switching between history details and an active workout**
- **THEN the system SHALL preserve the state of the active workout and allow returning to it smoothly.**

### R11: Documentation and User Guidance
**User Story**
As a user, I want to have clear documentation and JSON examples so that I can understand how the app works and how to manage my data.

**Acceptance Criteria**
- WHEN the user opens the repository or documentation
- THEN the system SHALL provide a README file with an overview of the app.
- THEN the system SHALL include detailed JSON examples for all import types (Full, History, Program).
- THEN the system SHALL explain the "Template vs. Log" architecture.
- THEN the system SHALL provide instructions for local setup and deployment.

### R12: Contextual Exercise Progress
**User Story**
As a user, I want to see my previous performance for an exercise directly within the workout screen, so I don't have to switch to a separate history tab.

**Acceptance Criteria**
- WHEN viewing an exercise in the program editor or during an active workout
- THEN the system SHALL provide an option to expand a "Recent History" section directly under that exercise.
- THEN the system SHALL display the last 3-5 performances (date, weight, reps) for that specific exercise ID.

### R13: Global & Local Target Management
**User Story**
As a user, I want to update my target sets, reps, and weights either for a single day or for all days where the exercise appears.

**Acceptance Criteria**
- WHEN editing an exercise's targets (weight/sets/reps) in the Program Editor
- THEN the system SHALL display the editor inline, directly below the exercise being edited.
- THEN the system SHALL ask whether to apply changes to "This Day Only" or "All Days with this Exercise".
- WHEN an exercise exists in multiple days (e.g., DB Press on Day 1 and Day 4)
- THEN updating "All Days" SHALL synchronize the `targetSets` and `defaultWeight` across those days.

### R14: "Set as Target" from Performance
**User Story**
As a user, I want to easily promote my actual performance from a workout to be my new future target.

**Acceptance Criteria**
- WHEN viewing a completed workout log or an active one
- THEN the system SHALL provide a "Set as Target" button for each exercise.
- THEN clicking "Set as Target" SHALL update the Program Template's `defaultWeight` and `targetSets` for that exercise based on the `actualWeight` and `actualSets` performed in that log.

### R15: Default Exercise Cues
**User Story**
As a user, I want to see default notes/cues for each exercise so that I can maintain proper form during training.

**Acceptance Criteria**
- WHEN viewing an exercise in the program editor or during an active workout
- THEN the system SHALL display a "Notes/Cues" section with specific training tips.
- THEN the system SHALL allow editing these cues in the Program Editor.
- THEN the system SHALL include initial cues for all default seeded exercises.

### R16: Nutrition Tracking (Daily Log)
**User Story**
As a user, I want to track my daily nutritional intake so that I can monitor my calories, fats, carbs, and protein consumption.

**Acceptance Criteria**
- WHEN the user accesses the nutrition section
- THEN the system SHALL allow adding meals to a specific date.
- WHEN a meal is added
- THEN the system SHALL allow adding ingredients with their respective nutritional values (calories, fats, carbs, protein).
- WHEN entering an ingredient's weight
- THEN the system SHALL automatically calculate the total nutritional values based on its 100g reference values.
- WHEN a day is completed
- THEN the system SHALL display the total daily intake for each macronutrient and total calories.

### R17: Ingredient Database
**User Story**
As a user, I want to reuse ingredients I've previously added so that I don't have to re-enter nutritional values every time.

**Acceptance Criteria**
- WHEN the user adds an ingredient to a meal
- THEN the system SHALL automatically store it in a local ingredient database if it's new.
- WHEN searching for an ingredient
- THEN the system SHALL provide a dropdown list of existing ingredients from the database.
- WHEN an existing ingredient is selected
- THEN the system SHALL pre-fill its nutritional values (per 100g).

### R18: Nutritional Targets and Summaries
**User Story**
As a user, I want to set daily nutritional targets and view weekly summaries so that I can track my progress against my goals.

**Acceptance Criteria**
- WHEN the user opens nutrition settings
- THEN the system SHALL allow setting different nutritional targets (calories, protein, carbs, fats) for "Training Days" and "Rest Days".
- WHEN viewing a daily nutritional log
- THEN the system SHALL compare actual intake against the target for that day (based on whether a workout was logged on that date).
- WHEN viewing the weekly summary
- THEN the system SHALL display total and average nutritional intake for the past week.

### R19: Enhanced User Interface (UI)
**User Story**
As a user, I want an improved and more professional-looking user interface so that the app is more enjoyable and easier to use.

**Acceptance Criteria**
- WHEN the application is loaded
- THEN the UI SHALL feature a modern, clean, and consistent design across all screens.
- THEN navigation between "Workout" and "Nutrition" sections SHALL be intuitive and accessible.
- THEN the visual feedback for actions (e.g., saving, completing, error messages) SHALL be clear and professional.
- THEN the mobile-first layout SHALL be optimized for high-quality Android (PWA) experience.

### R6: User Interface (Language and Alignment)
**User Story**
As a user, I want the application to use English and be left-aligned so that it is consistent with my preferred language and layout.

**Acceptance Criteria**
- WHEN the application is loaded
- THEN the user interface SHALL be displayed in English.
- THEN all text, forms, and UI components SHALL be left-aligned.
- THEN the layout SHALL follow a Left-to-Right (LTR) direction.

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
