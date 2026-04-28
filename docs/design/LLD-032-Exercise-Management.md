# LLD-032: Exercise Management Improvements

## 1. Overview
Four related improvements to the exercise management system:
1. **Cues on manual exercise** — add a Notes/Cues field to the manual exercise creation form.
2. **Manual exercises in global library** — persist manually created exercises to the `exercises` IndexedDB store so they are reusable.
3. **API Ninjas import script** — one-time Node.js script to populate `data/exercises.json` from API Ninjas, seeded into IndexedDB at app init.
4. **Categorised exercise browser** — replace the flat datalist with a grouped, collapsible modal organised by muscle category.

**Related Requirements:** R40, R41, R42, R43
**Related Plan:** PLAN-032

---

## 2. Data Model

### Exercise Record (exercises IndexedDB store)
```json
{
  "id": "uuid-or-slug",
  "name": "Incline DB Press",
  "muscle": "chest",
  "type": "strength",
  "difficulty": "intermediate",
  "instructions": "Step-by-step execution...",
  "safetyTips": "Keep elbows at 45°...",
  "equipments": ["dumbbells", "incline bench"],
  "notes": "User-added cues here",
  "source": "manual | imported | seeded",
  "defaultWeight": 0,
  "targetSets": 3,
  "targetReps": 10,
  "createdAt": "ISO timestamp"
}
```
- `source: "manual"` for user-created exercises.
- `source: "imported"` for API Ninjas entries.
- `source: "seeded"` for exercises bundled in `data/exercises.json`.

---

## 3. Architecture Design

### Components Affected
- `scripts/importExercises.js` — new one-time Node.js script
- `data/exercises.json` — output of import script, bundled with app
- `AppInitializer.js` — seeds `exercises` store from JSON on first run
- `PersistenceService.js` — new `saveExercise`, `getExercisesByMuscle`, `getAllExercises` methods
- `app.js` — manual exercise form, exercise picker modal
- `css/style.css` — category modal styles

### Flow: Import Script (one-time, dev-only)
```
scripts/importExercises.js
  → API Ninjas GET /v1/exercises?muscle={muscle}  (per muscle group)
  → Normalise to Exercise schema
  → Deduplicate by (name.toLowerCase() + muscle)
  → Write data/exercises.json
```

### Flow: App Init Seeding
```
AppInitializer.init()
  → Check if exercises store is empty
  → If empty: fetch data/exercises.json → PersistenceService.bulkSaveExercises(exercises)
```

### Flow: Manual Exercise Creation
```
User fills "Add Manual Exercise" form (including Notes/Cues)
  → app.js buildExerciseFromForm()
  → PersistenceService.saveExercise(exercise)   ← NEW
  → exercise also added to program day / active workout as before
```

### Flow: Categorised Exercise Picker
```
User taps "Add Exercise" (program editor or active workout)
  → app.js openExercisePicker()
  → PersistenceService.getAllExercises()
  → Group by muscle
  → Render collapsible category modal
  → User taps exercise → auto-fill form fields
```

---

## 4. API Design

### PersistenceService (new methods)
```js
/**
 * Save or update a single exercise in the exercises store.
 */
async saveExercise(exercise)   // upsert by id

/**
 * Bulk insert exercises (used by AppInitializer seeding).
 */
async bulkSaveExercises(exercises)

/**
 * Get all exercises for a specific muscle group.
 */
async getExercisesByMuscle(muscle)   // returns Exercise[]

/**
 * Get all exercises, optionally sorted by name.
 */
async getAllExercises()   // returns Exercise[]
```

---

## 5. Import Script Design

### File: `scripts/importExercises.js`
```js
// Usage: node scripts/importExercises.js
const API_KEY = 'sFeGow4Le4WufapW6eHku4HqjwMqPmbWogyOiKMu';
const BASE_URL = 'https://api.api-ninjas.com/v1/exercises';
const MUSCLES = ['chest','back','biceps','triceps','shoulders','quadriceps','hamstrings','glutes','abdominals','calves'];

async function fetchExercises(muscle) { ... }
function normalise(apiEx, muscle) {
  return {
    id: slugify(apiEx.name + '-' + muscle),
    name: apiEx.name,
    muscle,
    type: apiEx.type,
    difficulty: apiEx.difficulty,
    instructions: apiEx.instructions,
    safetyTips: apiEx.safety_info || '',
    equipments: apiEx.equipments || [],
    notes: '',
    source: 'imported',
    defaultWeight: 0,
    targetSets: 3,
    targetReps: 10,
    createdAt: new Date().toISOString(),
  };
}
// Deduplicate, write to data/exercises.json
```

---

## 6. UI Components

### 6.1 Manual Exercise Form — Cues Field
Add to existing manual exercise form (both in program editor and active workout add-exercise flow):
```html
<div class="form-group">
  <label for="ex-notes">Notes / Cues</label>
  <textarea id="ex-notes" rows="2" placeholder="Form tips, safety cues..."></textarea>
</div>
```

### 6.2 Categorised Exercise Picker Modal
```
┌──────────────────────────────────────┐
│  🔍 [Search exercises...]            │
│──────────────────────────────────────│
│  ▶ Chest (12)                        │
│  ▼ Back (18)                         │
│    • Barbell Row                     │
│    • Lat Pulldown                    │
│    • Seated Cable Row                │
│  ▶ Biceps (9)                        │
│  ▶ Triceps (8)                       │
│  ▶ Shoulders (11)                    │
│  ▶ Legs (22)                         │
│  ▶ Manual / My Exercises (3)         │
│──────────────────────────────────────│
│              [Cancel]                │
└──────────────────────────────────────┘
```
- Search filters across all categories in real-time.
- Each category row toggles its exercise list.
- "Manual / My Exercises" section always appears at top or bottom with user-created exercises.
- Tapping an exercise auto-fills name, muscle, cues, and default targets into the add-exercise form.

---

## 7. AppInitializer Seeding Logic
```js
// AppInitializer.js
async seedExercisesIfEmpty() {
  const count = await this.persistence.countExercises();
  if (count === 0) {
    const response = await fetch('./data/exercises.json');
    const exercises = await response.json();
    await this.persistence.bulkSaveExercises(exercises);
  }
}
```

---

## 8. Testing Strategy
- Run import script; verify `data/exercises.json` contains entries for all muscle groups, no duplicates.
- On first app load (empty exercises store), verify exercises are seeded from JSON.
- Create a manual exercise with cues; verify it appears in the "My Exercises" section of the picker.
- Open exercise picker; verify exercises are grouped by muscle category.
- Search for "row"; verify results appear across categories.
- Select an exercise from picker; verify name, muscle, and cues are auto-filled in the form.
