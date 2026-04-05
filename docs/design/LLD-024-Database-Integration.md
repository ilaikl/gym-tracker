# LLD-024: Database Integration

## 1. Overview
Introduce a pre-seeded database of common exercises and food items to simplify user entry and provide a better "out-of-the-box" experience.

## 2. Data Model

### 2.1 Exercise Database (`data/exercises.json`)
Each entry includes:
- `name`: Exercise name.
- `bodyPart`: Target body part.
- `cues`: Performance notes.
- `category`: (e.g., Compound, Isolation).

### 2.2 Food Database (`data/foods.json`)
Each entry includes (per 100g):
- `name`: Food name.
- `calories`: Total kcal.
- `protein`: Protein in g.
- `carbs`: Carbs in g.
- `fat`: Fat in g.

## 3. Implementation Details

### 3.1 External API: USDA FoodData Central
- **Endpoint**: `https://api.nal.usda.gov/fdc/v1/foods/search`
- **Authentication**: `api_key` query parameter.
- **Mapping**:
    - Energy (kcal): `1008` (SR) or `2047` (Branded)
    - Protein: `1003`
    - Fat: `1004`
    - Carbohydrates: `1005`
- **Security**: Store API key in `.env` and inject via Webpack `process.env`.

### 3.2 Loading Logic (Local Database)
- Common exercises will be loaded during app initialization (`AppInitializer.js`) from a pre-defined JSON.

### 3.3 UI Integration
- **Add Ingredient Modal**:
    - Add a "Search Online" toggle or button.
    - Display API results in a selectable list.
    - Map selection to macro inputs.
- **Exercise Editor**: Replace simple text input with a searchable datalist (`<datalist>`) linked to the exercise name input.
- **Auto-fill**: When a user selects an item from the local datalist or API result, the system automatically fills the associated fields.

## 4. Tasks
- [ ] Implement `ExternalApiService.js` for USDA API calls.
- [ ] Create `data/exercises.json` with common exercises.
- [ ] Add `FDC_API_KEY` to `.env` and `webpack.config`.
- [ ] Update "Add Ingredient" modal in `index.html` to support online search.
- [ ] Implement UI logic for FDC search in `app.js`.
- [ ] Update Exercise Editor to use `<datalist>` for common exercises.
