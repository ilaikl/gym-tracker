# LLD-022: Improved Exercise Card UI

## 1. Overview
Redesign the exercise card UI to optimize screen space on mobile. The design uses horizontal layouts for actions in active workouts and a 3-column grid for program details, while ensuring expansion areas (Progress/History) are full-width.

## 2. Design Details

### 2.1 Active Workout Card Layout
- **Container**: Flexbox column.
- **Header**: Flex row with drag handle (`⠿`), exercise name, and delete button.
- **Info Blocks**:
  - `.target-info-block`: Full-width block for target values.
  - `.cues-info-block`: Full-width block for exercise cues.
- **Logged Sets**: Vertical list of inputs.
- **Actions**: `.horizontal-actions` using `display: flex !important` and `flex-direction: row !important`.
  - Buttons have `flex: 1 1 0% !important` to share width equally.
  - `min-width: 80px` for graceful wrapping.

### 2.2 Program Editor Card Layout
- **Main Container**: `display: block !important` (overrides `.exercise-item` flex).
- **Details Row**: `.program-ex-details-row` using `display: grid !important` with `grid-template-columns: 1fr 1fr 1fr !important`.
  - **Column 1 (Name)**: Drag handle and name.
  - **Column 2 (Info)**: Vertical stack of Targets (top) and Cues (bottom).
  - **Column 3 (Actions)**: Vertical column of Edit, Delete, and Progress buttons.
- **Expansion Area**: Inline history/progress container placed **outside** the grid row.
  - This allows it to span the **100% full width** of the card container below the info row.

### 2.3 Visual Standards
- **Robustness**: Extensive use of `!important` to prevent inheritance issues.
- **Consistency**: `box-sizing: border-box` on all containers to ensure width calculations include padding.
- **Accessibility**: Drag handles are preserved as the exclusive interaction point for reordering.

## 3. Implementation
- Updated `renderActiveExercises` in `js/app.js` with `.horizontal-actions` and vertical info stacking.
- Updated `renderProgram` in `js/app.js` with `.program-ex-details-row` and full-width history anchor.
- Applied grid and flex styles in `css/style.css`.
