# LLD-013: Nutrition History and Meal Management

## 1. Overview
Reference:
- Related Plan Item (PLAN-013)
- Related Requirements (R20, R21)

This document outlines the design for the Nutrition History view and the ability to reuse meals from history.

## 2. Architecture Design
- **Nutrition History View**: A new screen (tab) showing a chronological list of daily nutritional summaries.
- **Meal Search/Reuse**: Enhance the meal adding interface to search through previous meals and clone them.
- **Data Retrieval**: `NutritionService` will be extended to query all `nutritionLogs` and match them with `workoutLogs` to determine training vs rest day targets for each historical entry.

## 3. Data Model Changes
No changes to existing schemas, but new query logic will be implemented.

## 4. API Design (Internal)
### NutritionService Extensions
- `async getHistorySummaries()`: Retrieves all nutrition logs, calculates totals, identifies workout status for each date, and returns summarized objects with color-coding info.
- `async searchHistoricalMeals(query)`: Searches all previous logs for meals matching the name.

## 5. Internal Class Design
### NutritionService
- `summarizeDay(log, workoutExists)`: Private helper to calculate deltas from targets and assign a status color.

### UI logic in app.js
- `renderNutritionHistory()`: Fetches summaries and renders rows with color-coded macro/calorie stats.
- `showMealSearchModal()`: Displays a search interface for historical meals.

## 6. Concurrency & Consistency Considerations
- History view should be refreshed whenever a log is "Finished" or modified.
- Meal cloning must perform a deep copy of ingredients to ensure historical independence.

## 7. Error Handling Strategy
- Handle cases where a nutrition log exists but the target settings are missing (use defaults).
- Gracefully handle days with no logs.

## 8. Observability
- Log search performance for large historical datasets.

## 9. Security Considerations
- All data remains local.

## 10. Testing Strategy
- Unit test `summarizeDay` with various actual vs target scenarios.
- Verify that color coding logic correctly handles "over" vs "under" targets.
- Verify that meal cloning correctly copies all ingredients and macros.
