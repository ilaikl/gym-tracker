# LLD-019: Cloud Synchronization and Authentication

## 1. Overview
This design document describes the implementation of:
1.  **User Authentication**: Integration with Firebase Auth using the Google Provider.
2.  **Cloud Synchronization**: A "local-first" synchronization strategy using Firestore as the remote source of truth and backup.
3.  **Data Association**: Ensuring all user-generated data (Workout Logs, Nutrition Logs, Program, Settings, Ingredients) is associated with a unique Firebase UID.

## 2. Architecture Design
The application will follow a **Local-First** synchronization pattern:
-   **Read/Write Path**: All application operations continue to read from and write to the local **IndexedDB** (`PersistenceService`). This ensures zero-latency and full offline capability.
-   **Sync Path**: A background **SyncService** will monitor IndexedDB changes and push them to **Firestore**. It will also pull remote changes from Firestore and merge them into IndexedDB.

### Components:
-   **AuthService**: Handles Firebase Auth initialization, login (Google), logout, and auth state monitoring.
-   **SyncService**: Orchestrates the push/pull logic between IndexedDB and Firestore.
-   **PersistenceService**: Updated to trigger sync events or provide metadata for sync (e.g., `updatedAt` timestamps).
-   **Firebase SDK**: Integrated via CDN or npm (the project uses Webpack, so npm is preferred).

## 3. Data Model Changes

### 3.1 Association with UID
In Firestore, data will be structured under a `users` collection:
-   `users/{uid}/program/default` (Single document for the workout program)
-   `users/{uid}/settings/default` (Single document for user settings)
-   `users/{uid}/workoutLogs/{logId}` (Collection of workout logs)
-   `users/{uid}/nutritionLogs/{logDate}` (Collection of nutrition logs)
-   `users/{uid}/ingredients/{ingredientId}` (Collection of reusable ingredients)

### 3.2 Sync Metadata
Each record in IndexedDB and Firestore should ideally include:
-   `updatedAt`: ISO timestamp of the last modification.
-   `_syncStatus`: (Optional, local only) `synced`, `pending`, `error`.

## 4. API Design

### 4.1 AuthService
-   `signInWithGoogle()`: Launches the Firebase Google Auth popup.
-   `signOut()`: Logs out the user and clears sensitive local state (optionally clearing local data if privacy is a concern, but usually preserved for local-first).
-   `onAuthStateChanged(callback)`: Listens for login/logout events.

### 4.2 SyncService
-   `syncAll()`: Performs a full push/pull sync.
-   `pushChange(store, data)`: Pushes a specific change to Firestore immediately (fire-and-forget).
-   `pullChanges()`: Fetches remote changes since the last sync and merges them.
-   `resolveConflict(local, remote)`: Implements a "Last-Write-Wins" (LWW) strategy based on `updatedAt`.

## 5. UI Components

### 5.1 Authentication UI
-   **Login Screen/Modal**: A prominent "Sign in with Google" button on the first load if not authenticated.
-   **User Profile in Settings**: Display user name/email and a "Sign Out" button in the Data Management section.

### 5.2 Sync Indicators
-   A small status icon (e.g., Cloud check/spinner) to indicate synchronization status.

## 6. Implementation Details

### 6.1 Firebase Integration
-   Install `firebase/app`, `firebase/auth`, and `firebase/firestore`.
-   Initialize Firebase with configuration from environment variables (or a dedicated config file).

### 6.2 The Sync Algorithm (Last-Write-Wins)
1.  **Local Update**: App calls `persistenceService.save(...)`.
2.  **Sync Trigger**: `persistenceService` emits a "changed" event.
3.  **Push**: `SyncService` captures the event and writes the document to Firestore using the `docId`.
4.  **Pull**: On app start (or periodically), `SyncService` queries Firestore for documents where `updatedAt > lastLocalSync`.
5.  **Merge**: For each remote document, if `remote.updatedAt > local.updatedAt`, update IndexedDB.

### 6.3 Initial Migration
When a user signs in for the first time:
-   If Firestore is empty, push all existing local IndexedDB data to Firestore.
-   If Firestore has data but local is empty (new device), pull all Firestore data to IndexedDB.
-   If both have data, perform a merge.

## 7. Security Rules (Firestore)
```
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 8. Testing Strategy
-   **Offline Mode**: Verify that the app works perfectly without internet and syncs once reconnected.
-   **Multi-Device**: Log a workout on one device (or browser tab) and verify it appears on another after a sync.
-   **Auth State**: Verify that data is only accessible when signed in.
-   **Conflict Resolution**: Modify the same record on two devices and ensure the one with the later `updatedAt` wins.
