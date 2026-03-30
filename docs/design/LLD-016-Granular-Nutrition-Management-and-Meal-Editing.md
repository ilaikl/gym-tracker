# LLD-016: Granular Nutrition Management and Meal Editing

## 1. Overview
**Related Plan Item:** PLAN-016
**Related Requirements:** R23, R24

This document describes the design for exporting individual daily nutrition logs and enabling the editing of existing meals within those logs.

## 2. Architecture Design
- **`JSONTransferService`**: Enhanced to support exporting single `NutritionLog` entities with appropriate metadata for re-importing.
- **`NutritionService`**: Enhanced with an `updateMeal` method that handles modifying a meal's contents and recalculating the daily totals for the affected log.
- **UI (app.js)**:
  - Add "Export" buttons to each row in the Nutrition History list.
  - Add "Edit" buttons to each meal in the daily nutrition view.
  - Implement a `showMealEditor` function that pre-fills the existing "Add Meal" modal with the meal's current data for editing.

## 3. Data Model Changes
No structural changes to the database. The `NutritionLog` schema remains as-is:
- `date`: String (Key)
- `meals`: Array of Meal objects
- `totals`: Object containing aggregated calories and macros
- `status`: String ('draft' or 'finished')

## 4. API Design

### JSONTransferService
- `exportNutritionLog(log)`: Generates a JSON file for a single nutrition log.
  - Metadata: `{ type: "nutrition_log", version: 1 }`.

### NutritionService
- `updateMeal(date, mealId, updatedMeal)`:
  1. Fetches the log for the given date.
  2. Finds the meal by `id`.
  3. Replaces it with `updatedMeal`.
  4. Recalculates `log.totals` by summing all meals.
  5. Persists the updated log.

## 5. UI Components

### Nutrition History Row
- Added a button: `<button class="btn-secondary export-log-btn" data-date="...">Export</button>`.

### Daily Nutrition Meal Item
- Added an "Edit" button next to the "Delete" button for each meal.
- Tapping "Edit" triggers the meal editor modal.

### Meal Editor Modal
- Reuses the `add-meal-modal`.
- If editing, pre-fills the meal name.
- Lists existing ingredients with weight inputs.
- "Save" button triggers `NutritionService.updateMeal` instead of `addMeal`.

## 6. Error Handling
- Validate that the meal exists before attempting to update.
- Ensure daily totals are correctly reset before recalculation to avoid accumulation errors.

## 7. Testing Strategy
- **Unit Tests**:
  - `NutritionService.updateMeal` correctly updates totals.
  - `JSONTransferService.exportNutritionLog` produces valid JSON with correct metadata.
- **Integration Tests**:
  - Clicking "Export" triggers a download.
  - Saving an edited meal correctly updates the UI totals.
