import { persistenceService } from './PersistenceService.js';

/**
 * ProgressionService - Aggregates workout logs for exercise tracking and history.
 * (PLAN-004 | R6 | LLD-004)
 */
class ProgressionService {
    /**
     * Retrieves all workout logs, sorted by date (descending).
     */
    async getAllHistory() {
        const logs = await persistenceService.getAll('workoutLogs');
        return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * Retrieves history for a specific exercise template ID.
     */
    async getExerciseHistory(templateExerciseId) {
        const logs = await this.getAllHistory();
        const history = [];

        for (const log of logs) {
            const exercises = log.exercises.filter(ex => ex.templateExerciseId === templateExerciseId);
            for (const exercise of exercises) {
                if (exercise.actualSets && exercise.actualSets.length > 0) {
                    history.push({
                        date: log.date,
                        logId: log.id,
                        name: exercise.name,
                        actualSets: exercise.actualSets,
                        status: log.status
                    });
                }
            }
        }

        return history;
    }

    /**
     * Retrieves the most recent N performances for an exercise.
     * (PLAN-008 | R12 | LLD-008)
     */
    async getRecentHistory(templateExerciseId, limit = 5) {
        const history = await this.getExerciseHistory(templateExerciseId);
        return history.slice(0, limit);
    }

    /**
     * Filters logs by various criteria.
     */
    async filterLogs(criteria = {}) {
        let logs = await this.getAllHistory();

        if (criteria.bodyPart) {
            logs = logs.filter(log => log.bodyParts.includes(criteria.bodyPart));
        }

        if (criteria.status) {
            logs = logs.filter(log => log.status === criteria.status);
        }

        if (criteria.dayTemplateId) {
            logs = logs.filter(log => log.dayTemplateId === criteria.dayTemplateId);
        }

        return logs;
    }
}

export const progressionService = new ProgressionService();
