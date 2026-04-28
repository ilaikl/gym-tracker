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
- THEN the system SHALL display the total daily intake for each macronutrient and total calories, along with a comparison against targets.
- WHEN viewing the nutrition section
- THEN the system SHALL display the current date prominently.
- THEN the system SHALL display a "Finished" status in the Nutrition History if the day was completed via the "Finish Day & Summary" button.
- THEN the system SHALL allow adding new dates to the history via a date picker.

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
- THEN navigation between "Workout", "Nutrition", and "History" sections SHALL be intuitive and accessible.
- THEN the visual feedback for actions (e.g., saving, completing, error messages) SHALL be clear and professional.
- THEN the mobile-first layout SHALL be optimized for high-quality Android (PWA) experience.

### R20: Nutrition History
**User Story**
As a user, I want to view a history of my daily nutritional intake so that I can track my progress over time.

**Acceptance Criteria**
- WHEN the user accesses the "Nutrition History" section
- THEN the system SHALL display a list of previous days with their dates and a summary of intake (calories and macronutrients).
- THEN the summary SHALL be compared against the target for that day (Training vs. Rest).
- THEN the system SHALL use color coding (e.g., Green/Orange/Red) to indicate how close the intake was to the target.

### R21: Meal Templates from History
**User Story**
As a user, I want to quickly add full meals from my history so that I don't have to re-enter ingredients for recurring meals.

**Acceptance Criteria**
- WHEN adding a new meal to the current nutrition log
- THEN the system SHALL provide an option to search for and select a meal from history by name.
- THEN selecting a historical meal SHALL automatically populate the new meal with all its ingredients and their respective nutritional values.

### R6: User Interface (Language and Alignment)
**User Story**
As a user, I want the application to use English and be left-aligned so that it is consistent with my preferred language and layout.

**Acceptance Criteria**
- WHEN the application is loaded
- THEN the user interface SHALL be displayed in English.
- THEN all text, forms, and UI components SHALL be left-aligned.
- THEN the layout SHALL follow a Left-to-Right (LTR) direction.

### R22: Nutritional Ranges and Criticality
**User Story**
As a user, I want to set nutritional targets as ranges (e.g., 2200-2300 calories) and define separate plus/minus tolerances (Criticality) for each macro, so I can accurately track how well I'm adhering to my goals.

**Acceptance Criteria**
- **WHEN** configuring nutritional targets in the Data Management section.
- **THEN** the system SHALL allow setting a min/max range for calories, protein, carbs, and fats.
- **THEN** the system SHALL allow setting a separate "plus tolerance" and "minus tolerance" for each macro (e.g., +50g/-10g protein).
- **WHEN** viewing nutrition history.
- **THEN** a macro SHALL be **GREEN** if it's within the min/max range.
- **THEN** a macro SHALL be **YELLOW** if it's outside the range but within the specified plus or minus tolerance (criticality).
- **THEN** a macro SHALL be **RED** if it's beyond the tolerance range.
- **WHEN** calculating for different days.
- **THEN** targets SHALL support separate ranges and tolerances for Training vs. Rest days.

### R23: Nutrition Day Export
**User Story**
As a user, I want to export a single day of nutrition data so that I can share or move individual daily logs without transferring my entire history.

**Acceptance Criteria**
- **WHEN** the user views the nutrition history list
- **THEN** the system SHALL provide an "Export" button for each nutrition day entry.
- **WHEN** the user selects "Export" for a specific nutrition day
- **THEN** the system SHALL generate a JSON file containing only that specific `NutritionLog` with correct metadata.
- **WHEN** a single `NutritionLog` file is imported via the main "Import Data" button
- **THEN** the system SHALL merge it into the nutrition history, avoiding duplicates by date.

### R24: Meal Editing and Daily Update
**User Story**
As a user, I want to edit an existing meal in my nutrition log so that I can correct errors or update my intake for that day.

**Acceptance Criteria**
- **WHEN** viewing the nutrition log for a specific day
- **THEN** the system SHALL provide an "Edit" button for each logged meal.
- **WHEN** the user edits a meal
- **THEN** the system SHALL allow modifying ingredients, weights, and nutritional values.
- **WHEN** the meal is saved
- **THEN** the system SHALL automatically update the daily totals and targets for that nutrition log.
- **THEN** the system SHALL persist the updated meal data to the `NutritionLog` in IndexedDB.

### R25: History and Program Reset
**User Story**
As a user, I want to reset all my workout and nutrition history and restore the program to its default state so that I can start fresh.

**Acceptance Criteria**
- **WHEN** the user accesses the "Data Management" (Settings) section
- **THEN** the system SHALL provide a "Reset All Data" button.
- **WHEN** the user clicks "Reset All Data"
- **THEN** the system SHALL ask for a final confirmation to prevent accidental data loss.
- **WHEN** confirmed
- **THEN** the system SHALL clear all `workoutLogs`, `nutritionLogs`, and the current `program` template.
- **THEN** the system SHALL re-seed the default workout program and nutritional targets.
- **THEN** the system SHALL refresh the UI to reflect the reset state.

### R26: Exercise Selection from Existing Templates
**User Story**
As a user, I want to select from existing exercises when adding a new one to my program, so I can reuse details like name and body part without manual entry.

**Acceptance Criteria**
- **WHEN** adding a new exercise to a program day.
- **THEN** the system SHALL provide a dropdown/search list of unique exercises already present in any day of the program.
- **WHEN** an existing exercise is selected.
- **THEN** the system SHALL auto-fill its name, body part, and default targets.

### R27: Drag-and-Drop Reordering with Handle
User Story
As a user, I want to reorder exercises within a workout by dragging a dedicated handle, so I can easily adjust my training flow without accidental drags during normal interaction.

Acceptance Criteria
- **WHEN** viewing a program day's exercises or an active workout.
- **THEN** each exercise SHALL feature a visible drag handle (e.g., "⠿").
- **THEN** the system SHALL ONLY allow dragging and dropping exercises by interacting with the drag handle.
- **WHEN** an exercise is reordered.
- **THEN** the system SHALL immediately persist the new order to the respective `program` or `WorkoutLog`.

### R28: User Authentication (Google Auth)
User Story
As a user, I want to sign in with my Google account so that my data is associated with my identity and can be synced across multiple devices.

Acceptance Criteria
- **WHEN** the user opens the app for the first time or is signed out.
- **THEN** the system SHALL provide an option to "Sign in with Google".
- **WHEN** the user signs in.
- **THEN** the system SHALL authenticate the user via Firebase Auth.
- **THEN** the system SHALL associate all subsequent data writes with the user's unique ID (UID).
- **THEN** the system SHALL provide a "Sign Out" option in the Data Management section.

### R33: Bug Fixes - History and Progress
Acceptance Criteria
- **WHEN** viewing exercise progress history.
- **THEN** the system SHALL only include sets that have actually been performed (non-null actual reps).
- **WHEN** viewing history details.
- **THEN** the system SHALL correctly display the historical data without interfering with active workout state.

### R30: Exercise and Nutrition API Integration
User Story
As a user, I want to select exercises and foods from a comprehensive database so that I don't have to manually enter all details.

Acceptance Criteria
- **WHEN** adding an exercise or nutrition item.
- **THEN** the system SHALL provide a searchable list of items from an external or pre-defined API/JSON database.
- **THEN** the system SHALL allow adding custom items if they are not in the list.

### R31: Improved Exercise Card UI (Refined)
User Story
As a user, I want a spacious and structured exercise card UI that optimizes mobile screen space, clearly separating information (Name, Targets, Cues) from action buttons and expansion content (Progress/History).

Acceptance Criteria
- **Active Workout Card**:
    - Action buttons ("Add Set", "Remove Set", "Set as Target") SHALL be aligned **horizontally** in a single row (`.horizontal-actions`).
    - Buttons SHALL share the width equally and wrap gracefully on very narrow screens.
    - Information (Name, Targets, Cues) SHALL be stacked vertically.
- **Program Editor Card**:
    - The main container SHALL be a block element to allow children to stack.
    - The top section SHALL be a **3-column grid** details row (`.program-ex-details-row`) with columns for Name, Info (Targets/Cues), and Buttons (Edit/Delete/Progress) respectively.
    - Columns SHALL be equal width (1/3 each).
    - The "Progress" expansion container SHALL be located **outside** the 3-column grid row but inside the card, allowing it to span the **100% full width** of the card.
- **General**:
    - Drag handles (`⠿`) SHALL be preserved and functional within the new layouts.
    - CSS `!important` flags SHALL be used to ensure layout robustness against global style overrides.
    - `box-sizing: border-box` SHALL be applied to all containers to prevent horizontal overflow.

### R32: Screen-Locked Rest Timer
User Story
As a user, I want a persistent rest timer on the workout screen so that I can easily track my recovery time between sets.

Acceptance Criteria
- **WHEN** a workout is active.
- **THEN** the system SHALL display a small timer locked to the corner of the screen.
- **THEN** the timer SHALL include Start, Reset, Pause, and Hide controls.

### R34: Navigation Improvements ('Back' to Homepage Button)
User Story
As a user, I want a "Back" button on the workout screen that is locked to the screen, so I can easily return to the homepage during or after my workout.

Acceptance Criteria
- **WHEN** a workout is active or being reviewed (Workout Page).
- **THEN** the system SHALL display a "Back" button locked to a fixed position on the screen.
- **THEN** clicking the "Back" button SHALL return the user to the main/home screen.

### R35: External Database Integration (Nutrition & Exercise)
User Story
As a user, I want to search for food and exercises from an external database so that I can quickly populate nutritional values and training details without manual entry.

Acceptance Criteria
- **WHEN** adding an ingredient to a meal.
- **THEN** the system SHALL provide a search interface for the USDA FoodData Central API.
- **WHEN** a food item is selected from the API results.
- **THEN** the system SHALL automatically map its nutrients (Calories, Protein, Carbs, Fats) to the ingredient editor.
- **WHEN** adding a new exercise to the program.
- **THEN** the system SHALL provide a list of common exercises (from a pre-seeded JSON or external API).
- **WHEN** an exercise is selected.
- **THEN** the system SHALL auto-fill its body part and cues.
- **THEN** the system SHALL allow the user to override any auto-filled value.

---

## Category A — Active Workout Improvements

### R36: Replace Exercise in Active Workout
**User Story**
As a user, I want to replace an exercise in my active workout with a suggested alternative, so I can adapt my training without losing the set structure.

**Acceptance Criteria**
- **WHEN** viewing an exercise in an active workout
- **THEN** the system SHALL provide a "Replace" button on the exercise card.
- **WHEN** the user taps "Replace"
- **THEN** the system SHALL display a list of suggested replacement exercises that target the same primary muscle group.
- **THEN** the list SHALL prioritise exercises already in the user's exercise library (program or manual exercises).
- **WHEN** a replacement is selected
- **THEN** the system SHALL swap the exercise in the active `WorkoutLog`, preserving the existing set count and targets.
- **THEN** the system SHALL immediately persist the change.

### R37: Fix Drag-and-Drop Order Persistence in Active Workout
**User Story**
As a user, I want drag-and-drop reordering in my active workout to actually save the new order, so my exercise sequence is correct.

**Acceptance Criteria**
- **WHEN** the user drags an exercise to a new position in an active workout
- **THEN** the system SHALL update the `displayOrder` of all affected `LoggedExercise` entries.
- **THEN** the system SHALL persist the new order to the `WorkoutLog` in IndexedDB immediately.
- **WHEN** the workout screen is re-rendered
- **THEN** the exercises SHALL appear in the persisted order.

### R38: Fix Set Targets — Per-Set Rep Targets
**User Story**
As a user, I want each set to show its own rep target (e.g., Set 1: 12 reps, Set 2: 11, Set 3: 10), so I know exactly what I'm aiming for on every set.

**Acceptance Criteria**
- **WHEN** an exercise has a rep target defined (fixed or descending)
- **THEN** each set row SHALL display its individual target reps next to the set number.
- **WHEN** the target is a single value (e.g., 3×10)
- **THEN** all sets SHALL show that same value.
- **WHEN** the target is a range or per-set list
- **THEN** each set SHALL show its specific target value.
- **THEN** the target SHALL be visually distinct from the actual reps input (e.g., lighter text or label).

### R39: Fix Set Target on New Manual Exercise
**User Story**
As a user, I want the set target to be correctly initialised when I add a new manual exercise during a workout, so I don't see broken or missing target data.

**Acceptance Criteria**
- **WHEN** the user adds a new manual exercise during an active workout
- **THEN** the system SHALL correctly set `targetReps`, `targetWeight`, and `targetSets` with sensible defaults.
- **THEN** each generated set SHALL have its `targetReps` populated.
- **THEN** the exercise SHALL render without errors on the active workout screen.

---

## Category B — Exercise Management

### R40: Exercise Cues on New Manual Exercise
**User Story**
As a user, I want to add cues/notes when creating a new manual exercise, so I can record form tips immediately.

**Acceptance Criteria**
- **WHEN** the user opens the "Add Manual Exercise" form (in program editor or active workout)
- **THEN** the system SHALL include a "Notes/Cues" text field.
- **WHEN** the form is saved
- **THEN** the `notes` field SHALL be persisted with the exercise template.

### R41: Manual Exercises Added to Global Exercise Library
**User Story**
As a user, I want manual exercises I create to be saved to the global exercise list, so I can reuse them across workouts.

**Acceptance Criteria**
- **WHEN** the user creates a new manual exercise
- **THEN** the system SHALL save it to the global `exercises` store in IndexedDB (same store used by imported exercises).
- **WHEN** selecting exercises in the program editor or active workout
- **THEN** the system SHALL include previously created manual exercises in the searchable list.

### R42: Import Exercises from API Ninjas into Local DB
**User Story**
As a developer/admin, I want a one-time import script that fetches exercises from API Ninjas and stores them in the local `exercises` JSON / IndexedDB, so the app has a rich exercise library without runtime API calls.

**Acceptance Criteria**
- **WHEN** the import script is executed
- **THEN** it SHALL call `GET https://api.api-ninjas.com/v1/exercises?muscle={muscle}` for each muscle group.
- **THEN** it SHALL normalise each result to the internal `ExerciseTemplate` format (`name`, `muscle`, `type`, `difficulty`, `instructions`, `safetyTips`, `equipments`).
- **THEN** it SHALL save the result to `data/exercises.json`, deduplicating by `name + muscle`.
- **WHEN** the app initialises
- **THEN** `AppInitializer` SHALL seed the `exercises` IndexedDB store from `data/exercises.json` if the store is empty.

### R43: Browse Existing Exercises by Muscle Category
**User Story**
As a user, I want to browse the exercise library organised by muscle group, so I can easily find the right exercise without scrolling through a long flat list.

**Acceptance Criteria**
- **WHEN** the user opens the "Add Exercise" picker (program editor or active workout)
- **THEN** the system SHALL display exercises grouped by muscle/body-part category.
- **THEN** each category SHALL be collapsible/expandable.
- **WHEN** the user selects an exercise from a category
- **THEN** the system SHALL auto-fill name, muscle, cues, and default targets.

---

## Category C — Nutrition Improvements

### R44: Fix Nutrition Day UI
**User Story**
As a user, I want the nutrition day screen to have a clean, readable layout, so I can log meals comfortably on mobile.

**Acceptance Criteria**
- **WHEN** the user views the nutrition day screen
- **THEN** macro summary totals SHALL be clearly visible at the top.
- **THEN** meal cards SHALL be visually separated with consistent spacing and typography.
- **THEN** ingredient rows SHALL align values (calories, protein, carbs, fats) in a compact readable format.
- **THEN** action buttons ("Add Meal", "Finish Day") SHALL be easily tappable on mobile.

### R45: Nutrition Day Targets Snapshot
**User Story**
As a user, I want the targets saved with a nutrition day to remain fixed at the time that day was logged, so changing my targets later doesn't retroactively alter my history.

**Acceptance Criteria**
- **WHEN** a `NutritionLog` is created for a specific date
- **THEN** the system SHALL snapshot the current nutritional targets (calories, protein, carbs, fats — min/max/critPlus/critMinus) into the log itself.
- **WHEN** the user later changes their nutritional targets in settings
- **THEN** existing `NutritionLog` entries SHALL NOT be affected.
- **WHEN** displaying a historical nutrition day
- **THEN** the system SHALL evaluate colour-coding against the targets stored in that log's snapshot.

### R46: Delete a Day from Nutrition History
**User Story**
As a user, I want to delete a day from my nutrition history, so I can remove incorrect or test entries.

**Acceptance Criteria**
- **WHEN** viewing the nutrition history list
- **THEN** each day entry SHALL have a "Delete" button.
- **WHEN** the user taps "Delete"
- **THEN** the system SHALL ask for confirmation.
- **WHEN** confirmed
- **THEN** the system SHALL permanently remove the `NutritionLog` for that date from IndexedDB.
- **THEN** the history list SHALL update immediately.

### R47: Full Nutrition Editing (Day, Meal, Ingredient)
**User Story**
As a user, I want to edit any part of a logged nutrition day — meals, ingredients, and macro values — and remove items, so my records are always accurate.

**Acceptance Criteria**
- **WHEN** viewing a nutrition day
- **THEN** the system SHALL allow editing the day's date/label.
- **THEN** each meal SHALL have an "Edit" button to modify its name.
- **THEN** each ingredient row SHALL have an "Edit" button to modify weight, macros, or name.
- **THEN** each ingredient row SHALL have a "Remove" button.
- **THEN** each meal SHALL have a "Remove Meal" button (with confirmation).
- **WHEN** any edit or removal is saved
- **THEN** the daily totals SHALL recalculate and persist immediately.

---

## Category D — Program Management

### R48: Remove a Day from Program
**User Story**
As a user, I want to delete a day from my workout program, so I can restructure my training split without rebuilding from scratch.

**Acceptance Criteria**
- **WHEN** viewing the program editor
- **THEN** each day SHALL have a "Delete Day" button.
- **WHEN** the user taps "Delete Day"
- **THEN** the system SHALL ask for confirmation.
- **WHEN** confirmed
- **THEN** the system SHALL remove the day and all its exercises from the `program` template in IndexedDB.
- **THEN** the program editor SHALL update immediately.
- **THEN** existing `WorkoutLog` entries that used this day SHALL NOT be affected (snapshot immutability).

---

## Category E — Bug Fixes

### R49: Fix Login When Offline
**User Story**
As a user, I want the app to handle the login screen gracefully when there is no internet connection, so I'm not blocked from using the app offline.

**Acceptance Criteria**
- **WHEN** the user opens the app without an internet connection
- **THEN** the system SHALL detect the offline state.
- **THEN** the system SHALL display a clear message explaining that sign-in requires connectivity.
- **THEN** the system SHALL offer a "Continue Offline" or "Use Without Sign-in" option.
- **WHEN** the user chooses to continue offline
- **THEN** the system SHALL proceed to the main app using locally stored data.
- **WHEN** connectivity is restored
- **THEN** the system SHALL offer to sign in and sync.

### R50: Exercise Target Storage in IndexedDB
**User Story**
As a user, I want exercise targets (weight, sets, reps) to be stored persistently with the exercise in the DB, so targets survive resets and are available as defaults when reusing an exercise.

**Acceptance Criteria**
- **WHEN** the user sets a target for an exercise (via program editor or "Set as Target")
- **THEN** the system SHALL persist `defaultWeight`, `targetSets`, and `targetReps` to the exercise record in the `exercises` IndexedDB store.
- **WHEN** the user later adds that exercise to a new workout or program day
- **THEN** the system SHALL pre-fill targets from the stored exercise record.

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
