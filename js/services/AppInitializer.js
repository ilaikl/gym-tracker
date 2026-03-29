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
            name: 'תוכנית שבועית 4 אימונים',
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            days: [
                {
                    id: 'day_1_push',
                    order: 1,
                    name: 'יום 1 – Push',
                    type: 'push',
                    bodyParts: ['חזה', 'כתפיים', 'טרייספס'],
                    isRestDay: false,
                    exercises: [
                        this.createEx('ex_db_chest_press', 'DB Chest Press', 'חזה', [1,2,3,4], [8,8,7,6]),
                        this.createEx('ex_incline_db_press', 'Incline DB Press', 'חזה', [1,2,3], [8,10,12]),
                        this.createEx('ex_db_chest_fly', 'DB Chest Fly', 'חזה', [1,2,3], [12,12,12]),
                        this.createEx('ex_shoulder_press', 'Shoulder Press', 'כתפיים', [1,2,3], [8,10,12]),
                        this.createEx('ex_lateral_raise', 'Lateral Raise', 'כתפיים', [1,2,3], [12,15,20]),
                        this.createEx('ex_triceps_ext', 'Triceps Overhead Extension', 'טרייספס', [1,2,3], [10,12,15]),
                        this.createEx('ex_triceps_pushdown', 'Triceps Pushdown', 'טרייספס', [1,2,3], [12,15,20])
                    ]
                },
                {
                    id: 'day_2_pull',
                    order: 2,
                    name: 'יום 2 – Pull',
                    type: 'pull',
                    bodyParts: ['גב', 'בייספס'],
                    isRestDay: false,
                    exercises: [
                        this.createEx('ex_lat_pulldown', 'Lat Pulldown', 'גב', [1,2,3,4], [8,10,12,12]),
                        this.createEx('ex_row_v_bar', 'Row (V-bar)', 'גב', [1,2,3], [8,10,12]),
                        this.createEx('ex_rear_delt_machine', 'Rear Delt Machine', 'כתפיים', [1,2,3], [12,15,15]),
                        this.createEx('ex_preacher_curl', 'Preacher Curl (EZ)', 'בייספס', [1,2,3], [10,12,12]),
                        this.createEx('ex_hammer_curl', 'Hammer Curl', 'בייספס', [1,2,3], [10,12,12])
                    ]
                },
                {
                    id: 'day_3_rest',
                    order: 3,
                    name: 'יום 3 – מנוחה / הליכה',
                    type: 'rest',
                    bodyParts: [],
                    isRestDay: true,
                    exercises: []
                },
                {
                    id: 'day_4_legs',
                    order: 4,
                    name: 'יום 4 – Legs + Shoulders + Abs',
                    type: 'legs',
                    bodyParts: ['רגליים', 'כתפיים', 'בטן'],
                    isRestDay: false,
                    exercises: [
                        this.createEx('ex_squat', 'Squat', 'רגליים', [1,2,3,4], [6,8,10,12]),
                        this.createEx('ex_leg_ext', 'Leg Extension', 'רגליים', [1,2,3], [12,15,15]),
                        this.createEx('ex_leg_curl', 'Leg Curl', 'רגליים', [1,2,3], [12,15,15]),
                        this.createEx('ex_iso_shoulder_press', 'Shoulder Press (Iso Machine)', 'כתפיים', [1,2,3], [8,10,12]),
                        this.createEx('ex_lat_raise_machine', 'Lateral Raise Machine', 'כתפיים', [1,2,3], [12,15,20]),
                        this.createEx('ex_rear_delt', 'Rear Delt', 'כתפיים', [1,2,3], [12,15,15]),
                        this.createEx('ex_abs_captains_chair', "Abs – Captain's Chair", 'בטן', [1,2,3], [15,15,15])
                    ]
                },
                {
                    id: 'day_5_pump',
                    order: 5,
                    name: 'יום 5 – Chest + Arms (Pump / completion)',
                    type: 'pump',
                    bodyParts: ['חזה', 'בייספס', 'טרייספס'],
                    isRestDay: false,
                    exercises: [
                        this.createEx('ex_incline_press_pump', 'Incline Press', 'חזה', [1,2,3], [12,12,12]),
                        this.createEx('ex_fly_machine', 'Fly / Machine', 'חזה', [1,2,3], [15,15,15]),
                        this.createEx('ex_biceps_pump', 'Biceps', 'בייספס', [1,2,3], [12,15,15]),
                        this.createEx('ex_triceps_pump', 'Triceps', 'טרייספס', [1,2,3], [12,15,15])
                    ]
                }
            ]
        };

        await persistenceService.save('program', defaultProgram);
    }

    createEx(id, name, bodyPart, setNums, reps) {
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
            notes: [],
            progressionRule: {
                increaseWhen: 'reach_upper_target',
                increaseConditionText: 'כשאתה מגיע ל־12 חזרות → תעלה משקל',
                decreaseConditionText: 'כשאתה לא מגיע ל־8 → תוריד משקל'
            },
            isOptional: false,
            isActive: true,
            displayOrder: setNums[0] // Simple order for seeding
        };
    }
}

export const appInitializer = new AppInitializer();
