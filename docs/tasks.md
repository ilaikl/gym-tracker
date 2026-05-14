# Task List

## Phase 1 — Foundation
- [x] Implement `PersistenceService` for IndexedDB operations
(PLAN-001 | R5 | LLD-001)
- [x] Implement `JSONTransferService` for export/import logic
(PLAN-001 | R5 | LLD-001)
- [x] Add basic UI for Backup / Restore (Export/Import buttons)
(PLAN-001 | R5 | LLD-001)

## Phase 2 — Program Management
- [x] Implement program data models and `TemplateService`
(PLAN-002 | R1 | LLD-002)
- [x] Create Program Editor screen (Day/Exercise CRUD)
(PLAN-002 | R1 | LLD-002)
- [x] Implement exercise reordering logic
(PLAN-002 | R1 | LLD-002)

## Phase 3 — Core Workout Engine
- [x] Implement `WorkoutEngine` snapshotting logic
(PLAN-003 | R2, R4 | LLD-003)
- [x] Create "Start Workout" screen for selecting template/date
(PLAN-003 | R2 | LLD-003)
- [x] Implement Active Workout screen with minimal-friction entry
(PLAN-003 | R3 | LLD-003)
- [x] Implement auto-save for set updates
(PLAN-003 | R3 | LLD-003)
- [x] Add ability to add/remove sets during active workout
(PLAN-003 | R7 | LLD-003)
- [x] Add ability to add/remove exercises during active workout
(PLAN-003 | R7 | LLD-003)

## Phase 4 — History & Analytics
- [x] Create History screen for browsing past workouts
(PLAN-004 | R6 | LLD-004)
- [x] Implement `ProgressionService` for exercise tracking
(PLAN-004 | R6 | LLD-004)
- [x] Create Exercise-over-time screen for progression review
(PLAN-004 | R6 | LLD-004)
- [x] Implement `deleteWorkoutLog` in `WorkoutEngine`
(PLAN-004 | R8 | LLD-004)
- [x] Implement detailed view and editing for historical logs in `app.js`
(PLAN-004 | R8 | LLD-004)
- [x] Fix: Separate active workout from history view to prevent state corruption
(PLAN-004 | R8 | LLD-004)
- [x] Add delete buttons to History screen items
(PLAN-004 | R8 | LLD-004)
- [x] Implement "Resume Workout" from draft
(PLAN-003 | R3 | LLD-003)

## Phase 9 — Localization & UI Alignment
- [x] Set global alignment to left in `style.css`
(PLAN-009 | R6)
- [x] Change language to English and direction to LTR in `index.html`
(PLAN-009 | R6)
- [x] Update `AppInitializer.js` to seed data in English
(PLAN-009 | R6)
- [x] Review and update `README.md` with English examples
(PLAN-009 | R6)
- [x] Verify all UI components are correctly left-aligned
(PLAN-009 | R6)

## Phase 5 — Polishing & Seed Data
- [x] Implement `AppInitializer` with seed program data
(PLAN-005 | R1 | LLD-005)
- [x] Apply mobile-first CSS styling for Android PWA experience
(PLAN-005 | R3 | LLD-005)
- [x] Final UI/UX review and bug fixes
(PLAN-005 | R3 | LLD-005)

## Phase 6 — Partial and Granular Data Management
- [x] Relocate Export Program/History buttons inside respective UI sections (only visible when viewed)
(PLAN-006 | R5 | LLD-006)
- [x] Implement `exportWorkoutLog` in `JSONTransferService` for single-day export
(PLAN-006 | R9 | LLD-006)
- [x] Update History list to include individual "Export" buttons for each log
(PLAN-006 | R9 | LLD-006)
- [x] Reorganize Backup/Restore section to the bottom as "Data Management"
(PLAN-006 | R5 | LLD-006)
- [x] Add info button and descriptions for import/export capabilities
(PLAN-006 | R5 | LLD-006)
- [x] Verify granular and context-aware data management functionality
(PLAN-006 | R5, R9 | LLD-006)

## Phase 7 — Documentation & Infrastructure Support
- [x] Create comprehensive `README.md` with JSON examples
(PLAN-007 | R11)
- [x] Update `webpack.common.js` with conditional `publicPath` for local/remote builds
(PLAN-007 | R11)
- [x] Update project documentation (Requirements, Plan, Tasks) to reflect changes
(PLAN-007 | R11)

## Phase 8 — Advanced Exercise & Target Management
- [x] Implement inline recent history in Workout and Program views
(PLAN-008 | R12 | LLD-008)
- [x] Implement global exercise target synchronization in `TemplateService`
(PLAN-008 | R13 | LLD-008)
- [x] Add "Apply to all days" option to Exercise Editor UI
(PLAN-008 | R13 | LLD-008)
- [x] Implement "Set as Target" logic in `WorkoutEngine`
(PLAN-008 | R14 | LLD-008)
- [x] Add "Set as Target" buttons to Workout Log views
(PLAN-008 | R14 | LLD-008)
- [x] Verify contextual history and target promotion functionality
(PLAN-008 | R12, R13, R14 | LLD-008)

- [x] Implement target weight and reps indication in workout sets
(PLAN-008 | R3, R13 | LLD-008)
- [x] Update Exercise Editor to allow full target editing (weight, sets, reps)
(PLAN-008 | R1 | LLD-008)
- [x] Improve "Set Target" confirmation with specific performance details
(PLAN-008 | R14 | LLD-008)
- [x] Verify all target management refinements
(PLAN-008 | R1, R3, R13, R14 | LLD-008)

## Phase 10 — Exercise Cues & Form Tips
- [x] Update `AppInitializer.js` with initial exercise cues
(PLAN-010 | R15 | LLD-010)
- [x] Add "Notes/Cues" field to the Exercise Editor in `index.html`
(PLAN-010 | R15 | LLD-010)
- [x] Update `js/app.js` to render cues in Active Workout and Program screens
(PLAN-010 | R15 | LLD-010)
- [x] Implement saving/editing cues in the Program Editor
(PLAN-010 | R15 | LLD-010)
- [x] Verify cues visibility and editability across the app
(PLAN-010 | R15 | LLD-010)

## Phase 11 — Nutrition Tracking
- [x] Extend `PersistenceService` for `nutritionLogs` and `ingredients`
(PLAN-011 | R16, R17 | LLD-011)
- [x] Implement `IngredientService` for searching and saving items
(PLAN-011 | R17 | LLD-011)
- [x] Implement `NutritionService` for daily logging and calculations
(PLAN-011 | R16 | LLD-011)
- [x] Create Nutrition screen for adding meals and ingredients
(PLAN-011 | R16 | LLD-011)
- [x] Add ingredient search dropdown with auto-fill macros
(PLAN-011 | R17 | LLD-011)
- [x] Verify nutritional intake calculations and persistence
(PLAN-011 | R16 | LLD-011)

## Phase 12 — Nutritional Targets, Weekly Summaries & UI Overhaul
- [x] Add nutritional target settings (Train/Rest days) to `SettingsUI`
(PLAN-012 | R18 | LLD-012)
- [x] Implement workout-aware target comparison in Nutrition views
(PLAN-012 | R18 | LLD-012)
- [x] Implement weekly nutritional summary in `AnalyticsService` (Aggregated in `updateNutritionSummary`)
(PLAN-012 | R18 | LLD-012)
- [x] Design and implement new navigation (Tabs/Drawer) for multi-section UI
(PLAN-012 | R19 | LLD-012)
- [x] Apply "Enhanced UI" professional CSS theme to all screens
(PLAN-012 | R19 | LLD-012)
- [x] Verify target synchronization and weekly summaries functionality
(PLAN-012 | R18, R19 | LLD-012)

### Phase 13 — Nutrition History and Meal Reusability
- [x] Extend NutritionService for history summaries
(PLAN-013 | R20 | LLD-013)
- [x] Add Nutrition History screen and date navigation
(PLAN-013 | R20 | LLD-013)
- [x] Implement color-coded nutrition summary rows
(PLAN-013 | R20 | LLD-013)
- [x] Implement historical meal search and selection
(PLAN-013 | R21 | LLD-013)
- [x] Implement color-coded nutrition history summaries with "Finished" status
(PLAN-013 | R20 | LLD-013)
- [x] Implement date-specific nutrition log creation and navigation from history
(PLAN-013 | R20 | LLD-013)
- [x] Reorder application sections and navigation for logical grouping
(PLAN-012 | R19 | LLD-012)
- [x] Verify workout/nutrition classification logic and summary visibility
(PLAN-013 | R18, R20 | LLD-013)

## Phase 14 — Critical Bug Fixes (Nutrition UI)
- [x] Fix `ReferenceError` by removing dead nutrition navigation code
(PLAN-011 | R16)
- [x] Fix "Add Meal" button reliability by adding input validation
(PLAN-011 | R16)
- [x] Fix "Add Day" button in Nutrition History (auto-save new logs)
(PLAN-013 | R20)
- [x] Fix color-coding in Nutrition History (handle target field naming)
(PLAN-013 | R20)

## Phase 15 — Nutritional Ranges and Criticality
- [x] Update `requirements.md` with R22
(PLAN-015 | R22 | LLD-015)
- [x] Update `plan.md` with PLAN-015
(PLAN-015 | R22 | LLD-015)
- [x] Create LLD-015 document
(PLAN-015 | R22 | LLD-015)
- [x] Update `NutritionService` evaluation logic for ranges
(PLAN-015 | R22 | LLD-015)
- [x] Update `AppInitializer` with default ranges
(PLAN-015 | R22 | LLD-015)
- [x] Update Data Management UI (`index.html`, `app.js`)
(PLAN-015 | R22 | LLD-015)
- [x] Update Nutrition UI and History views
(PLAN-015 | R22 | LLD-015)
- [x] Implement split plus/minus tolerance (`critPlus`/`critMinus`)
(PLAN-015 | R22 | LLD-015)
- [x] Update `index.html` with separate tolerance fields
(PLAN-015 | R22 | LLD-015)
- [x] Update `app.js` to load/save split tolerances
(PLAN-015 | R22 | LLD-015)
- [x] Update `NutritionService.evaluateMacroStatus` for split tolerances
(PLAN-015 | R22 | LLD-015)

## Phase 16 — Granular Nutrition Management and Meal Editing
- [x] Implement `exportNutritionLog` in `JSONTransferService` for single-day export
(PLAN-016 | R23 | LLD-016)
- [x] Update Nutrition History list to include individual "Export" buttons for each log
(PLAN-016 | R23 | LLD-016)
- [x] Implement `updateMeal` in `NutritionService`
(PLAN-016 | R24 | LLD-016)
- [x] Update Nutrition UI to include "Edit" button for meals
(PLAN-016 | R24 | LLD-016)
- [x] Implement meal editing flow in `app.js` (modal pre-filling and updating)
(PLAN-016 | R24 | LLD-016)
- [x] Verify granular export and meal editing functionality
(PLAN-016 | R23, R24 | LLD-016)

## Phase 17 — Data Reset
- [x] Implement reset logic in `app.js` (clearing stores and re-seeding)
(PLAN-017 | R25 | LLD-017)
- [x] Add "Reset All Data" button to `index.html` with confirmation logic
  (PLAN-017 | R25 | LLD-017)
- [x] Verify history and program are reset correctly
  (PLAN-017 | R25 | LLD-017)

## Phase 18 — Exercise Selection & Reordering with Handle
- [x] Create LLD-018 document for exercise selection and reordering
  (PLAN-018 | R26, R27 | LLD-018)
- [x] Implement unique exercise datalist for program editor
  (PLAN-018 | R26 | LLD-018)
- [x] Implement auto-fill logic for existing exercise selection
  (PLAN-018 | R26 | LLD-018)
- [x] Add SortableJS to project
  (PLAN-018 | R27 | LLD-018)
- [x] Implement drag-and-drop reordering in Program Editor
  (PLAN-018 | R27 | LLD-018)
- [x] Implement `reorderExercises` in `WorkoutEngine`
  (PLAN-018 | R27 | LLD-018)
- [x] Implement drag-and-drop reordering in Active Workout
  (PLAN-018 | R27 | LLD-018)
- [x] Create LLD-020 document for exercise drag handle
  (PLAN-018 | R27 | LLD-020)
- [x] Add visible `⠿` drag handle to exercise items in `js/app.js`
  (PLAN-018 | R27 | LLD-020)
- [x] Restrict SortableJS reordering to drag handle via `handle` option
  (PLAN-018 | R27 | LLD-020)
- [x] Apply drag handle styling in `css/style.css`
  (PLAN-018 | R27 | LLD-020)
- [x] Verify reordering persistence and prevent accidental drags
  (PLAN-018 | R27 | LLD-020)

## Phase 21 — Bug Fixes (History & Progress)
- [x] Fix `ProgressionService.getExerciseHistory` logic (PLAN-021 | R33 | LLD-021)
- [x] Verify "View Details" flow in `app.js` (PLAN-021 | R33 | LLD-021)

## Phase 22 — Exercise Card UI Redesign
- [x] Implement horizontal action buttons in Active Workout for mobile efficiency (PLAN-022 | R31 | LLD-022)
- [x] Implement vertical stacking for Name, Targets, and Cues in Active Workout (PLAN-022 | R31 | LLD-022)
- [x] Implement 3-column equal-width grid for Program Editor details (PLAN-022 | R31 | LLD-022)
- [x] Ensure Program card uses a block container to support full-width expansion (PLAN-022 | R31 | LLD-022)
- [x] Implement full-width Progress/History expansion below the details row (PLAN-022 | R31 | LLD-022)
- [x] Verify drag-handle functionality remains robust with new grid/flex layouts (PLAN-022 | R31 | LLD-022)
- [x] Use `!important` and `box-sizing: border-box` to ensure UI stability (PLAN-022 | R31 | LLD-022)

## Phase 23 — Floating Rest Timer
- [x] Create floating Rest Timer overlay with Start/Pause/Reset/Hide (PLAN-021 | R32 | LLD-023)
- [x] Integrate timer to auto-start on set completion during active workout (PLAN-021 | R32 | LLD-023)
- [x] Fix: Ensure timer visibility and z-index are prioritized (PLAN-021 | R32 | LLD-023)
- [x] Fix: Add persistent "Timer" button to active workout screen for manual toggle (PLAN-021 | R32 | LLD-023)
- [x] FIX: FIX TIMER
- [x] Improve Rest Timer: Open by default and move toggle button to header (PLAN-021 | R32 | LLD-023)
- [x] Fix: Rest Timer logic stuck at 00:00 and make workout header sticky (PLAN-021 | R32 | LLD-023)
- [x] Fix: Ensure Rest Timer starts automatically and consistently (PLAN-021 | R32 | LLD-023)
- [x] Fix: Resolve scrolling issue in Active Workout screen by using flexbox layout and fixed footer (PLAN-021 | R32 | LLD-023)

## Phase 24 — Database Integration
- [x] Create `ExternalApiService.js` for USDA API calls (PLAN-024 | R35 | LLD-024)
- [x] Implement online food search in "Add Ingredient" modal (PLAN-024 | R35 | LLD-024)
- [x] Create `data/exercises.json` with common exercises (PLAN-024 | R30 | LLD-024)
- [x] Implement exercise `<datalist>` and auto-fill in Program Editor (PLAN-024 | R30 | LLD-024)
- [x] Verify API mapping and auto-fill logic (PLAN-024 | R30, R35 | LLD-024)
- [x] Fix ReferenceError in exercise datalist initialization
- [x] Fix ingredient search input UI scaling issues

## Phase 25 — Navigation Improvements
- [x] Add inline "Back" button to Active Workout header (PLAN-025 | R34 | LLD-025)
- [x] Implement navigation logic to return to home/main (PLAN-025 | R34 | LLD-025)
- [x] Apply CSS for inline flex position with workout name (PLAN-025 | R34 | LLD-025)


## Phase 26 — UI Auto-Management
- [x] Implement scroll-to-bottom auto-expansion for Active Workout bars (PLAN-026 | R36 | LLD-026)
- [x] Synchronize toggle button state with scroll-triggered expansion (PLAN-026 | R36 | LLD-026)
- [x] Implement scroll-down auto-minimization for Active Workout bars (PLAN-026 | R37 | LLD-026)
- [x] Implement scroll-to-top auto-expansion for Active Workout bars (PLAN-026 | R37 | LLD-026)
- [x] Fix vibration issue and add smooth "popping" animations for UI bars (PLAN-026 | R38 | LLD-026)

## Phase 27 — Infrastructure & Performance
- [x] Optimize Webpack bundle size by implementing `splitChunks` for vendor code
- [x] Adjust Webpack performance limits to accommodate Firebase SDK size
- [x] Update common Webpack configuration to support multiple output files

## Phase 28 — UI Restoration
- [x] Restore missing Nutrition Targets UI in `index.html` Data section

---

## Category A — Active Workout Improvements

## Phase 29 — Replace Exercise in Active Workout
- [x] Add `getExercisesByMuscle(muscle)` to `PersistenceService`
  (PLAN-029 | R36 | LLD-029)
- [x] Add `replaceExercise(logId, oldExerciseId, newTemplate)` to `WorkoutEngine`
  (PLAN-029 | R36 | LLD-029)
- [x] Add "Replace" button to active workout exercise card in `app.js`
  (PLAN-029 | R36 | LLD-029)
- [x] Implement replacement suggestion modal (grouped by library / database) in `app.js`
  (PLAN-029 | R36 | LLD-029)
- [x] Apply modal styles in `css/style.css`
  (PLAN-029 | R36 | LLD-029)
- [x] Verify set preservation and persistence after replacement
  (PLAN-029 | R36 | LLD-029)

## Phase 30 — Fix Drag-and-Drop Order Persistence in Active Workout
- [x] Locate active workout SortableJS initialisation in `app.js`
  (PLAN-030 | R37 | LLD-030)
- [x] Add/fix `onEnd` callback to call `workoutEngine.reorderExercises(logId, orderedIds)`
  (PLAN-030 | R37 | LLD-030)
- [x] Verify new order persists to IndexedDB and survives page reload
  (PLAN-030 | R37 | LLD-030)

## Phase 31 — Fix Per-Set Rep Targets & Manual Exercise Defaults
- [x] Add `resolveTargetReps(targetReps, setIndex)` helper to `WorkoutEngine`
  (PLAN-031 | R38 | LLD-031)
- [x] Update set generation in `WorkoutEngine` (snapshot + `addExerciseToLog`) to populate `targetReps` per set
  (PLAN-031 | R38 | LLD-031)
- [x] Fix manual exercise defaults (`targetReps`, `targetSets`, `targetWeight`) in `app.js` add-exercise handler
  (PLAN-031 | R39 | LLD-031)
- [x] Add per-set target label (`×N`) to set row template in `app.js`
  (PLAN-031 | R38 | LLD-031)
- [x] Add `.set-target-label` styling in `css/style.css`
  (PLAN-031 | R38 | LLD-031)
- [x] Verify per-set targets display correctly for fixed, array, and default cases
  (PLAN-031 | R38, R39 | LLD-031)

---

## Category B — Exercise Management

## Phase 32 — Exercise Management Improvements
- [x] Add `saveExercise(exercise)`, `bulkSaveExercises(exercises)`, `getExercisesByMuscle(muscle)`, `getAllExercises()`, `countExercises()` to `PersistenceService`
  (PLAN-032 | R40, R41, R42, R43 | LLD-032)
- [x] Create `scripts/importExercises.js` (Node.js one-time API Ninjas import script)
  (PLAN-032 | R42 | LLD-032)
- [x] Run import script and commit resulting `data/exercises.json`
  (PLAN-032 | R42 | LLD-032)
- [x] Update `AppInitializer` to seed `exercises` store from `data/exercises.json` if empty
  (PLAN-032 | R42 | LLD-032)
- [x] Add "Notes/Cues" textarea to manual exercise form in `index.html` / `app.js`
  (PLAN-032 | R40 | LLD-032)
- [x] Update manual exercise save handler to call `PersistenceService.saveExercise` and include `notes` field
  (PLAN-032 | R40, R41 | LLD-032)
- [x] Implement categorised exercise picker modal (grouped by muscle, collapsible, search) in `app.js`
  (PLAN-032 | R43 | LLD-032)
- [x] Replace existing flat datalist with new picker modal in program editor and active workout
  (PLAN-032 | R43 | LLD-032)
- [x] Apply picker modal styles in `css/style.css`
  (PLAN-032 | R43 | LLD-032)
- [x] Verify manual exercise appears in "My Exercises" picker section and is reusable
  (PLAN-032 | R40, R41, R43 | LLD-032)

---

## Category C — Nutrition Improvements

## Phase 33 — Nutrition Day UI & Data Integrity
- [x] Update `NutritionService.createDailyLog` to snapshot `settings.nutritionTargets` into `log.targetsSnapshot`
  (PLAN-033 | R45 | LLD-033)
- [x] Update `NutritionService.evaluateStatus` to prefer `log.targetsSnapshot` over current settings
  (PLAN-033 | R45 | LLD-033)
- [x] Add `deleteNutritionLog(date)` to `NutritionService` and wire delete button in history UI
  (PLAN-033 | R46 | LLD-033)
- [x] Add `updateIngredient`, `removeIngredient`, `updateMealName`, `removeMeal` to `NutritionService`
  (PLAN-033 | R47 | LLD-033)
- [x] Add ingredient edit (✏) and remove (✕) buttons to ingredient rows in `app.js`
  (PLAN-033 | R47 | LLD-033)
- [x] Add meal name edit and remove meal buttons to meal card header in `app.js`
  (PLAN-033 | R47 | LLD-033)
- [x] Redesign nutrition day screen layout (macro summary card, meal cards, ingredient rows) in `app.js` + `css/style.css`
  (PLAN-033 | R44 | LLD-033)
- [x] Add delete button (🗑) to each nutrition history row with confirmation
  (PLAN-033 | R46 | LLD-033)
- [x] Verify targets snapshot immutability, delete, and all edit/remove flows with recalculated totals
  (PLAN-033 | R44, R45, R46, R47 | LLD-033)

---

## Category D — Program Management

## Phase 34 — Remove Day from Program
- [x] Add `deleteDay(dayId)` to `TemplateService`
  (PLAN-034 | R48 | LLD-034)
- [x] Add "Delete Day" button (🗑) to each program day header in `app.js`
  (PLAN-034 | R48 | LLD-034)
- [x] Implement confirmation and delete handler in `app.js`
  (PLAN-034 | R48 | LLD-034)
- [x] Verify deleted day is removed from editor and remaining days are unaffected
  (PLAN-034 | R48 | LLD-034)
- [x] Verify existing `WorkoutLog` snapshots referencing the deleted day are unaffected
  (PLAN-034 | R48 | LLD-034)

---

## Category E — Bug Fixes

## Phase 35 — Fix Login When Offline
- [x] Add `isOnline()`, `continueOffline()`, `isOfflineMode()` to `AuthService`
  (PLAN-035 | R49 | LLD-035)
- [x] Update `AuthService.init()` to skip Firebase Auth when offline
  (PLAN-035 | R49 | LLD-035)
- [x] Render offline banner and "Continue Offline" button on login screen in `app.js`
  (PLAN-035 | R49 | LLD-035)
- [x] Disable / grey out "Sign in with Google" button when offline
  (PLAN-035 | R49 | LLD-035)
- [x] Add `window.addEventListener('online', ...)` to show "Back online" banner in `app.js`
  (PLAN-035 | R49 | LLD-035)
- [x] Apply offline banner CSS in `css/style.css`
  (PLAN-035 | R49 | LLD-035)
- [x] Verify offline → Continue Offline → app loads; online restore banner shown
  (PLAN-035 | R49 | LLD-035)

## Phase 36 — Exercise Target Storage in DB
- [x] Add `updateExerciseTargets(exerciseId, targets)` and `getExercise(exerciseId)` to `PersistenceService`
  (PLAN-036 | R50 | LLD-036)
- [x] Update `TemplateService.updateExercise` to call `updateExerciseTargets` on save
  (PLAN-036 | R50 | LLD-036)
- [x] Update `WorkoutEngine.promoteToTarget` to call `updateExerciseTargets` after program update
  (PLAN-036 | R50 | LLD-036)
- [x] Update exercise picker selection handler in `app.js` to pre-fill targets from stored exercise record
  (PLAN-036 | R50 | LLD-036)
- [x] Verify targets persist to exercises store and pre-fill correctly when re-adding the exercise
  (PLAN-036 | R50 | LLD-036)

---

## Category F — Refinements & Bug Fixes (Round 2)

## Phase 37 — Sub-Muscle Categories & Precise Replacement Suggestions
- [x] Add `subMuscle` field to exercise data model — created `scripts/enrichSubMuscle.js` with keyword-mapping rules
  (PLAN-037 | R51 | LLD-037)
- [x] Run `enrichSubMuscle.js` to assign `subMuscle` values to all 155 exercises in `data/exercises.json`
  (PLAN-037 | R51 | LLD-037)
- [x] Add `getExercisesBySubMuscle(subMuscle)` to `PersistenceService`
  (PLAN-037 | R51 | LLD-037)
- [x] Update `bulkSaveExercises` in `PersistenceService` to use merge logic (preserve user targets when re-seeding)
  (PLAN-037 | R51 | LLD-037)
- [x] Update replace-exercise flow in `app.js` to query sub-muscle first, fall back to broad muscle
  (PLAN-037 | R51 | LLD-037)
- [x] Update replace modal render to show two sections: "Same Movement Pattern" and "Same Muscle Group"
  (PLAN-037 | R51 | LLD-037)
- [x] Verify pull-ups/pull-downs and dumbbell-rows/cable-rows are correctly grouped
  (PLAN-037 | R51 | LLD-037)

## Phase 38 — Fix Modal UI for Landscape Orientation
- [x] Update `.modal` overlay CSS to use `position: fixed; inset: 0; display: flex; align-items: center;`
  (PLAN-038 | R52 | LLD-038)
- [x] Update `.modal-content` CSS to use `max-height: 85vh; display: flex; flex-direction: column; overflow: hidden`
  (PLAN-038 | R52 | LLD-038)
- [x] Add `.modal-body` CSS with `flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch`
  (PLAN-038 | R52 | LLD-038)
- [x] Add `.modal-footer` CSS with `flex-shrink: 0; border-top` for sticky cancel button
  (PLAN-038 | R52 | LLD-038)
- [x] Update `#replace-ex-modal` HTML structure in `index.html` to use `.modal-body` + `.modal-footer`
  (PLAN-038 | R52 | LLD-038)
- [x] Update `#exercise-picker-modal` HTML structure in `index.html` to use `.modal-body` + `.modal-footer`
  (PLAN-038 | R52 | LLD-038)
- [x] Update `#add-ex-modal` HTML structure in `index.html` to use `.modal-body` + `.modal-footer`
  (PLAN-038 | R52 | LLD-038)

## Phase 39 — Fix Drag-and-Drop on Real Mobile Devices
- [x] Update SortableJS init in `app.js` for active workout list: add `forceFallback: true`, `fallbackOnBody: true`, `delay: 150`, `delayOnTouchOnly: true`, `touchStartThreshold: 5`
  (PLAN-039 | R53 | LLD-039)
- [x] Add `.sortable-ghost` and `.sortable-fallback` CSS classes in `css/style.css`
  (PLAN-039 | R53 | LLD-039)
- [x] Update drag handle to minimum 44×44px touch target size in CSS
  (PLAN-039 | R53 | LLD-039)
- [x] Verify `onEnd` callback correctly reads `data-ex-id` and calls `workoutEngine.reorderExercises`
  (PLAN-039 | R53 | LLD-039)

## Phase 40 — Manual Exercises in Categorized Picker & Settable Targets
- [x] Replace "Existing" dropdown in add-exercise modal with "Browse Exercise Library" button opening the categorized picker
  (PLAN-040 | R54 | LLD-040)
- [x] Manual exercise name field taps open picker; pre-fills all fields from selected exercise
  (PLAN-040 | R54 | LLD-040)
- [x] Manual exercise save handler stores `muscle`, `notes`, `source: "manual"`, `targetReps`, `targetWeight` to global library
  (PLAN-040 | R54 | LLD-040)
- [x] `renderPickerCategories` shows "My Exercises" / "Manual" groups first (sorted to top)
  (PLAN-040 | R54 | LLD-040)
- [x] Fix `WorkoutEngine.promoteToTarget` to not throw when exercise has no program template entry — update global `exercises` store only
  (PLAN-040 | R55 | LLD-040)
- [x] Add `buildExerciseTemplate(ex)` helper in `app.js` for consistent template construction from library records
  (PLAN-040 | R54 | LLD-040)

## Phase 41 — Fix Exercise Target Persistence
- [x] Update `bulkSaveExercises` in `PersistenceService` to use merge logic: preserve `targetSets`, `targetReps`, `targetWeight` from existing records when re-seeding
  (PLAN-041 | R56 | LLD-041)
- [x] Fix `WorkoutEngine.promoteToTarget` — always call `updateExerciseTargets` first; program template update is optional/graceful
  (PLAN-041 | R56 | LLD-041)
- [x] Update exercise picker item `onclick` in `app.js` to call `persistenceService.getExercise(ex.id)` for fresh read before pre-filling targets
  (PLAN-041 | R56 | LLD-041)
- [x] Add `getExercise(id)` convenience method to `PersistenceService`
  (PLAN-041 | R56 | LLD-041)
