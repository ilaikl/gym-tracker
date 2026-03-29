import { templateService } from './TemplateService.js';
import { persistenceService } from './PersistenceService.js';

/**
 * AppInitializer - Handles initial setup and seed data.
 * (PLAN-005 | R1 | LLD-005)
 */
class AppInitializer {
    async init() {
        console.info('AppInitializer: Initializing...');
        try {
            const program = await templateService.getProgram();
            if (!program || (program.days && program.days.length === 0)) {
                console.info('AppInitializer: No program found, seeding default data.');
                await this.seedDefaultProgram();
                console.info('AppInitializer: Seeding complete.');
            } else {
                console.info('AppInitializer: Existing program found.');
            }
        } catch (error) {
            console.error('AppInitializer: Error during init', error);
            throw error;
        }
    }

    async seedDefaultProgram() {
        const defaultProgram = {
            id: 'main_program',
            name: 'Weekly Program 4 Workouts',
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            days: [
                {
                    id: 'day_1_push',
                    order: 1,
                    name: 'Day 1 – Push',
                    type: 'push',
                    bodyParts: ['Chest', 'Shoulders', 'Triceps'],
                    isRestDay: false,
                    exercises: [
                        this.createEx('ex_db_chest_press', 'DB Chest Press', 'Chest', [1,2,3,4], [8,8,7,6], 'Shoulder blades back and down; controlled descent; don’t lock out fast; chest leads, not arms'),
                        this.createEx('ex_incline_db_press', 'Incline DB Press', 'Chest', [1,2,3], [8,10,12], '~30° angle; diagonal movement; focus on upper chest'),
                        this.createEx('ex_db_chest_fly', 'DB Chest Fly', 'Chest', [1,2,3], [12,12,12], 'Slight bend in arms; stretch at the bottom; don’t turn it into a press'),
                        this.createEx('ex_shoulder_press', 'Shoulder Press', 'Shoulders', [1,2,3], [8,10,12], 'Back against support; don’t arch lower back; controlled lowering'),
                        this.createEx('ex_lateral_raise', 'Lateral Raise', 'Shoulders', [1,2,3], [12,15,20], 'Lead with elbows; don’t raise too high; clean movement'),
                        this.createEx('ex_triceps_ext', 'Triceps Overhead Extension', 'Triceps', [1,2,3], [10,12,15], 'Elbows forward; deep stretch; don’t flare elbows'),
                        this.createEx('ex_triceps_pushdown', 'Triceps Pushdown', 'Triceps', [1,2,3], [12,15,20], 'Elbows tucked; controlled movement; squeeze at the end')
                    ]
                },
                {
                    id: 'day_2_pull',
                    order: 2,
                    name: 'Day 2 – Pull',
                    type: 'pull',
                    bodyParts: ['Back', 'Biceps'],
                    isRestDay: false,
                    exercises: [
                        this.createEx('ex_lat_pulldown', 'Lat Pulldown', 'Back', [1,2,3,4], [8,10,12,12], 'Chest up; pull with elbows; don’t swing'),
                        this.createEx('ex_row_v_bar', 'Row (V-bar)', 'Back', [1,2,3], [8,10,12], 'Chest open; pull to stomach; squeeze shoulder blades'),
                        this.createEx('ex_rear_delt_machine', 'Rear Delt Machine', 'Shoulders', [1,2,3], [12,15,15], 'Slow movement; don’t pull with hands; feel rear delts'),
                        this.createEx('ex_preacher_curl', 'Preacher Curl (EZ)', 'Biceps', [1,2,3], [10,12,12], 'Keep elbows fixed; slow lowering; no momentum'),
                        this.createEx('ex_hammer_curl', 'Hammer Curl', 'Biceps', [1,2,3], [10,12,12], 'Arms close to body; controlled movement; no swinging')
                    ]
                },
                {
                    id: 'day_3_rest',
                    order: 3,
                    name: 'Day 3 – Rest / Walking',
                    type: 'rest',
                    bodyParts: [],
                    isRestDay: true,
                    exercises: []
                },
                {
                    id: 'day_4_legs',
                    order: 4,
                    name: 'Day 4 – Legs + Shoulders + Abs',
                    type: 'legs',
                    bodyParts: ['Legs', 'Shoulders', 'Abs'],
                    isRestDay: false,
                    exercises: [
                        this.createEx('ex_squat', 'Squat', 'Legs', [1,2,3,4], [6,8,10,12], 'Chest up; knees out; slow descent; push through the floor'),
                        this.createEx('ex_leg_ext', 'Leg Extension', 'Legs', [1,2,3], [12,15,15], 'Pause at the top; controlled lowering'),
                        this.createEx('ex_leg_curl', 'Leg Curl', 'Legs', [1,2,3], [12,15,15], 'Full range of motion; controlled; don’t throw the weight'),
                        this.createEx('ex_iso_shoulder_press', 'Shoulder Press (Iso Machine)', 'Shoulders', [1,2,3], [8,10,12], 'Stable back; controlled movement'),
                        this.createEx('ex_lat_raise_machine', 'Lateral Raise Machine', 'Shoulders', [1,2,3], [12,15,20], 'Lead with elbows; clean movement'),
                        this.createEx('ex_rear_delt', 'Rear Delt', 'Shoulders', [1,2,3], [12,15,15], 'Slow movement; controlled'),
                        this.createEx('ex_abs_captains_chair', "Abs – Captain's Chair", 'Abs', [1,2,3], [15,15,15], 'Don’t swing; raise above 90°; slow descent')
                    ]
                },
                {
                    id: 'day_5_pump',
                    order: 5,
                    name: 'Day 5 – Chest + Arms (Pump / completion)',
                    type: 'pump',
                    bodyParts: ['Chest', 'Biceps', 'Triceps'],
                    isRestDay: false,
                    exercises: [
                        this.createEx('ex_incline_press_pump', 'Incline Press', 'Chest', [1,2,3], [12,12,12]),
                        this.createEx('ex_fly_machine', 'Fly / Machine', 'Chest', [1,2,3], [15,15,15]),
                        this.createEx('ex_biceps_pump', 'Biceps', 'Biceps', [1,2,3], [12,15,15]),
                        this.createEx('ex_triceps_pump', 'Triceps', 'Triceps', [1,2,3], [12,15,15])
                    ]
                }
            ]
        };

        await persistenceService.save('program', defaultProgram);
    }

    createEx(id, name, bodyPart, setNums, reps, notesString = '') {
        return {
            id,
            name,
            bodyPartPrimary: bodyPart,
            bodyPartSecondary: [],
            category: 'compound',
            equipment: '',
            defaultWeight: { value: 0, unit: 'kg', label: '' },
            targetSets: setNums.map((n, i) => ({ setNumber: n, targetReps: reps[i] })),
            repGoalType: 'fixed',
            notes: notesString,
            progressionRule: {
                increaseWhen: 'reach_upper_target',
                increaseConditionText: 'When you reach 12 reps → increase weight',
                decreaseConditionText: 'When you don\'t reach 8 → decrease weight'
            },
            isOptional: false,
            isActive: true,
            displayOrder: setNums[0] // Simple order for seeding
        };
    }
}

export const appInitializer = new AppInitializer();
