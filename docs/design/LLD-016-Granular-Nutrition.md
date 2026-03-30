# LLD-016-Granular-Nutrition-and-Meal-Editing

## 1. Overview
This document details the implementation for Phase 16, which focuses on:
1.  **Granular Nutrition Export**: Adding a "Export" button for individual daily nutrition logs in the history list.
2.  **Meal Editing**: Adding an "Edit" button for logged meals in the current nutrition log, allowing users to modify ingredients/weights and recalculate totals.

## 2. Granular Nutrition Export
-   **User Story**: As a user, I want to export a single day's nutrition log to share or backup.
-   **Implementation**:
    -   Update `renderNutritionHistory` in `app.js` to include an "Export" button for each history row.
    -   Connect the button's click event to `jsonTransferService.exportNutritionLog(log)`.
    -   The `JSONTransferService` already implements `exportNutritionLog(log)` and `importData` handles the `nutrition_log` type.

## 3. Meal Editing
-   **User Story**: As a user, I want to edit a meal I already logged to correct errors.
-   **Implementation**:
    -   Update `renderNutritionLog` in `app.js` to include an "Edit" button for each meal item.
    -   Add a "Edit Meal" modal in `index.html` (reusing the logic from the "Add Meal" and ingredient search UI).
    -   In `app.js`, implement a function `showEditMealModal(mealId)` that:
        -   Fetches the meal from the current nutrition log.
        -   Populates the modal with the meal's name and existing ingredients.
        -   Allows adding/removing/modifying ingredients and their weights.
        -   Calls `nutritionService.updateMeal(log, mealId, updatedMeal)` on save.
    -   The `updateMeal` method in `NutritionService` already exists and handles `updateLogTotals` and `saveLog`.

## 4. Technical Scope

### 4.1 UI Components (`index.html` / `style.css`)
-   **Meal Edit Modal**:
    -   A modal similar to the "Add Meal" or workout editor.
    -   Fields for meal name.
    -   A list of current ingredients with their weight (editable) and an "X" button to remove.
    -   An ingredient search input to add new ingredients to the meal.
    -   "Save Changes" and "Cancel" buttons.

### 4.2 Application Logic (`app.js`)
-   **Export Nutrition Day**:
    -   Attach click listener to export buttons in the nutrition history list.
    -   Fetch the full log from IndexedDB before exporting (history summaries may not have all meal details).
-   **Meal Editing Flow**:
    -   Store `currentEditingMealId` in the `AppUI` class or similar state.
    -   `renderEditMealIngredients()`: Renders the list of ingredients currently in the edited meal.
    -   `handleEditMealIngredientChange(index, newWeight)`: Updates an ingredient's weight in the temporary editing state.
    -   `handleEditMealRemoveIngredient(index)`: Removes an ingredient from the temporary editing state.
    -   `handleEditMealAddIngredient(ingredientData, weight)`: Adds an ingredient to the temporary editing state.

### 4.3 Data Model Updates
-   No schema changes required. `NutritionLog` and `Meal` structures are already capable of supporting these operations.

## 5. Risks and Considerations
-   **Recalculation**: Ensure that when a meal is updated, both the meal totals and the daily log totals are recalculated. `NutritionService.updateMeal` already calls `updateLogTotals`.
-   **UI Consistency**: The meal edit modal should feel consistent with the rest of the application's design.

## 6. Acceptance Criteria
-   [ ] Nutrition history rows have an "Export" button that generates a valid JSON file.
-   [ ] Logged meals have an "Edit" button that opens a modal with current meal data.
-   [ ] Changes in the meal editor (weight, adding/removing ingredients) are saved to IndexedDB.
-   [ ] Daily totals and targets update automatically after a meal edit.
