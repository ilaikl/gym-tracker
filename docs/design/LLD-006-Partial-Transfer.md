# LLD-006: Partial Data Management

## 1. Overview
Reference:
Related Plan Item: PLAN-006
Related Requirements: R5

This design enables modular data portability by allowing users to export and import specific components (Programs and Workout Logs) rather than only the full application state.

## 2. Architecture Design
- **JSONTransferService**: New methods `exportProgram`, `exportHistory`, `importPartial`.
- **PersistenceService**: New `mergeLogs` method to handle incoming workout history without creating duplicates.
- **UI**: New buttons and handlers for the specific import/export actions.

## 3. Data Model Changes
The export JSON format will include a `type` field in the metadata to distinguish between `full`, `program`, and `history`.

### Metadata Extension
```json
{
  "metadata": {
    "appName": "Workout Tracker",
    "type": "program" | "history" | "full",
    "exportedAt": "ISO Date"
  }
}
```

## 4. Logic & Merge Strategy
### Import Program
- Replaces the `program` store with the incoming program template.
- Simple `clearStore('program')` followed by `save`.

### Import History (Merge)
- For each log in the imported list:
  - Check if `id` exists in the local database.
  - If it exists, skip or update based on `updatedAt`.
  - If it doesn't exist, add it.
- This ensures that users can share previous workout logs without corrupting existing ones.

## 5. UI Design
- Add "Export Program" and "Import Program" buttons.
- Add "Export History" and "Import History" buttons.
- Group these under the "Backup / Restore" section.

## 6. Testing Strategy
- Unit test for merge logic: Ensure duplicates are not created.
- Integration test: Verify that importing a program doesn't affect history, and vice versa.
- Edge case: Importing a file with the wrong metadata type should show an error.
