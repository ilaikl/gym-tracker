# LLD-033: Nutrition Day UI & Data Integrity

## 1. Overview
Four related nutrition improvements:
1. **Fix Nutrition Day UI** — redesign the nutrition day screen for clean, mobile-friendly layout.
2. **Targets Snapshot** — snapshot nutritional targets into each `NutritionLog` at creation time so history is immutable to settings changes.
3. **Delete Nutrition Day** — allow users to delete a day from nutrition history.
4. **Full Nutrition Editing** — inline edit/remove for meals and ingredients with recalculated totals.

**Related Requirements:** R44, R45, R46, R47
**Related Plan:** PLAN-033

---

## 2. Data Model Changes

### NutritionLog — add `targetsSnapshot`
```json
{
  "date": "2026-04-28",
  "status": "active | finished",
  "targetsSnapshot": {
    "training": {
      "calories": { "min": 2200, "max": 2400, "critPlus": 100, "critMinus": 50 },
      "protein":  { "min": 160,  "max": 180,  "critPlus": 20,  "critMinus": 10 },
      "carbs":    { "min": 200,  "max": 250,  "critPlus": 30,  "critMinus": 20 },
      "fats":     { "min": 60,   "max": 80,   "critPlus": 15,  "critMinus": 10 }
    },
    "rest": { ... }
  },
  "meals": [
    {
      "id": "meal-uuid",
      "name": "Breakfast",
      "ingredients": [
        {
          "id": "ing-uuid",
          "name": "Oats",
          "weight": 80,
          "calories": 298,
          "protein": 10,
          "carbs": 54,
          "fats": 5
        }
      ]
    }
  ],
  "totals": { "calories": 0, "protein": 0, "carbs": 0, "fats": 0 }
}
```

**Migration note:** Existing `NutritionLog` entries without `targetsSnapshot` will fall back to reading from current `settings.nutritionTargets` (backward-compatible).

---

## 3. Architecture Design

### Components Affected
- `NutritionService.js` — snapshot logic, delete method, ingredient/meal edit/remove methods
- `PersistenceService.js` — `deleteNutritionLog(date)` (may already exist; verify)
- `app.js` — nutrition day render, history render, edit/delete handlers
- `css/style.css` — nutrition day layout overhaul

---

## 4. API Design

### NutritionService (new / updated methods)
```js
/**
 * Create a new NutritionLog, snapshotting current targets.
 * Updated version of existing createDailyLog.
 */
async createDailyLog(date, settings)
// Internally: log.targetsSnapshot = deepClone(settings.nutritionTargets)

/**
 * Delete a NutritionLog by date.
 */
async deleteNutritionLog(date)

/**
 * Update an ingredient within a meal.
 */
async updateIngredient(date, mealId, ingredientId, updatedData)

/**
 * Remove an ingredient from a meal.
 */
async removeIngredient(date, mealId, ingredientId)

/**
 * Update a meal's name.
 */
async updateMealName(date, mealId, newName)

/**
 * Remove an entire meal from a log.
 */
async removeMeal(date, mealId)
```

All mutating methods must call `recalcTotals(log)` and persist via `PersistenceService`.

### recalcTotals (internal helper)
```js
function recalcTotals(log) {
  const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
  for (const meal of log.meals) {
    for (const ing of meal.ingredients) {
      totals.calories += ing.calories ?? 0;
      totals.protein  += ing.protein  ?? 0;
      totals.carbs    += ing.carbs    ?? 0;
      totals.fats     += ing.fats     ?? 0;
    }
  }
  log.totals = totals;
}
```

### Evaluation (updated)
```js
// NutritionService.evaluateStatus — prefer targetsSnapshot if available
const targets = log.targetsSnapshot ?? settings.nutritionTargets;
```

---

## 5. UI Components

### 5.1 Nutrition Day Screen Layout (redesigned)

```
┌──────────────────────────────────────┐
│  📅 Monday, April 28                 │
│  [Training Day]                      │
│──────────────────────────────────────│
│  MACROS SUMMARY                      │
│  Calories  1840 / 2200–2400  🟡      │
│  Protein    145 / 160–180    🔴      │
│  Carbs      210 / 200–250    🟢      │
│  Fats        62 / 60–80      🟢      │
│──────────────────────────────────────│
│  🍳 Breakfast            [Edit][✕]   │
│  ┌──────────────────────────────┐   │
│  │ Oats 80g   298cal 10P 54C 5F │✏✕│
│  │ Banana 1pc  89cal  1P 23C 0F │✏✕│
│  └──────────────────────────────┘   │
│  [+ Add Ingredient]                  │
│                                      │
│  🥗 Lunch               [Edit][✕]   │
│  ...                                 │
│──────────────────────────────────────│
│  [+ Add Meal]    [✔ Finish Day]      │
└──────────────────────────────────────┘
```

Key layout rules:
- Macro summary card at top with colour indicators.
- Each meal is a card with a header (name + Edit/Remove buttons) and ingredient rows.
- Each ingredient row shows: name, weight, calories, P/C/F inline — with Edit (✏) and Remove (✕) icon buttons.
- "Add Ingredient" button sits at the bottom of each meal card.
- "Add Meal" and "Finish Day" are full-width buttons in a sticky footer or bottom of page.

### 5.2 Nutrition History Row — Delete Button
```
┌─────────────────────────────────────────────┐
│ 📅 2026-04-28  Cal 1840🟡  P 145🔴  [🗑]   │
└─────────────────────────────────────────────┘
```
- Delete button (🗑) triggers a confirmation dialog before calling `deleteNutritionLog`.

### 5.3 Ingredient Edit Modal (reuse existing add-ingredient modal)
Pre-fill all fields from the existing ingredient data. On save, call `updateIngredient`.

### 5.4 Meal Name Edit
Inline or small modal: single input for meal name. On save, call `updateMealName`.

---

## 6. CSS Changes (`css/style.css`)

```css
/* Macro summary card */
.nutrition-summary-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px;
  background: var(--card-bg);
  border-radius: 8px;
  margin-bottom: 12px;
}

/* Meal card */
.meal-card {
  background: var(--card-bg);
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}
.meal-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-weight: 600;
}

/* Ingredient row */
.ingredient-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
}
.ingredient-macros {
  color: var(--text-muted);
  font-size: 0.78rem;
}
.ingredient-actions {
  display: flex;
  gap: 6px;
}
```

---

## 7. Testing Strategy
- Create a nutrition log; verify `targetsSnapshot` is stored on the log.
- Change nutritional targets in settings; verify the historical log still evaluates against the original snapshot.
- Delete a nutrition day from history; verify it is removed and history list updates.
- Edit an ingredient weight; verify daily totals recalculate correctly.
- Remove a meal; verify its ingredients are excluded from totals.
- Verify backward compatibility: logs without `targetsSnapshot` still display correctly using current settings.
