# LLD-034: Remove a Day from Program

## 1. Overview
Allow the user to delete a day (and all its exercises) from the workout program template via the Program Editor. Existing `WorkoutLog` snapshots that used the deleted day are not affected.

**Related Requirements:** R48
**Related Plan:** PLAN-034

---

## 2. Architecture Design

### Components Affected
- `TemplateService.js` — new `deleteDay(dayId)` method
- `app.js` — program editor render, delete handler
- `css/style.css` — delete button styling (reuse existing danger button style)

### Flow
1. User views Program Editor.
2. Each day header shows a **Delete Day** button (🗑 or text).
3. User taps Delete Day → confirmation dialog appears.
4. On confirm: `templateService.deleteDay(dayId)` is called.
5. Program is persisted; UI re-renders without the deleted day.

---

## 3. Data Model

No schema changes. The `Program` object contains a `days` array:
```json
{
  "days": [
    { "id": "day-1", "name": "Push", "exercises": [...] },
    { "id": "day-2", "name": "Pull", "exercises": [...] }
  ]
}
```
`deleteDay` removes the matching entry from `days` by `id` and saves the updated program.

Existing `WorkoutLog` entries have their own `exercises` snapshot and reference the day only by `dayName` (string) — not by a live reference — so deletion does not break history.

---

## 4. API Design

### TemplateService
```js
/**
 * Removes a day and all its exercises from the program.
 * Does NOT affect existing WorkoutLogs (snapshot immutability).
 * @param {string} dayId
 * @returns {Promise<void>}
 */
async deleteDay(dayId)
```

### Implementation
```js
async deleteDay(dayId) {
  const program = await this.persistence.getProgram();
  program.days = program.days.filter(d => d.id !== dayId);
  await this.persistence.saveProgram(program);
}
```

---

## 5. UI Components

### Delete Day Button (Program Editor day header)
```
┌────────────────────────────────────────────┐
│  💪 Push Day                        [🗑]   │
│  ─────────────────────────────────────────│
│  • DB Chest Press    3×10   30kg  [Edit]  │
│  • Cable Fly         3×12   20kg  [Edit]  │
│  [+ Add Exercise]                          │
└────────────────────────────────────────────┘
```
- The 🗑 button is right-aligned in the day header row.
- Uses existing `btn-danger` / `btn-sm` style classes.
- Confirmation: `confirm('Delete day "Push"? This cannot be undone.')`.

---

## 6. Testing Strategy
- Delete a day from a 4-day program; verify it disappears from the editor.
- Verify the other days are unaffected.
- Verify that existing `WorkoutLog` entries that referenced the deleted day still display correctly in History.
- Verify the change persists after page reload.
