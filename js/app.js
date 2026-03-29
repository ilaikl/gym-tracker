import { persistenceService } from './services/PersistenceService.js';
import { jsonTransferService } from './services/JSONTransferService.js';
import { templateService } from './services/TemplateService.js';
import { workoutEngine } from './services/WorkoutEngine.js';
import { progressionService } from './services/ProgressionService.js';
import { appInitializer } from './services/AppInitializer.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('App: DOM Content Loaded');

    // Initialize Database and App
    try {
        await persistenceService.init();
        console.info('App: PersistenceService initialized.');
        await appInitializer.init();
        console.info('App: AppInitializer completed.');
    } catch (error) {
        console.error('App: Failed to initialize app', error);
        alert('Application initialization failed. Please try reloading the page.');
    }

    // --- UI Elements ---
    // Backup/Restore
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importInput = document.getElementById('import-input');

    // Program Editor
    const viewProgramBtn = document.getElementById('view-program-btn');
    const programEditor = document.getElementById('program-editor');
    const programDaysList = document.getElementById('program-days-list');
    const addDayBtn = document.getElementById('add-day-btn');

    // Exercise Editor
    const exerciseEditor = document.getElementById('exercise-editor');
    const exNameInput = document.getElementById('ex-name');
    const exBodyPartInput = document.getElementById('ex-bodypart');
    const saveExBtn = document.getElementById('save-ex-btn');
    const cancelExBtn = document.getElementById('cancel-ex-btn');

    // Workout Engine UI
    const startWorkoutBtn = document.getElementById('start-workout-btn');
    const startWorkoutScreen = document.getElementById('start-workout-screen');
    const daysToSelectList = document.getElementById('days-to-select-list');
    const cancelStartBtn = document.getElementById('cancel-start-btn');

    const activeWorkoutScreen = document.getElementById('active-workout-screen');
    const activeDayName = document.getElementById('active-day-name');
    const activeExercisesList = document.getElementById('active-exercises-list');
    const completeWorkoutBtn = document.getElementById('complete-workout-btn');

    // Add Exercise Modal UI
    const addExModal = document.getElementById('add-ex-modal');
    const showAddExModalBtn = document.getElementById('show-add-ex-modal-btn');
    const closeAddExModalBtn = document.getElementById('close-add-ex-modal');
    const toggleExistingBtn = document.getElementById('toggle-existing-ex');
    const toggleManualBtn = document.getElementById('toggle-manual-ex');
    const existingExContainer = document.getElementById('existing-ex-container');
    const manualExContainer = document.getElementById('manual-ex-container');
    const existingExSelect = document.getElementById('existing-ex-select');
    const addExistingExConfirm = document.getElementById('add-existing-ex-confirm');
    const addManualExConfirm = document.getElementById('add-manual-ex-confirm');

    // History & Progression UI
    const viewHistoryBtn = document.getElementById('view-history-btn');
    const historyScreen = document.getElementById('history-screen');
    const historyList = document.getElementById('history-list');
    const progressionScreen = document.getElementById('progression-screen');
    const progressionExName = document.getElementById('progression-ex-name');
    const progressionList = document.getElementById('progression-list');
    const backToHistoryBtn = document.getElementById('back-to-history-btn');
    const cancelActiveWorkoutBtn = document.getElementById('cancel-active-workout-btn');

    let currentEditingDayId = null;
    let currentEditingExId = null;
    let currentActiveLog = null;
    let isEditingHistory = false;

    // --- Event Listeners ---

    // Null check wrapper for currentActiveLog
    function withActiveLog(callback) {
        return async (...args) => {
            if (!currentActiveLog) {
                console.warn('App: currentActiveLog is null. Action ignored.');
                return;
            }
            return await callback(...args);
        };
    }

    // Backup/Restore Logic
    exportBtn.addEventListener('click', async () => {
        try {
            await jsonTransferService.exportData();
            alert('Data exported successfully.');
        } catch (error) {
            alert('Export failed: ' + error.message);
        }
    });

    importBtn.addEventListener('click', () => {
        importInput.click();
    });

    importInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (confirm('Importing data will replace all current data. Are you sure?')) {
            try {
                await jsonTransferService.importData(file);
                alert('Data imported successfully. The page will now reload.');
                window.location.reload();
            } catch (error) {
                alert('Import failed: ' + error.message);
            }
        }
        importInput.value = '';
    });

    // Program Editor Logic
    viewProgramBtn.addEventListener('click', async () => {
        const isHidden = programEditor.style.display === 'none';
        programEditor.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            await renderProgram();
        }
    });

    addDayBtn.addEventListener('click', async () => {
        const name = prompt('Enter day name:');
        if (name) {
            await templateService.addDay({ name });
            await renderProgram();
        }
    });

    async function renderProgram() {
        const program = await templateService.getProgram();
        programDaysList.innerHTML = '';

        if (!program || !program.days.length) {
            programDaysList.innerHTML = '<p>No days in program.</p>';
            return;
        }

        program.days.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'day-item';
            dayEl.style.border = '1px dotted #666';
            dayEl.style.padding = '5px';
            dayEl.style.margin = '5px 0';

            dayEl.innerHTML = `
                <h4>${day.name} (${day.type})</h4>
                <div class="exercises-list">
                    ${day.exercises.map(ex => `
                        <div class="exercise-item">
                            ${ex.name} - ${ex.bodyPartPrimary}
                            <button class="edit-ex-btn" data-day-id="${day.id}" data-ex-id="${ex.id}">Edit</button>
                            <button class="view-progression-btn" data-ex-template-id="${ex.id}" data-ex-name="${ex.name}">Progress</button>
                            <button class="delete-ex-btn" data-day-id="${day.id}" data-ex-id="${ex.id}">Delete</button>
                        </div>
                    `).join('')}
                </div>
                <button class="add-ex-btn" data-day-id="${day.id}">Add Exercise</button>
            `;
            programDaysList.appendChild(dayEl);
        });

        // Attach listeners to dynamic buttons
        document.querySelectorAll('.add-ex-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentEditingDayId = e.target.dataset.dayId;
                currentEditingExId = null;
                showExerciseEditor();
            });
        });

        document.querySelectorAll('.edit-ex-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                currentEditingDayId = e.target.dataset.dayId;
                currentEditingExId = e.target.dataset.exId;
                await showExerciseEditor(currentEditingDayId, currentEditingExId);
            });
        });

        document.querySelectorAll('.view-progression-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await showProgression(e.target.dataset.exTemplateId, e.target.dataset.exName);
            });
        });

        document.querySelectorAll('.delete-ex-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Delete this exercise?')) {
                    await templateService.deleteExercise(e.target.dataset.dayId, e.target.dataset.exId);
                    await renderProgram();
                }
            });
        });
    }

    async function showExerciseEditor(dayId, exId) {
        exerciseEditor.style.display = 'block';
        if (exId) {
            const program = await templateService.getProgram();
            const day = program.days.find(d => d.id === dayId);
            const ex = day.exercises.find(e => e.id === exId);
            exNameInput.value = ex.name;
            exBodyPartInput.value = ex.bodyPartPrimary;
            document.getElementById('ex-editor-title').innerText = 'Edit Exercise';
        } else {
            exNameInput.value = '';
            exBodyPartInput.value = '';
            document.getElementById('ex-editor-title').innerText = 'Add Exercise';
        }
    }

    saveExBtn.addEventListener('click', async () => {
        const name = exNameInput.value.trim();
        const bodyPart = exBodyPartInput.value.trim();
        if (!name) return alert('Name is required');

        if (currentEditingExId) {
            await templateService.updateExercise(currentEditingDayId, currentEditingExId, {
                name,
                bodyPartPrimary: bodyPart
            });
        } else {
            // Add exercise with default 3 sets of 8-12 reps
            await templateService.addExercise(currentEditingDayId, {
                name,
                bodyPartPrimary: bodyPart,
                targetSets: [
                    { setNumber: 1, minReps: 8, maxReps: 12 },
                    { setNumber: 2, minReps: 8, maxReps: 12 },
                    { setNumber: 3, minReps: 8, maxReps: 12 }
                ],
                repGoalType: 'range',
                defaultWeight: { value: 0, unit: 'kg', label: '' },
                notes: []
            });
        }

        exerciseEditor.style.display = 'none';
        await renderProgram();
    });

    cancelExBtn.addEventListener('click', () => {
        exerciseEditor.style.display = 'none';
    });

    // --- Workout Engine UI Logic ---

    startWorkoutBtn.addEventListener('click', async () => {
        startWorkoutScreen.style.display = 'block';
        startWorkoutBtn.style.display = 'none';
        await renderDaysToSelect();
    });

    cancelStartBtn.addEventListener('click', () => {
        startWorkoutScreen.style.display = 'none';
        startWorkoutBtn.style.display = 'block';
    });

    async function renderDaysToSelect() {
        const program = await templateService.getProgram();
        daysToSelectList.innerHTML = '';
        if (!program || !program.days.length) {
            daysToSelectList.innerHTML = '<p>No days found. Please add days to program first.</p>';
            return;
        }

        program.days.forEach(day => {
            const btn = document.createElement('button');
            btn.innerText = day.name;
            btn.style.display = 'block';
            btn.style.margin = '5px 0';
            btn.addEventListener('click', async () => {
                const log = await workoutEngine.createLogFromTemplate(day);
                currentActiveLog = log;
                showActiveWorkout(log);
            });
            daysToSelectList.appendChild(btn);
        });
    }

    function showActiveWorkout(log) {
        startWorkoutScreen.style.display = 'none';
        activeWorkoutScreen.style.display = 'block';
        activeDayName.innerText = `${log.dayName} - ${log.date}`;
        renderActiveExercises(log);
    }

    function renderActiveExercises(log) {
        activeExercisesList.innerHTML = '';
        log.exercises.forEach(ex => {
            const exEl = document.createElement('div');
            exEl.className = 'logged-exercise-card';
            exEl.style.border = '1px solid #aaa';
            exEl.style.margin = '10px 0';
            exEl.style.padding = '10px';
            exEl.style.position = 'relative';

            exEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h4>${ex.name} (${ex.bodyPartPrimary})</h4>
                    <button class="remove-exercise-btn" data-ex-id="${ex.id}" style="color: red; padding: 2px 5px;">Delete</button>
                </div>
                <div class="logged-sets-list">
                    ${ex.actualSets.map((set, idx) => `
                        <div class="set-row">
                            Set ${set.setNumber} | Target: ${set.targetReps} |
                            W: <input type="number" class="actual-weight" data-ex-id="${ex.id}" data-set-idx="${idx}" value="${set.actualWeight}" style="width: 45px;">
                            R: <input type="number" class="actual-reps" data-ex-id="${ex.id}" data-set-idx="${idx}" value="${set.actualReps || ''}" style="width: 40px;">
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 10px;">
                    <button class="add-set-btn" data-ex-id="${ex.id}">+ Add Set</button>
                    <button class="remove-set-btn" data-ex-id="${ex.id}">- Remove Set</button>
                </div>
            `;
            activeExercisesList.appendChild(exEl);
        });

        // Attach auto-save listeners
        document.querySelectorAll('.actual-reps, .actual-weight').forEach(input => {
            input.addEventListener('change', async (e) => {
                const exId = e.target.dataset.exId;
                const setIdx = parseInt(e.target.dataset.setIdx);
                const val = parseFloat(e.target.value);
                const field = e.target.classList.contains('actual-reps') ? 'actualReps' : 'actualWeight';

                if (!currentActiveLog) return;
                await workoutEngine.updateSet(currentActiveLog.id, exId, setIdx, { [field]: val });
                // Update local object to reflect the change
                const ex = currentActiveLog.exercises.find(e => e.id === exId);
                ex.actualSets[setIdx][field] = val;
            });
        });

        // Attach add/remove set listeners
        document.querySelectorAll('.add-set-btn').forEach(btn => {
            btn.addEventListener('click', withActiveLog(async (e) => {
                const exId = e.target.dataset.exId;
                currentActiveLog = await workoutEngine.addSet(currentActiveLog.id, exId);
                renderActiveExercises(currentActiveLog);
            }));
        });

        document.querySelectorAll('.remove-set-btn').forEach(btn => {
            btn.addEventListener('click', withActiveLog(async (e) => {
                const exId = e.target.dataset.exId;
                currentActiveLog = await workoutEngine.removeLastSet(currentActiveLog.id, exId);
                renderActiveExercises(currentActiveLog);
            }));
        });

        // Attach remove exercise listener
        document.querySelectorAll('.remove-exercise-btn').forEach(btn => {
            btn.addEventListener('click', withActiveLog(async (e) => {
                const exId = e.target.dataset.exId;
                if (confirm('Remove this exercise from current workout?')) {
                    currentActiveLog = await workoutEngine.removeExercise(currentActiveLog.id, exId);
                    renderActiveExercises(currentActiveLog);
                }
            }));
        });
    }

    // --- Add Exercise Modal Logic ---
    showAddExModalBtn.addEventListener('click', async () => {
        addExModal.style.display = 'block';
        await populateExistingExSelect();
    });

    closeAddExModalBtn.addEventListener('click', () => {
        addExModal.style.display = 'none';
    });

    toggleExistingBtn.addEventListener('click', () => {
        existingExContainer.style.display = 'block';
        manualExContainer.style.display = 'none';
    });

    toggleManualBtn.addEventListener('click', () => {
        existingExContainer.style.display = 'none';
        manualExContainer.style.display = 'block';
    });

    async function populateExistingExSelect() {
        const program = await templateService.getProgram();
        existingExSelect.innerHTML = '';

        // Flatten all exercises from all days
        const allExercises = [];
        const seenIds = new Set();

        program.days.forEach(day => {
            day.exercises.forEach(ex => {
                if (!seenIds.has(ex.id)) {
                    allExercises.push(ex);
                    seenIds.add(ex.id);
                }
            });
        });

        allExercises.forEach(ex => {
            const option = document.createElement('option');
            option.value = JSON.stringify(ex);
            option.innerText = `${ex.name} (${ex.bodyPartPrimary})`;
            existingExSelect.appendChild(option);
        });
    }

    addExistingExConfirm.addEventListener('click', withActiveLog(async () => {
        const exTemplate = JSON.parse(existingExSelect.value);
        currentActiveLog = await workoutEngine.addExtraExercise(currentActiveLog.id, exTemplate);
        addExModal.style.display = 'none';
        renderActiveExercises(currentActiveLog);
    }));

    addManualExConfirm.addEventListener('click', withActiveLog(async () => {
        const name = document.getElementById('manual-ex-name').value;
        const bodyPart = document.getElementById('manual-ex-bodypart').value;
        const setsCount = parseInt(document.getElementById('manual-ex-sets').value);
        const reps = parseInt(document.getElementById('manual-ex-reps').value);
        const weight = parseFloat(document.getElementById('manual-ex-weight').value);

        if (!name) return alert('Exercise name is required');

        const sets = [];
        for (let i = 1; i <= setsCount; i++) {
            sets.push({ setNumber: i, targetReps: reps });
        }

        const manualExTemplate = {
            id: `manual_${Date.now()}`,
            name,
            bodyPartPrimary: bodyPart,
            bodyPartSecondary: [],
            targetSets: sets,
            repGoalType: 'fixed',
            defaultWeight: { value: weight, unit: 'kg', label: '' },
            notes: []
        };

        currentActiveLog = await workoutEngine.addExtraExercise(currentActiveLog.id, manualExTemplate);
        addExModal.style.display = 'none';
        renderActiveExercises(currentActiveLog);
    }));

    completeWorkoutBtn.addEventListener('click', withActiveLog(async () => {
        if (confirm('Complete workout?')) {
            await workoutEngine.completeWorkout(currentActiveLog.id);
            if (!isEditingHistory) {
                alert('Workout completed and saved!');
            }
            activeWorkoutScreen.style.display = 'none';
            if (isEditingHistory) {
                historyScreen.style.display = 'block';
                await renderHistory();
            } else {
                startWorkoutBtn.style.display = 'block';
            }
            currentActiveLog = null;
            isEditingHistory = false;
        }
    }));

    cancelActiveWorkoutBtn.addEventListener('click', () => {
        activeWorkoutScreen.style.display = 'none';
        if (isEditingHistory) {
            historyScreen.style.display = 'block';
        } else {
            startWorkoutBtn.style.display = 'block';
        }
        currentActiveLog = null;
        isEditingHistory = false;
    });

    // --- History & Progression UI Logic ---

    viewHistoryBtn.addEventListener('click', async () => {
        const isHidden = historyScreen.style.display === 'none';
        historyScreen.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            await renderHistory();
        } else {
            // If hiding history, also hide details if they were open
            activeWorkoutScreen.style.display = 'none';
            isEditingHistory = false;
        }
    });

    async function renderHistory() {
        const logs = await progressionService.getAllHistory();
        historyList.innerHTML = '';
        if (!logs.length) {
            historyList.innerHTML = '<p>No workout history yet.</p>';
            return;
        }

        logs.forEach(log => {
            const logEl = document.createElement('div');
            logEl.className = 'history-item';
            logEl.style.border = '1px solid #ccc';
            logEl.style.margin = '10px 0';
            logEl.style.padding = '10px';
            logEl.style.display = 'flex';
            logEl.style.justifyContent = 'space-between';
            logEl.style.alignItems = 'center';

            logEl.innerHTML = `
                <div>
                    <strong>${log.date} - ${log.dayName}</strong> (${log.status})
                    <div>Exercises: ${log.exercises.length}</div>
                </div>
                <div>
                    <button class="view-log-btn" data-log-id="${log.id}">View Details</button>
                    <button class="delete-log-btn" data-log-id="${log.id}" style="color: red;">Delete</button>
                </div>
            `;
            historyList.appendChild(logEl);
        });

        // Attach listeners
        document.querySelectorAll('.view-log-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const logId = e.target.dataset.logId;
                const log = await workoutEngine.getLogById(logId);
                currentActiveLog = log;
                isEditingHistory = true;
                showActiveWorkout(log);
            });
        });

        document.querySelectorAll('.delete-log-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const logId = e.target.dataset.logId;
                if (confirm('Are you sure you want to delete this workout log? This cannot be undone.')) {
                    await workoutEngine.deleteWorkoutLog(logId);
                    await renderHistory();
                }
            });
        });
    }

    async function showProgression(templateExId, exName) {
        historyScreen.style.display = 'none';
        progressionScreen.style.display = 'block';
        progressionExName.innerText = exName;

        const history = await progressionService.getExerciseHistory(templateExId);
        progressionList.innerHTML = '';

        if (!history.length) {
            progressionList.innerHTML = '<p>No history for this exercise.</p>';
        } else {
            history.forEach(entry => {
                const entryEl = document.createElement('div');
                entryEl.className = 'progression-entry';
                entryEl.style.borderBottom = '1px solid #eee';
                entryEl.style.padding = '5px';

                const setsSummary = entry.actualSets.map(s => `${s.actualWeight}kg x ${s.actualReps || 0}`).join(' | ');

                entryEl.innerHTML = `
                    <strong>${entry.date}</strong>: ${setsSummary}
                `;
                progressionList.appendChild(entryEl);
            });
        }
    }

    backToHistoryBtn.addEventListener('click', () => {
        progressionScreen.style.display = 'none';
        historyScreen.style.display = 'block';
    });
});
