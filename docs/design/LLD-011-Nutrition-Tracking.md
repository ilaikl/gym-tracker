# LLD-011: Nutrition Tracking Infrastructure

## 1. Overview
Reference:
- Related Plan Item (PLAN-011)
- Related Requirements (R16, R17)

This LLD describes the foundational data structures and services for nutrition tracking. It includes a daily meal log, ingredient management, and a reusable ingredient database for fast data entry.

## 2. Architecture Design
- **NutritionService**: Orchestrates the creation and retrieval of daily nutritional logs.
- **IngredientService**: Manages the ingredient database (lookup, auto-save of new ingredients).
- **PersistenceService**: Extended to support `nutritionLogs` and `ingredients` object stores in IndexedDB.

## 3. Data Model Changes
### New Tables / Stores
1. **nutritionLogs**:
   - Key: `id` (e.g., `nutrition_2026-03-30`)
   - Fields: `date`, `meals[]`, `createdAt`, `updatedAt`
2. **ingredients**: (The reusable database)
   - Key: `id` (name/slug)
   - Fields: `name`, `caloriesPer100g`, `proteinPer100g`, `carbsPer100g`, `fatsPer100g`

### Entity Structures
```json
// NutritionLog
{
  "id": "nutrition_2026-03-30",
  "date": "2026-03-30",
  "meals": [
    {
      "id": "meal_1711741620000",
      "name": "Breakfast",
      "ingredients": [
        {
          "id": "ing_oats",
          "name": "Oats",
          "weight": 50,
          "calories": 194.5,
          "protein": 8.5,
          "carbs": 33.5,
          "fats": 3.5
        }
      ]
    }
  ]
}
```

## 4. API Design
### NutritionService
- `getLog(date)`: Returns the log for a specific date (creates one if missing).
- `saveLog(log)`: Persists the entire log.
- `calculateMealTotals(meal)`: Sums macros/calories for a meal.
- `calculateDayTotals(log)`: Sums macros/calories for all meals in the day.

### IngredientService
- `searchIngredients(query)`: Returns list of matching ingredients from DB.
- `getIngredient(id)`: Fetches specific ingredient details.
- `saveIngredient(ingredient)`: Adds or updates an ingredient in the DB.

## 5. Internal Class Design
### NutritionLogManager
- `addMeal(date, name)`
- `removeMeal(date, mealId)`
- `addIngredientToMeal(date, mealId, ingredientData, weight)`: Fetches 100g values from DB and calculates totals for the specific weight.

## 6. Concurrency & Consistency Considerations
- **Auto-save**: Similar to workout logs, every change in a meal or ingredient weight triggers an auto-save to IndexedDB.
- **Atomic Log Updates**: The entire day's log is saved as a single object to ensure consistency within the day.

## 7. Error Handling Strategy
- Validation for negative weights or non-numeric macro values.
- Graceful handling of missing ingredient data.

## 8. Observability
- Console logging for nutrition log persistence.
- Metrics for database size (number of ingredients stored).

## 9. Security Considerations
- Data remains local to the device.
- Export/Import includes the `nutritionLogs` and `ingredients` stores.

## 10. Testing Strategy
- Unit tests for nutritional calculations (weight-to-macro conversion).
- Integration tests for IndexedDB CRUD operations on new stores.
- Edge case: Zero weight, missing macros in ingredient DB.
