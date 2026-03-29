import { persistenceService } from './PersistenceService.js';

/**
 * JSONTransferService - Handles export and import of application data.
 * (PLAN-001 | R5 | LLD-001)
 */
class JSONTransferService {
    /**
     * Exports the entire application state as a JSON file.
     */
    async exportData() {
        try {
            const program = await persistenceService.getAll('program');
            const workoutLogs = await persistenceService.getAll('workoutLogs');
            const settings = await persistenceService.getById('settings', 'current');

            const fullState = {
                metadata: {
                    appName: 'Workout Tracker',
                    schemaVersion: 1,
                    exportedAt: new Date().toISOString()
                },
                program: program[0] || null, // Assuming one active program as per LLD
                workoutLogs: workoutLogs,
                settings: settings || {}
            };

            const jsonString = JSON.stringify(fullState, null, 2);
            this.downloadJSON(jsonString, `workout-tracker-export-${new Date().toISOString().split('T')[0]}.json`);

            console.info('JSONTransferService: Data exported successfully.');
        } catch (error) {
            console.error('JSONTransferService: Export failed', error);
            throw error;
        }
    }

    /**
     * Exports the workout program only.
     */
    async exportProgram() {
        try {
            const program = await persistenceService.getAll('program');
            const fullState = {
                metadata: {
                    appName: 'Workout Tracker',
                    type: 'program',
                    schemaVersion: 1,
                    exportedAt: new Date().toISOString()
                },
                program: program[0] || null
            };
            const jsonString = JSON.stringify(fullState, null, 2);
            this.downloadJSON(jsonString, `workout-program-${new Date().toISOString().split('T')[0]}.json`);
            console.info('JSONTransferService: Program exported successfully.');
        } catch (error) {
            console.error('JSONTransferService: Program export failed', error);
            throw error;
        }
    }

    /**
     * Exports workout history only.
     */
    async exportHistory() {
        try {
            const workoutLogs = await persistenceService.getAll('workoutLogs');
            const fullState = {
                metadata: {
                    appName: 'Workout Tracker',
                    type: 'history',
                    schemaVersion: 1,
                    exportedAt: new Date().toISOString()
                },
                workoutLogs: workoutLogs
            };
            const jsonString = JSON.stringify(fullState, null, 2);
            this.downloadJSON(jsonString, `workout-history-${new Date().toISOString().split('T')[0]}.json`);
            console.info('JSONTransferService: History exported successfully.');
        } catch (error) {
            console.error('JSONTransferService: History export failed', error);
            throw error;
        }
    }

    /**
     * Exports a single workout log.
     * @param {Object} log
     */
    async exportWorkoutLog(log) {
        try {
            const fullState = {
                metadata: {
                    appName: 'Workout Tracker',
                    type: 'workout_log',
                    schemaVersion: 1,
                    exportedAt: new Date().toISOString()
                },
                workoutLogs: [log] // Import logic for history/merge will handle single log in array
            };
            const jsonString = JSON.stringify(fullState, null, 2);
            this.downloadJSON(jsonString, `workout-log-${log.date}-${log.id}.json`);
            console.info('JSONTransferService: Individual log exported successfully.');
        } catch (error) {
            console.error('JSONTransferService: Individual log export failed', error);
            throw error;
        }
    }

    /**
     * Triggers a browser download of the JSON string.
     */
    downloadJSON(content, fileName) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Imports application state from a JSON file.
     * @param {File} file
     */
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const fullState = JSON.parse(event.target.result);

                    // Basic validation
                    if (!fullState.metadata || fullState.metadata.appName !== 'Workout Tracker') {
                        throw new Error('Invalid backup file: Missing or incorrect metadata.');
                    }

                    const type = fullState.metadata.type || 'full';

                    if (type === 'program') {
                        if (fullState.program) {
                            await persistenceService.save('program', fullState.program);
                            console.info('JSONTransferService: Program imported successfully.');
                        }
                    } else if (type === 'history' || type === 'workout_log') {
                        if (fullState.workoutLogs) {
                            await persistenceService.mergeLogs(fullState.workoutLogs);
                            console.info('JSONTransferService: History merged successfully.');
                        }
                    } else {
                        // Full import (replace all)
                        await persistenceService.replaceAll(fullState);
                        console.info('JSONTransferService: Full data replaced successfully.');
                    }

                    resolve(fullState);
                } catch (error) {
                    console.error('JSONTransferService: Import failed', error);
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }
}

export const jsonTransferService = new JSONTransferService();
