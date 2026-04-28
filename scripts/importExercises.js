const fs = require('fs');
const https = require('https');

/**
 * importExercises.js
 * One-time script to fetch exercises from API Ninjas and save to data/exercises.json
 * (PLAN-032 | R42 | LLD-032)
 */

const API_KEY = 'sFeGow4Le4WufapW6eHku4HqjwMqPmbWogyOiKMu';
const BASE_URL = 'https://api.api-ninjas.com/v1/exercises';
const MUSCLES = [
    'abdominals', 'abductors', 'adductors', 'biceps', 'calves',
    'chest', 'forearms', 'glutes', 'hamstrings', 'lats',
    'lower_back', 'middle_back', 'neck', 'quadriceps', 'traps', 'triceps'
];

async function fetchExercises(muscle) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}?muscle=${muscle}`;
        const options = {
            headers: { 'X-Api-Key': API_KEY }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`API Error: ${res.statusCode} ${data}`));
                }
            });
        }).on('error', reject);
    });
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function normalize(apiEx, muscle) {
    // Standardizing muscle names for the app's UI
    const muscleMap = {
        'abdominals': 'Abs',
        'abductors': 'Legs',
        'adductors': 'Legs',
        'biceps': 'Biceps',
        'calves': 'Legs',
        'chest': 'Chest',
        'forearms': 'Arms',
        'glutes': 'Glutes',
        'hamstrings': 'Legs',
        'lats': 'Back',
        'lower_back': 'Back',
        'middle_back': 'Back',
        'neck': 'Neck',
        'quadriceps': 'Legs',
        'traps': 'Back',
        'triceps': 'Triceps'
    };

    const displayMuscle = muscleMap[muscle] || muscle.charAt(0).toUpperCase() + muscle.slice(1);

    return {
        id: slugify(apiEx.name + '-' + muscle),
        name: apiEx.name,
        muscle: displayMuscle,
        type: apiEx.type,
        difficulty: apiEx.difficulty,
        instructions: apiEx.instructions,
        safetyTips: '', // API doesn't always provide this separately
        equipment: apiEx.equipment,
        notes: '',
        source: 'imported',
        defaultWeight: { value: 0, unit: 'kg', label: '' },
        targetSets: [
            { setNumber: 1, targetReps: 10 },
            { setNumber: 2, targetReps: 10 },
            { setNumber: 3, targetReps: 10 }
        ],
        createdAt: new Date().toISOString()
    };
}

async function main() {
    console.log('Starting exercise import...');
    let allExercises = [];
    const seenIds = new Set();

    for (const muscle of MUSCLES) {
        console.log(`Fetching ${muscle}...`);
        try {
            const exercises = await fetchExercises(muscle);
            console.log(`Found ${exercises.length} exercises for ${muscle}`);

            for (const ex of exercises) {
                const normalized = normalize(ex, muscle);
                if (!seenIds.has(normalized.id)) {
                    allExercises.push(normalized);
                    seenIds.add(normalized.id);
                }
            }
        } catch (err) {
            console.error(`Failed to fetch ${muscle}:`, err.message);
        }
        // Small delay to respect rate limits if any
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`Total unique exercises found: ${allExercises.length}`);

    const outputPath = './data/exercises.json';
    fs.writeFileSync(outputPath, JSON.stringify(allExercises, null, 2));
    console.log(`Saved to ${outputPath}`);
}

main();
