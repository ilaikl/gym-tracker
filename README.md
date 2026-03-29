# Workout Tracker App

A local-first, mobile-optimized workout tracking application designed for ease of use during training.

## Key Features

- **Local-First Persistence**: Data is stored on-device using IndexedDB (no internet required for daily use).
- **Snapshot-Based Logging**: Workouts are created as snapshots of your program, preserving history even if you change the program later.
- **Dynamic Workouts**: Add/remove sets and exercises on the fly while training.
- **Progression Tracking**: View history for specific exercises directly from the program editor.
- **Data Portability**: Import and export your data as JSON files.

## Application Architecture

The app follows a clear separation between:
1. **Program (Template)**: Your fixed weekly training plan.
2. **Workout Log (History)**: Snapshots of workouts performed on specific dates.

## Import / Export (JSON Formats)

The app supports three types of JSON data management through a single **Regular Import** button. The system automatically detects the file type based on internal metadata.

### 1. Full Backup (Replace All)
Replaces the entire application state (Program, History, and Settings).

**Example Structure:**
```json
{
  "metadata": {
    "appName": "Workout Tracker",
    "schemaVersion": 1,
    "exportedAt": "2026-03-29T20:00:00Z"
  },
  "program": {
    "id": "main_program",
    "days": [...]
  },
  "workoutLogs": [...],
  "settings": {
    "units": { "weight": "kg" }
  }
}
```

### 2. Workout History (Merge)
Merges historical logs into your existing database. It will add new logs and update existing ones if the incoming version is newer.

**Example Structure:**
```json
{
  "metadata": {
    "appName": "Workout Tracker",
    "type": "history",
    "exportedAt": "2026-03-29T20:00:00Z"
  },
  "workoutLogs": [
    {
      "id": "workout_2026-03-29_day_1_push_1711741620000",
      "date": "2026-03-29",
      "dayName": "יום 1 – Push",
      "status": "completed",
      "exercises": [...]
    }
  ]
}
```

### 3. Workout Program (Replace Template)
Replaces your current training program with a new one. This does **not** affect your history.

**Example Structure:**
```json
{
  "metadata": {
    "appName": "Workout Tracker",
    "type": "program",
    "exportedAt": "2026-03-29T20:00:00Z"
  },
  "program": {
    "id": "main_program",
    "name": "תוכנית חדשה",
    "days": [...]
  }
}
```

## Setup and Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Local Installation
1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
To start the development server:
```bash
npm start
```
The app will be available at `http://localhost:8080`.

### Building for Deployment
To generate the production-ready `dist` folder:
```bash
npm run build
```

### Deploying to GitHub Pages
To build and deploy to the `gh-pages` branch:
```bash
npm run deploy
```

## Important Notes
- **Browser Specific**: Your data is stored in the browser's local storage (IndexedDB). If you clear your browser data or use "Incognito" mode, your workouts might be lost unless you have a JSON backup.
- **PWA Support**: On mobile, use "Add to Home Screen" in Chrome (Android) or Safari (iOS) to install the app for a native-like offline experience.
