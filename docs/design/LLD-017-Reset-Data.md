# LLD-017: History and Program Reset

## 1. Overview
This document details the design for the "Reset All Data" feature. This feature allows users to wipe their workout and nutrition history and restore the application's program and settings to their default seeded states.

## 2. User Flow
1.  User navigates to the **Data Management** section (Settings).
2.  User clicks the **Reset All Data** button.
3.  A confirmation dialog appears: "Are you sure you want to reset all history and the program? This action cannot be undone."
4.  If confirmed, the application:
    -   Clears `workoutLogs` store.
    -   Clears `nutritionLogs` store.
    -   Clears `program` store.
    -   Clears `settings` store (or resets specific keys).
    -   Re-initializes the default program and settings using `AppInitializer`.
    -   Reloads the page or triggers a full UI refresh.

## 3. Implementation Details

### 3.1 Persistence Layer (`PersistenceService.js`)
-   The `PersistenceService` already has a `clearStore(storeName)` method which will be used to empty the stores.
-   Stores to be cleared: `program`, `workoutLogs`, `nutritionLogs`, `settings`.
-   Note: `ingredients` database will be preserved to avoid losing custom entries, as per the usual interpretation of "history" vs "library", but if the user wants a *full* reset, we could clear it too. Given the prompt "reset all workout, or nutrition, data history (program back to the default)", it implies history and templates. I will keep ingredients unless they cause issues, but likely clearing them is safer for a "clean slate".

### 3.2 Logic Layer (`app.js`)
-   Implement a function `handleFullReset()`:
    ```javascript
    async function handleFullReset() {
        if (!confirm('Are you sure you want to reset all workout and nutrition history? This will also revert your program to the default template. This action cannot be undone.')) {
            return;
        }

        // Final confirmation for such a destructive action
        if (!confirm('FINAL WARNING: This will permanently delete ALL your logs. Proceed?')) {
            return;
        }

        try {
            await persistenceService.clearStore('workoutLogs');
            await persistenceService.clearStore('nutritionLogs');
            await persistenceService.clearStore('program');
            await persistenceService.clearStore('settings');
            // Re-seed
            await appInitializer.init();

            alert('Data reset successful. The app will now reload.');
            window.location.reload();
        } catch (error) {
            console.error('Reset failed:', error);
            alert('Failed to reset data. See console for details.');
        }
    }
    ```

### 3.3 UI Layer (`index.html`)
-   Add the button in the Data Management section:
    ```html
    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
      <h3 style="color: #c0392b;">Danger Zone</h3>
      <p style="font-size: 0.9em; color: #666;">Reset all workout and nutrition history and restore the default program.</p>
      <button id="reset-all-data-btn" style="background-color: #e74c3c; color: white; border: none; padding: 10px 15px; border-radius: 4px; width: 100%; font-weight: bold;">
        Reset All Data (History & Program)
      </button>
    </div>
    ```

## 4. Risks and Considerations
-   **Accidental Data Loss**: Mitigation via double-confirmation dialogs.
-   **UI State**: A full page reload (`window.location.reload()`) is the safest way to ensure all in-memory state is cleared and re-initialized from the new (default) database state.
-   **Ingredient Database**: I will also clear the `ingredients` store to ensure a truly fresh start, as some default ingredients might be re-seeded or modified in future versions.

## 5. Acceptance Criteria
-   [ ] Button exists in Data Management.
-   [ ] Clicking button triggers confirmation prompts.
-   [ ] After confirmation, `workoutLogs`, `nutritionLogs`, `program`, and `settings` are cleared.
-   [ ] Default program and nutrition targets are re-seeded.
-   [ ] App reloads and shows the default state.
