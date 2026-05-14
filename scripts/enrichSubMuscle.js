/**
 * enrichSubMuscle.js
 * Assigns subMuscle field to all exercises in data/exercises.json
 * based on keyword matching in exercise names.
 * Run: node scripts/enrichSubMuscle.js
 * (PLAN-037 | R51 | LLD-037)
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'exercises.json');
const exercises = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

/**
 * Sub-muscle mapping rules.
 * Each rule: { keywords: [...], subMuscle: '...' }
 * Rules are tested in order; first match wins.
 */
const rules = [
    // Back — Lats
    { keywords: ['pull up', 'pullup', 'pull-up', 'chin up', 'chinup', 'chin-up', 'pulldown', 'pull down', 'pull-down', 'lat pull'], subMuscle: 'Lats' },
    // Back — Mid-Back
    { keywords: ['seated row', 'cable row', 'machine row', 'dumbbell row', 'db row', 'barbell row', 'bent over row', 'chest supported row', 't-bar row', 't bar row', 'meadows row', 'pendlay'], subMuscle: 'Mid-Back' },
    // Back — Rhomboids / Rear Delt
    { keywords: ['face pull', 'rear delt fly', 'rear delt', 'reverse fly', 'band pull', 'prone y', 'prone t', 'prone w'], subMuscle: 'Rhomboids' },
    // Back — Lower Back
    { keywords: ['deadlift', 'hyperextension', 'good morning', 'back extension', 'romanian', 'rdl', 'sumo'], subMuscle: 'Lower Back' },

    // Chest — Upper
    { keywords: ['incline', 'upper chest', 'high cable fly', 'incline cable'], subMuscle: 'Pecs (Upper)' },
    // Chest — Lower
    { keywords: ['decline', 'dip', 'lower chest', 'low cable fly'], subMuscle: 'Pecs (Lower)' },
    // Chest — Mid
    { keywords: ['bench press', 'chest press', 'chest fly', 'fly', 'pec deck', 'cable crossover', 'push up', 'pushup'], subMuscle: 'Pecs (Mid)' },

    // Shoulders — Anterior
    { keywords: ['front raise', 'overhead press', 'shoulder press', 'military press', 'arnold press', 'seated press'], subMuscle: 'Anterior Deltoid' },
    // Shoulders — Lateral
    { keywords: ['lateral raise', 'side raise', 'upright row', 'cable lateral', 'machine lateral'], subMuscle: 'Lateral Deltoid' },
    // Shoulders — Posterior
    { keywords: ['reverse fly', 'face pull', 'rear delt', 'bent over fly', 'posterior delt'], subMuscle: 'Posterior Deltoid' },

    // Arms — Biceps Long Head
    { keywords: ['incline curl', 'hammer curl', 'cross body curl', 'drag curl'], subMuscle: 'Biceps Long Head' },
    // Arms — Biceps Short Head
    { keywords: ['preacher curl', 'concentration curl', 'cable curl', 'machine curl', 'bicep curl', 'biceps curl', 'ez curl', 'barbell curl'], subMuscle: 'Biceps Short Head' },
    // Arms — Triceps Long Head
    { keywords: ['overhead extension', 'skull crusher', 'lying extension', 'french press'], subMuscle: 'Triceps Long Head' },
    // Arms — Triceps Lateral Head
    { keywords: ['pushdown', 'push-down', 'tricep dip', 'close grip', 'diamond push'], subMuscle: 'Triceps Lateral Head' },

    // Legs — Quads
    { keywords: ['squat', 'leg press', 'leg extension', 'hack squat', 'front squat', 'lunge', 'step up', 'bulgarian', 'sissy squat', 'split squat'], subMuscle: 'Quads' },
    // Legs — Hamstrings
    { keywords: ['hamstring', 'leg curl', 'nordic', 'glute ham', 'lying curl', 'seated curl'], subMuscle: 'Hamstrings' },
    // Legs — Calves
    { keywords: ['calf raise', 'calf press', 'donkey calf', 'seated calf', 'standing calf', 'tibialis'], subMuscle: 'Calves' },

    // Glutes
    { keywords: ['hip thrust', 'glute bridge', 'cable kickback', 'donkey kick', 'glute', 'abductor', 'fire hydrant'], subMuscle: 'Glutes' },

    // Core / Abs
    { keywords: ['crunch', 'sit up', 'sit-up', 'plank', 'ab wheel', 'cable crunch', "captain's chair", 'captain', 'leg raise', 'russian twist', 'oblique', 'woodchop', 'hollow hold', 'v-up', 'bicycle'], subMuscle: 'Abs' },

    // Neck
    { keywords: ['neck', 'shrug', 'trap'], subMuscle: 'Traps/Neck' },
];

function assignSubMuscle(exercise) {
    const nameLower = exercise.name.toLowerCase();
    for (const rule of rules) {
        if (rule.keywords.some(kw => nameLower.includes(kw))) {
            return rule.subMuscle;
        }
    }
    // Fallback: use broad muscle as sub-muscle
    return exercise.muscle || exercise.bodyPartPrimary || '';
}

let changed = 0;
const enriched = exercises.map(ex => {
    const subMuscle = assignSubMuscle(ex);
    if (ex.subMuscle !== subMuscle) changed++;
    return { ...ex, subMuscle };
});

fs.writeFileSync(dataPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log(`Done. ${enriched.length} exercises processed, ${changed} updated with subMuscle.`);

// Print a summary of subMuscle distribution
const groups = {};
enriched.forEach(ex => {
    const sm = ex.subMuscle || '(none)';
    groups[sm] = (groups[sm] || 0) + 1;
});
Object.entries(groups).sort((a, b) => b[1] - a[1]).forEach(([sm, cnt]) => {
    console.log(`  ${sm}: ${cnt}`);
});
