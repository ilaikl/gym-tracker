import { persistenceService } from './PersistenceService.js';

/**
 * TemplateService - Logic for managing the workout program template.
 * (PLAN-002 | R1 | LLD-002)
 */
class TemplateService {
    /**
     * Retrieves the current active program.
     */
    async getProgram() {
        const programs = await persistenceService.getAll('program');
        return programs[0] || null;
    }

    /**
     * Saves the program template.
     */
    async saveProgram(program) {
        program.updatedAt = new Date().toISOString();
        return await persistenceService.save('program', program);
    }

    /**
     * Adds a new day to the program.
     */
    async addDay(dayData) {
        const program = await this.getProgram();
        if (!program) throw new Error('No program found');

        const newDay = {
            id: `day_${Date.now()}`,
            order: program.days.length + 1,
            name: dayData.name || 'New Day',
            type: dayData.type || 'other',
            bodyParts: dayData.bodyParts || [],
            isRestDay: dayData.isRestDay || false,
            exercises: []
        };

        program.days.push(newDay);
        await this.saveProgram(program);
        return newDay;
    }

    /**
     * Updates an existing day in the program.
     */
    async updateDay(dayId, newData) {
        const program = await this.getProgram();
        const dayIndex = program.days.findIndex(d => d.id === dayId);
        if (dayIndex === -1) throw new Error('Day not found');

        program.days[dayIndex] = { ...program.days[dayIndex], ...newData };
        await this.saveProgram(program);
    }

    /**
     * Adds an exercise to a specific day.
     */
    async addExercise(dayId, exerciseData) {
        const program = await this.getProgram();
        const day = program.days.find(d => d.id === dayId);
        if (!day) throw new Error('Day not found');

        const newExercise = {
            id: `ex_${Date.now()}`,
            name: exerciseData.name || 'New Exercise',
            bodyPartPrimary: exerciseData.bodyPartPrimary || '',
            bodyPartSecondary: exerciseData.bodyPartSecondary || [],
            category: exerciseData.category || 'isolation',
            equipment: exerciseData.equipment || '',
            defaultWeight: exerciseData.defaultWeight || { value: 0, unit: 'kg', label: '' },
            targetSets: exerciseData.targetSets || [],
            repGoalType: exerciseData.repGoalType || 'fixed',
            notes: exerciseData.notes || [],
            progressionRule: exerciseData.progressionRule || {},
            isOptional: exerciseData.isOptional || false,
            isActive: true,
            displayOrder: day.exercises.length + 1
        };

        day.exercises.push(newExercise);
        await this.saveProgram(program);
        return newExercise;
    }

    /**
     * Updates an existing exercise in a specific day.
     */
    async updateExercise(dayId, exerciseId, newData, syncAcrossDays = false) {
        const program = await this.getProgram();

        if (syncAcrossDays) {
            // Update all instances of this exercise ID across all days
            for (const day of program.days) {
                const exIndex = day.exercises.findIndex(e => e.id === exerciseId);
                if (exIndex !== -1) {
                    day.exercises[exIndex] = { ...day.exercises[exIndex], ...newData };
                }
            }
        } else {
            // Update only in the specified day
            const day = program.days.find(d => d.id === dayId);
            if (!day) throw new Error('Day not found');

            const exIndex = day.exercises.findIndex(e => e.id === exerciseId);
            if (exIndex === -1) throw new Error('Exercise not found');

            day.exercises[exIndex] = { ...day.exercises[exIndex], ...newData };
        }

        await this.saveProgram(program);
    }

    /**
     * Deletes an exercise from a specific day.
     */
    async deleteExercise(dayId, exerciseId) {
        const program = await this.getProgram();
        const day = program.days.find(d => d.id === dayId);
        if (!day) throw new Error('Day not found');

        day.exercises = day.exercises.filter(e => e.id !== exerciseId);
        // Reorder remaining exercises
        day.exercises.forEach((ex, index) => {
            ex.displayOrder = index + 1;
        });

        await this.saveProgram(program);
    }

    /**
     * Reorders exercises within a day.
     */
    async reorderExercises(dayId, exerciseIds) {
        const program = await this.getProgram();
        const day = program.days.find(d => d.id === dayId);
        if (!day) throw new Error('Day not found');

        const reordered = exerciseIds.map((id, index) => {
            const ex = day.exercises.find(e => e.id === id);
            if (ex) ex.displayOrder = index + 1;
            return ex;
        }).filter(Boolean);

        day.exercises = reordered;
        await this.saveProgram(program);
    }
}

export const templateService = new TemplateService();
