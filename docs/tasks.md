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
- [x] Add delete buttons to History screen items
(PLAN-004 | R8 | LLD-004)

## Phase 5 — Polishing & Seed Data
- [x] Implement `AppInitializer` with seed program data
(PLAN-005 | R1 | LLD-005)
- [x] Apply mobile-first CSS styling for Android PWA experience
(PLAN-005 | R3 | LLD-005)
- [x] Final UI/UX review and bug fixes
(PLAN-005 | R3 | LLD-005)

## Phase 6 — Partial Data Management
- [x] Add specific Export Program/History buttons to UI
(PLAN-006 | R5 | LLD-006)
- [x] Implement `exportProgram` and `exportHistory` in `JSONTransferService`
(PLAN-006 | R5 | LLD-006)
- [x] Implement `mergeLogs` in `PersistenceService`
(PLAN-006 | R5 | LLD-006)
- [x] Update `importData` to support partial merges for history and programs
(PLAN-006 | R5 | LLD-006)
- [x] Verify partial import/export functionality
(PLAN-006 | R5 | LLD-006)
