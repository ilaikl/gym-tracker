# LLD-001 - Data Persistence and JSON Infrastructure

## 1. Overview
**Reference:**
- Related Plan Item: PLAN-001
- Related Requirements: R5

## 2. Architecture Design
### Component responsibilities
- **`PersistenceService`**: A wrapper around IndexedDB for CRUD operations. It manages the storage and retrieval of programs, logs, and settings.
- **`JSONTransferService`**: Handles the conversion of the entire application state to a JSON string for export and the restoration from a JSON string.

### Interaction diagrams
- **Storage Flow**: UI -> `PersistenceService` -> IndexedDB.
- **Export Flow**: UI -> `PersistenceService` (fetch all) -> `JSONTransferService` (stringify) -> File Download.

## 3. Data Model Changes
The top-level JSON structure (used for both export and internal state management):
```json
{
  "metadata": {
    "appName": "Workout Tracker",
    "schemaVersion": 1,
    "exportedAt": "ISO-8601 String"
  },
  "program": { "id": "main_program", ... },
  "workoutLogs": [],
  "settings": {
    "units": { "weight": "kg" },
    "language": "he"
  }
}
```

IndexedDB Object Stores:
- `program`: (key: `id`)
- `workoutLogs`: (key: `id`, index: `date`, `templateExerciseId`)
- `settings`: (single document)

## 4. API Design (Internal)
`PersistenceService`:
- `async save(store, data)`: Generic save/update.
- `async getAll(store)`: Retrieve all items from a store.
- `async getById(store, id)`: Retrieve single item.
- `async delete(store, id)`: Remove item.
- `async replaceAll(fullState)`: For JSON import.

## 5. Internal Class Design
### `PersistenceManager`
- `db`: reference to IndexedDB.
- `init()`: Opens the database and creates object stores if missing.

## 6. Concurrency & Consistency
- **IndexedDB Transactions**: Use read-write transactions for all updates.
- **Atomic Import**: The `replaceAll` operation should clear all stores before populating to maintain consistency.

## 7. Error Handling Strategy
- Check for IndexedDB support in the browser.
- Catch errors during file reading and JSON parsing in `JSONTransferService`.
- Provide user-friendly alerts if a JSON file is invalid.

## 8. Observability
- `console.info` for successful saves.
- `console.error` for database transaction failures.

## 9. Security Considerations
- JSON import should validate the schema to prevent injection or crashes from malformed files.
- No sensitive data is stored; all data remains on-device.

## 10. Testing Strategy
- **Unit test**: Test `JSONTransferService` with valid and invalid JSON.
- **Integration test**: Verify IndexedDB storage persistency across browser reloads.
- **Edge cases**: Empty database export, very large JSON import.
