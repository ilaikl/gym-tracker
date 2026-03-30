# LLD-015: Nutritional Ranges and Criticality

## 1. Overview
Reference:
- Related Plan Item: PLAN-015
- Related Requirements: R22

This LLD describes the transition from single-value nutritional targets to range-based targets with criticality (tolerance) values. It includes the data model changes, the evaluation logic, and the UI enhancements.

## 2. Architecture Design
The existing `NutritionService` will be updated to handle the new range-based target structure. The `PersistenceService` will store the updated settings.

### Sequence Flow: Status Evaluation
1. UI requests `getHistorySummaries`.
2. `NutritionService` calculates daily totals.
3. `NutritionService` retrieves current settings (ranges and criticality).
4. `NutritionService` calls `evaluateStatus` for each macro.
5. Macro status is determined:
   - **GREEN**: `total >= min && total <= max`
   - **YELLOW**: Outside range but within `min - criticality` or `max + criticality`.
   - **RED**: Outside range and outside criticality.
6. UI displays macro results with corresponding color coding.

## 3. Data Model Changes
The `settings.nutritionTargets` object will be updated:

```json
{
  "nutritionTargets": {
    "trainingDay": {
      "calories": { "min": 2200, "max": 2300, "criticality": 100 },
      "protein": { "min": 145, "max": 155, "criticality": 10 },
      "carbs": { "min": 200, "max": 220, "criticality": 20 },
      "fats": { "min": 50, "max": 60, "criticality": 10 }
    },
    "restDay": {
      "calories": { "min": 2000, "max": 2100, "criticality": 100 },
      "protein": { "min": 140, "max": 150, "criticality": 10 },
      "carbs": { "min": 140, "max": 160, "criticality": 20 },
      "fats": { "min": 50, "max": 60, "criticality": 10 }
    }
  }
}
```

## 4. API / Method Design
### `NutritionService.evaluateStatus(totals, target)`
- Returns a status object for each macro: `{ calories: 'green', protein: 'yellow', ... }`.
- Or a single overall status (e.g., 'red' if any macro is 'red').

### `NutritionService.evaluateMacroStatus(actual, targetRange)`
- Logic:
  ```javascript
  if (actual >= targetRange.min && actual <= targetRange.max) return 'green';
  if (actual >= (targetRange.min - targetRange.criticality) &&
      actual <= (targetRange.max + targetRange.criticality)) return 'yellow';
  return 'red';
  ```

## 5. UI Design
### Data Management Settings
- Replace single input fields for targets with:
  - `Min` input
  - `Max` input
  - `Criticality` input
- Repeat for Training Day and Rest Day targets.

### Nutrition History
- For each macro total, apply color-coding (Green/Yellow/Red text or background).
- Show progress bar relative to the range.

## 6. Testing Strategy
- **Unit Test**: Verify `evaluateMacroStatus` with various actual vs. target scenarios.
- **Integration Test**: Confirm settings are correctly saved and loaded.
- **UI Test**: Verify color coding in Nutrition History.
