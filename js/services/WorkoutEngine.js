import { persistenceService } from './PersistenceService.js';

/**
 * WorkoutEngine - Logic for workout logging and snapshotting.
 * (PLAN-003 | R2, R4 | LLD-003)
 */
class WorkoutEngine {
    /**
     * Creates a new WorkoutLog from a ProgramDay template.
     * Performs a deep clone (snapshot) of the template data.
     */
    async createLogFromTemplate(dayTemplate, date = new Date().toISOString().split('T')[0]) {
        const logId = `workout_${date}_${dayTemplate.id}_${Date.now()}`;

        const workoutLog = {
            id: logId,
            date: date,
            programId: 'main_program', // Assuming single program for now
            dayTemplateId: dayTemplate.id,
            dayName: dayTemplate.name,
            bodyParts: [...dayTemplate.bodyParts],
            status: 'draft',
            startedAt: new Date().toISOString(),
            endedAt: null,
            exercises: dayTemplate.exercises.map(ex => this.snapshotExercise(ex)),
            generalNotes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await persistenceService.save('workoutLogs', workoutLog);
        return workoutLog;
    }

    /**
     * Snapshots an exercise template into a logged exercise.
     */
    snapshotExercise(ex) {
        return {
            id: `log_ex_${Date.now()}_${ex.id}`,
            templateExerciseId: ex.id,
            name: ex.name,
            bodyPartPrimary: ex.bodyPartPrimary,
            bodyPartSecondary: [...ex.bodyPartSecondary],
            targetSnapshot: {
                defaultWeight: { ...ex.defaultWeight },
                repGoalType: ex.repGoalType,
                targetSets: ex.targetSets.map(s => ({ ...s })),
                notes: ex.notes // Keep as string
            },
            // Pre-generate actual sets based on target sets
            actualSets: ex.targetSets.map(s => ({
                setNumber: s.setNumber,
                targetReps: s.targetReps || s.maxReps || 0,
                actualReps: null,
                targetWeight: ex.defaultWeight.value,
                actualWeight: ex.defaultWeight.value,
                unit: ex.defaultWeight.unit,
                isCompleted: false,
                notes: ''
            })),
            exerciseNotes: '',
            displayOrder: ex.displayOrder
        };
    }

    /**
     * Updates a specific set in a workout log.
     */
    async updateSet(logId, exerciseId, setIndex, updates) {
        const log = await persistenceService.getById('workoutLogs', logId);
        if (!log) throw new Error('Workout log not found');

        const exercise = log.exercises.find(e => e.id === exerciseId);
        if (!exercise) throw new Error('Exercise not found in log');

        exercise.actualSets[setIndex] = { ...exercise.actualSets[setIndex], ...updates };
        log.updatedAt = new Date().toISOString();

        await persistenceService.save('workoutLogs', log);
        return log;
    }

    /**
     * Adds a new set row to an exercise in a workout log.
     */
    async addSet(logId, exerciseId) {
        const log = await persistenceService.getById('workoutLogs', logId);
        if (!log) throw new Error('Workout log not found');

        const exercise = log.exercises.find(e => e.id === exerciseId);
        if (!exercise) throw new Error('Exercise not found in log');

        const lastSet = exercise.actualSets[exercise.actualSets.length - 1];
        const newSetNumber = (lastSet ? lastSet.setNumber : 0) + 1;

        const newSet = {
            setNumber: newSetNumber,
            targetReps: lastSet ? lastSet.targetReps : 0,
            actualReps: null,
            targetWeight: lastSet ? lastSet.targetWeight : 0,
            actualWeight: lastSet ? lastSet.actualWeight : 0,
            unit: lastSet ? lastSet.unit : 'kg',
            isCompleted: false,
            notes: ''
        };

        exercise.actualSets.push(newSet);
        log.updatedAt = new Date().toISOString();

        await persistenceService.save('workoutLogs', log);
        return log;
    }

    /**
     * Removes the last set row from an exercise in a workout log.
     */
    async removeLastSet(logId, exerciseId) {
        const log = await persistenceService.getById('workoutLogs', logId);
        if (!log) throw new Error('Workout log not found');

        const exercise = log.exercises.find(e => e.id === exerciseId);
        if (!exercise) throw new Error('Exercise not found in log');

        if (exercise.actualSets.length > 0) {
            exercise.actualSets.pop();
            log.updatedAt = new Date().toISOString();
            await persistenceService.save('workoutLogs', log);
        }
        return log;
    }

    /**
     * Removes an exercise from a workout log.
     */
    async removeExercise(logId, exerciseId) {
        const log = await persistenceService.getById('workoutLogs', logId);
        if (!log) throw new Error('Workout log not found');

        log.exercises = log.exercises.filter(e => e.id !== exerciseId);
        log.updatedAt = new Date().toISOString();

        await persistenceService.save('workoutLogs', log);
        return log;
    }

    /**
     * Adds an extra exercise to an active workout log.
     */
    async addExtraExercise(logId, exerciseTemplate) {
        const log = await persistenceService.getById('workoutLogs', logId);
        if (!log) throw new Error('Workout log not found');

        const loggedEx = this.snapshotExercise(exerciseTemplate);
        loggedEx.displayOrder = log.exercises.length + 1;

        log.exercises.push(loggedEx);
        log.updatedAt = new Date().toISOString();

        await persistenceService.save('workoutLogs', log);
        return log;
    }

    /**
     * Completes a workout log.
     */
    async completeWorkout(logId) {
        const log = await persistenceService.getById('workoutLogs', logId);
        if (!log) throw new Error('Workout log not found');

        log.status = 'completed';
        log.endedAt = new Date().toISOString();
        log.updatedAt = new Date().toISOString();

        await persistenceService.save('workoutLogs', log);
        return log;
    }

    /**
     * Retrieves all workout logs.
     */
    async getAllLogs() {
        return await persistenceService.getAll('workoutLogs');
    }

    /**
     * Retrieves a workout log by ID.
     */
    async getLogById(logId) {
        return await persistenceService.getById('workoutLogs', logId);
    }

    /**
     * Deletes a workout log.
     */
    async deleteWorkoutLog(logId) {
        await persistenceService.delete('workoutLogs', logId);
    }

    /**
     * Promotes the actual performance from a logged exercise to the program template.
     * (PLAN-008 | R14 | LLD-008)
     */
    async promoteToTarget(logExercise, templateService, syncAcrossDays = false) {
        if (!logExercise.templateExerciseId) {
            throw new Error('This exercise is not linked to a program template.');
        }

        // 1. Prepare new target data based on actuals
        const lastWeight = logExercise.actualSets.length > 0
            ? (logExercise.actualSets[logExercise.actualSets.length - 1].actualWeight || 0)
            : 0;

        const lastUnit = logExercise.actualSets.length > 0
            ? (logExercise.actualSets[logExercise.actualSets.length - 1].unit || 'kg')
            : 'kg';

        const newTargetSets = logExercise.actualSets.map(s => ({
            setNumber: s.setNumber,
            targetReps: s.actualReps || s.targetReps || 0
        }));

        const newData = {
            defaultWeight: {
                value: lastWeight,
                unit: lastUnit,
                label: 'Promoted from history'
            },
            targetSets: newTargetSets
        };

        // 2. Find the dayId for this exercise in the template
        const program = await templateService.getProgram();
        let targetDayId = null;

        for (const day of program.days) {
            if (day.exercises.some(e => e.id === logExercise.templateExerciseId)) {
                targetDayId = day.id;
                break;
            }
        }

        if (!targetDayId) {
            throw new Error('Could not find the original day in the template.');
        }

        // 3. Update the template
        await templateService.updateExercise(targetDayId, logExercise.templateExerciseId, newData, syncAcrossDays);
    }
}

export const workoutEngine = new WorkoutEngine();
