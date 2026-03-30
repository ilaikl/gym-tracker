# LLD-012: Nutritional Targets, Weekly Summaries, and UI Enhancements

## 1. Overview
Reference:
- Related Plan Item (PLAN-012)
- Related Requirements (R18, R19)

This LLD focuses on advanced nutrition features (daily targets, weekly summaries) and the global UI overhaul to support both workout and nutrition sections.

## 2. Architecture Design
- **AnalyticsService**: Extended to calculate weekly nutritional summaries.
- **SettingsUI**: Updated to manage nutritional targets for Training vs. Rest days.
- **AppUI**: Transition to a multi-view layout (e.g., using tabs or a main menu) to switch between Workout and Nutrition sections.
- **StyleSheet (Enhanced UI)**: Professional CSS upgrade with a unified color palette and improved typography.

## 3. Data Model Changes
### Settings Updates
```json
// Settings Model Extension
{
  "nutritionTargets": {
    "trainingDay": {
      "calories": 3000,
      "protein": 200,
      "carbs": 400,
      "fats": 70
    },
    "restDay": {
      "calories": 2500,
      "protein": 200,
      "carbs": 250,
      "fats": 70
    }
  }
}
```

## 4. API Design
### AnalyticsService
- `getWeeklyNutritionSummary(date)`: Aggregates logs from the surrounding 7 days.
- `calculateAverageMacros(logs[])`: Returns average daily calories/macros.
- `isTrainingDay(date)`: Helper that checks `workoutLogs` for any entry on that date.

### AppUI / Navigation
- `switchSection(sectionId)`: Toggles between `workout-container` and `nutrition-container`.
- `renderWeeklySummary(summary)`: Renders a card with current vs. average performance.

## 5. Internal Class Design
### UIModuleManager
- `initTabs()`: Sets up the main navigation for the app.
- `applyTheme(isEnhanced)`: Toggles the professional UI enhancements.

## 6. Concurrency & Consistency Considerations
- Ensure that `isTrainingDay` check is reactive; if a workout is added/deleted for the current day, the nutritional target indicator should update.

## 7. Error Handling Strategy
- Default to "Rest Day" targets if workout data is unavailable or cannot be checked.
- Fallback UI for weeks with zero logged meals.

## 8. Observability
- Tracking navigation usage (which sections are most used).
- Logging calculation results for weekly summaries.

## 9. Security Considerations
- Ensure settings (targets) are correctly exported/imported with the rest of the app state.

## 10. Testing Strategy
- Verification of target switching logic (Rest vs. Train).
- Testing weekly summary accuracy with partial data (e.g., only 3 out of 7 days logged).
- Visual regression check for "Enhanced UI" on different mobile screen sizes.
