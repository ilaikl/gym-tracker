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
        console.info('App: Initializing PersistenceService...');
        await persistenceService.init();
        console.info('App: PersistenceService initialized.');

        console.info('App: Initializing AppInitializer...');
        await appInitializer.init();
        console.info('App: AppInitializer completed.');
    } catch (error) {
        console.error('App: Failed to initialize app', error);
        alert('Application initialization failed: ' + error.message);
    }

    // --- UI Elements ---
    const appContainer = document.getElementById('app');
    const resumeContainer = document.createElement('div');
    resumeContainer.id = 'resume-workout-container';
    resumeContainer.style.display = 'none';
    resumeContainer.style.padding = '10px';
    resumeContainer.style.backgroundColor = '#fff3cd';
    resumeContainer.style.border = '1px solid #ffeeba';
    resumeContainer.style.marginBottom = '15px';
    document.querySelector('#workout-engine').prepend(resumeContainer);

    // Backup/Restore
    const exportBtn = document.getElementById('export-btn');
    const exportProgramBtn = document.getElementById('export-program-btn');
    const exportHistoryBtn = document.getElementById('export-history-btn');
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
    const exTargetWeightInput = document.getElementById('ex-target-weight');
    const exTargetUnitInput = document.getElementById('ex-target-unit');
    const exTargetSetsInput = document.getElementById('ex-target-sets');
    const exNotesInput = document.getElementById('ex-notes');
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

    // Progression UI Elements (Inline)
    function createInlineHistoryUI(container, exerciseId) {
        const historyBtn = document.createElement('button');
        historyBtn.innerText = 'Progress';
        historyBtn.className = 'view-progression-btn';
        historyBtn.dataset.exTemplateId = exerciseId;
        historyBtn.style.padding = '2px 8px';
        historyBtn.style.fontSize = '0.9em';
        historyBtn.style.cursor = 'pointer';

        const historyContainer = document.createElement('div');
        historyContainer.className = 'inline-history-container';
        historyContainer.style.display = 'none';
        historyContainer.style.marginTop = '5px';
        historyContainer.style.fontSize = '0.8em';
        historyContainer.style.backgroundColor = '#f9f9f9';
        historyContainer.style.padding = '5px';
        historyContainer.style.border = '1px solid #ddd';

        historyBtn.onclick = async (e) => {
            e.stopPropagation();
            if (historyContainer.style.display === 'none') {
                const history = await progressionService.getRecentHistory(exerciseId, 3);
                if (history.length === 0) {
                    historyContainer.innerHTML = 'No history yet.';
                } else {
                    historyContainer.innerHTML = history.map(h => `
                        <div style="border-bottom: 1px solid #eee; padding: 2px 0;">
                            <strong>${h.date}</strong>: ${h.actualSets.map(s => `${s.actualWeight}${s.unit}x${s.actualReps}`).join(', ')}
                        </div>
                    `).join('');
                }
                historyContainer.style.display = 'block';
                historyBtn.innerText = 'Close Progress';
            } else {
                historyContainer.style.display = 'none';
                historyBtn.innerText = 'Progress';
            }
        };

        container.appendChild(historyBtn);
        container.appendChild(historyContainer);
    }

    // History & Progression UI
    const viewHistoryBtn = document.getElementById('view-history-btn');
    const historyScreen = document.getElementById('history-screen');
    const historyList = document.getElementById('history-list');
    const progressionScreen = document.getElementById('progression-screen');
    const progressionExName = document.getElementById('progression-ex-name');
    const progressionList = document.getElementById('progression-list');
    const backToHistoryBtn = document.getElementById('back-to-history-btn');
    const cancelActiveWorkoutBtn = document.getElementById('cancel-active-workout-btn');

    let currentActiveLog = null;
    let historyViewLog = null;
    let isEditingHistory = false;
    let currentEditingDayId = null;
    let currentEditingExId = null;

    // Info Button logic
    const infoBtn = document.getElementById('info-btn');
    if (infoBtn) {
        infoBtn.onclick = () => {
            alert('Data Management Info:\n\n- Full Export: Saves everything (Program, History, Settings).\n- Import Data: You can select any Workout Tracker JSON file. If it\'s a Full Backup, it replaces everything. If it\'s a Program or History file, it merges/replaces only that part.');
        };
    }

    // --- Event Listeners ---

    // --- Resume Draft Logic ---
    async function checkForDraft() {
        const logs = await workoutEngine.getAllLogs();
        const draft = logs.find(log => log.status === 'draft');
        if (draft) {
            resumeContainer.innerHTML = `
                <span>You have an unfinished workout from ${draft.date}.</span>
                <button id="resume-btn" style="margin-right: 10px;">Resume</button>
                <button id="discard-btn" style="color: red;">Discard</button>
            `;
            resumeContainer.style.display = 'block';

            document.getElementById('resume-btn').onclick = () => {
                currentActiveLog = draft;
                showActiveWorkout(draft);
                resumeContainer.style.display = 'none';
                startWorkoutBtn.style.display = 'none';
            };

            document.getElementById('discard-btn').onclick = async () => {
                if (confirm('Are you sure you want to discard this draft?')) {
                    await workoutEngine.deleteWorkoutLog(draft.id);
                    resumeContainer.style.display = 'none';
                }
            };
        } else {
            resumeContainer.style.display = 'none';
        }
    }

    await checkForDraft();

    // Null check wrapper for active workout actions
    function withActiveLog(callback) {
        return async (...args) => {
            const log = isEditingHistory ? historyViewLog : currentActiveLog;
            if (!log) {
                console.warn('App: no log (active or history) for this action.');
                return;
            }
            return await callback(...args);
        };
    }

    // Backup/Restore Logic
    exportBtn.addEventListener('click', async () => {
        try {
            await jsonTransferService.exportData();
            alert('Full data exported successfully.');
        } catch (error) {
            alert('Export failed: ' + error.message);
        }
    });

    exportProgramBtn.addEventListener('click', async () => {
        try {
            await jsonTransferService.exportProgram();
            alert('Program exported successfully.');
        } catch (error) {
            alert('Export failed: ' + error.message);
        }
    });

    exportHistoryBtn.addEventListener('click', async () => {
        try {
            await jsonTransferService.exportHistory();
            alert('History exported successfully.');
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

        // Peak inside the file for metadata before asking for confirmation
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const type = data.metadata?.type || 'full';
                let msg = 'Importing this file will merge its contents. Are you sure?';
                if (type === 'full') msg = 'Importing full data will REPLACE ALL your current data. Are you sure?';
                if (type === 'program') msg = 'Importing a program will REPLACE your current program template. Are you sure?';

                if (confirm(msg)) {
                    await jsonTransferService.importData(file);
                    alert('Data imported successfully. The page will now reload.');
                    window.location.reload();
                }
            } catch (error) {
                alert('Import failed: ' + error.message);
            }
        };
        reader.readAsText(file);
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
                <div class="exercises-list"></div>
                <div class="add-ex-section">
                    <button class="add-ex-btn" data-day-id="${day.id}">Add Exercise</button>
                    <div class="inline-add-editor-container" data-day-id="${day.id}" style="margin-top: 10px;"></div>
                </div>
            `;

            day.exercises.forEach(ex => {
            const dayElEx = document.createElement('div');
            dayElEx.className = 'exercise-item';
            dayElEx.style.borderBottom = '1px solid #eee';
            dayElEx.style.padding = '5px 0';

            const repsString = ex.targetSets.map(s => s.targetReps || s.maxReps || 0).join(', ');

            dayElEx.innerHTML = `
                <div style="font-weight: bold;">${ex.name}</div>
                <div style="font-size: 0.85em; color: #666;">
                    ${ex.bodyPartPrimary} | ${ex.defaultWeight.value}${ex.defaultWeight.unit} | Target Reps: ${repsString}
                </div>
                ${ex.notes ? `<div style="font-size: 0.8em; color: #888; font-style: italic; margin-top: 2px;">Cues: ${ex.notes}</div>` : ''}
                <div class="ex-actions" style="margin-top: 5px;">
                    <button class="edit-ex-btn" data-day-id="${day.id}" data-ex-id="${ex.id}">Edit</button>
                    <span class="history-anchor" data-ex-id="${ex.id}"></span>
                    <button class="delete-ex-btn" data-day-id="${day.id}" data-ex-id="${ex.id}">Delete</button>
                </div>
                <div class="inline-editor-container" data-ex-id="${ex.id}" style="margin-top: 10px;"></div>
            `;
            dayEl.querySelector('.exercises-list').appendChild(dayElEx);
        });
            programDaysList.appendChild(dayEl);

            // Inject inline history buttons
            day.exercises.forEach(ex => {
                const anchor = dayEl.querySelector(`.history-anchor[data-ex-id="${ex.id}"]`);
                if (anchor) createInlineHistoryUI(anchor, ex.id);
            });
        });

        // Attach listeners to dynamic buttons
        document.querySelectorAll('.add-ex-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentEditingDayId = e.target.dataset.dayId;
                currentEditingExId = null;
                const container = e.target.closest('.add-ex-section').querySelector('.inline-add-editor-container');
                container.appendChild(exerciseEditor);
                showExerciseEditor();
            });
        });

        document.querySelectorAll('.edit-ex-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                currentEditingDayId = e.target.dataset.dayId;
                currentEditingExId = e.target.dataset.exId;
                const container = e.target.closest('.exercise-item').querySelector('.inline-editor-container');
                container.appendChild(exerciseEditor);
                await showExerciseEditor(currentEditingDayId, currentEditingExId);
            });
        });

        // Removed .view-progression-btn listener as it's now handled by createInlineHistoryUI

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
            exTargetWeightInput.value = ex.defaultWeight.value;
            exTargetUnitInput.value = ex.defaultWeight.unit;
            exTargetSetsInput.value = ex.targetSets.map(s => s.targetReps || s.maxReps || 0).join(', ');
            exNotesInput.value = ex.notes || '';
            document.getElementById('ex-editor-title').innerText = 'Edit Exercise';
        } else {
            exNameInput.value = '';
            exBodyPartInput.value = '';
            exTargetWeightInput.value = 0;
            exTargetUnitInput.value = 'kg';
            exTargetSetsInput.value = '10, 10, 10';
            exNotesInput.value = '';
            document.getElementById('ex-editor-title').innerText = 'Add Exercise';
        }
    }

    saveExBtn.addEventListener('click', async () => {
        const name = exNameInput.value.trim();
        const bodyPart = exBodyPartInput.value.trim();
        const weight = parseFloat(exTargetWeightInput.value) || 0;
        const unit = exTargetUnitInput.value;
        const setsString = exTargetSetsInput.value.trim();
        const notes = exNotesInput.value.trim();

        if (!name) return alert('Name is required');

        const repsArray = setsString.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        const targetSets = repsArray.map((reps, i) => ({
            setNumber: i + 1,
            targetReps: reps
        }));

        const exerciseData = {
            name,
            bodyPartPrimary: bodyPart,
            defaultWeight: { value: weight, unit, label: '' },
            targetSets,
            repGoalType: 'fixed',
            notes
        };

        if (currentEditingExId) {
            const sync = confirm('Apply changes to all days where this exercise appears?');
            await templateService.updateExercise(currentEditingDayId, currentEditingExId, exerciseData, sync);
        } else {
            await templateService.addExercise(currentEditingDayId, {
                ...exerciseData,
                bodyPartSecondary: []
            });
        }

        exerciseEditor.style.display = 'none';
        document.getElementById('program-editor').appendChild(exerciseEditor);
        await renderProgram();
    });

    cancelExBtn.addEventListener('click', () => {
        exerciseEditor.style.display = 'none';
        document.getElementById('program-editor').appendChild(exerciseEditor);
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
                historyViewLog = null;
                isEditingHistory = false;
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
                    <div style="flex: 1;">
                        <h4 style="margin: 0;">${ex.name} (${ex.bodyPartPrimary})</h4>
                        ${ex.targetSnapshot.notes ? `<div style="font-size: 0.85em; color: #777; font-style: italic; margin-top: 2px;">Cues: ${ex.targetSnapshot.notes}</div>` : ''}
                        <div class="active-history-container" style="margin-top: 5px;">
                            <span class="active-history-anchor" data-ex-id="${ex.templateExerciseId}"></span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 5px; align-items: center; margin-left: 10px;">
                        <button class="promote-target-btn" data-ex-id="${ex.id}" title="Set as future target">Set Target</button>
                        <button class="remove-exercise-btn" data-ex-id="${ex.id}" style="color: red; padding: 2px 5px;">Delete</button>
                    </div>
                </div>
                <div class="logged-sets-list">
                    ${ex.actualSets.map((set, idx) => `
                        <div class="set-row" style="margin-bottom: 5px; font-size: 0.95em;">
                            <div style="color: #666; margin-bottom: 2px;">
                                Set ${set.setNumber} | Target: ${set.targetWeight}${set.unit} x ${set.targetReps}
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span>Weight: <input type="number" class="actual-weight" data-ex-id="${ex.id}" data-set-idx="${idx}" value="${set.actualWeight}" style="width: 50px; padding: 3px;"></span>
                                <span>Reps: <input type="number" class="actual-reps" data-ex-id="${ex.id}" data-set-idx="${idx}" value="${set.actualReps || ''}" style="width: 45px; padding: 3px;"></span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 10px;">
                    <button class="add-set-btn" data-ex-id="${ex.id}">+ Add Set</button>
                    <button class="remove-set-btn" data-ex-id="${ex.id}">- Remove Set</button>
                </div>
            `;
            activeExercisesList.appendChild(exEl);

            // Inject inline history for active workout
            if (ex.templateExerciseId) {
                const anchor = exEl.querySelector(`.active-history-anchor[data-ex-id="${ex.templateExerciseId}"]`);
                if (anchor) createInlineHistoryUI(anchor, ex.templateExerciseId);
            }
        });

        // Attach auto-save listeners
        document.querySelectorAll('.actual-reps, .actual-weight').forEach(input => {
            input.addEventListener('change', async (e) => {
                const exId = e.target.dataset.exId;
                const setIdx = parseInt(e.target.dataset.setIdx);
                const val = parseFloat(e.target.value);
                const field = e.target.classList.contains('actual-reps') ? 'actualReps' : 'actualWeight';

                const log = isEditingHistory ? historyViewLog : currentActiveLog;
                if (!log) return;
                await workoutEngine.updateSet(log.id, exId, setIdx, { [field]: val });
                // Update local object to reflect the change
                const ex = log.exercises.find(e => e.id === exId);
                ex.actualSets[setIdx][field] = val;
            });
        });

        // Attach add/remove set listeners
        document.querySelectorAll('.add-set-btn').forEach(btn => {
            btn.addEventListener('click', withActiveLog(async (e) => {
                const exId = e.target.dataset.exId;
                const log = isEditingHistory ? historyViewLog : currentActiveLog;
                const updatedLog = await workoutEngine.addSet(log.id, exId);
                if (isEditingHistory) historyViewLog = updatedLog;
                else currentActiveLog = updatedLog;
                renderActiveExercises(updatedLog);
            }));
        });

        document.querySelectorAll('.remove-set-btn').forEach(btn => {
            btn.addEventListener('click', withActiveLog(async (e) => {
                const exId = e.target.dataset.exId;
                const log = isEditingHistory ? historyViewLog : currentActiveLog;
                const updatedLog = await workoutEngine.removeLastSet(log.id, exId);
                if (isEditingHistory) historyViewLog = updatedLog;
                else currentActiveLog = updatedLog;
                renderActiveExercises(updatedLog);
            }));
        });

        // Attach remove exercise listener
        document.querySelectorAll('.remove-exercise-btn').forEach(btn => {
            btn.addEventListener('click', withActiveLog(async (e) => {
                const exId = e.target.dataset.exId;
                if (confirm('Remove this exercise from current workout?')) {
                    const log = isEditingHistory ? historyViewLog : currentActiveLog;
                    const updatedLog = await workoutEngine.removeExercise(log.id, exId);
                    if (isEditingHistory) historyViewLog = updatedLog;
                    else currentActiveLog = updatedLog;
                    renderActiveExercises(updatedLog);
                }
            }));
        });

        // Attach promote target listener
        document.querySelectorAll('.promote-target-btn').forEach(btn => {
            btn.addEventListener('click', withActiveLog(async (e) => {
                const exId = e.target.dataset.exId;
                const log = isEditingHistory ? historyViewLog : currentActiveLog;
                const ex = log.exercises.find(ex => ex.id === exId);
                if (!ex) return;

                const msg = `Update future targets for "${ex.name}" based on this performance?\n\n` +
                             `New Target Weight: ${ex.actualSets[ex.actualSets.length - 1].actualWeight}${ex.actualSets[0].unit}\n` +
                             `New Target Reps: ${ex.actualSets.map(s => s.actualReps || s.targetReps).join(', ')}`;

                if (confirm(msg)) {
                    const sync = confirm('Apply this target to ALL days where this exercise appears?');
                    try {
                        await workoutEngine.promoteToTarget(ex, templateService, sync);
                        alert('Targets updated successfully!');
                    } catch (error) {
                        alert('Promotion failed: ' + error.message);
                    }
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
        const log = isEditingHistory ? historyViewLog : currentActiveLog;
        const updatedLog = await workoutEngine.addExtraExercise(log.id, exTemplate);
        if (isEditingHistory) historyViewLog = updatedLog;
        else currentActiveLog = updatedLog;
        addExModal.style.display = 'none';
        renderActiveExercises(updatedLog);
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

        const log = isEditingHistory ? historyViewLog : currentActiveLog;
        const updatedLog = await workoutEngine.addExtraExercise(log.id, manualExTemplate);
        if (isEditingHistory) historyViewLog = updatedLog;
        else currentActiveLog = updatedLog;
        addExModal.style.display = 'none';
        renderActiveExercises(updatedLog);
    }));

    completeWorkoutBtn.addEventListener('click', withActiveLog(async () => {
        if (confirm('Complete workout?')) {
            const log = isEditingHistory ? historyViewLog : currentActiveLog;
            await workoutEngine.completeWorkout(log.id);
            if (!isEditingHistory) {
                alert('Workout completed and saved!');
            }
            activeWorkoutScreen.style.display = 'none';
            if (isEditingHistory) {
                historyScreen.style.display = 'block';
                historyViewLog = null;
                isEditingHistory = false;
                await renderHistory();
            } else {
                currentActiveLog = null;
                startWorkoutBtn.style.display = 'block';
            }
        }
    }));

    cancelActiveWorkoutBtn.addEventListener('click', () => {
        activeWorkoutScreen.style.display = 'none';
        if (isEditingHistory) {
            historyScreen.style.display = 'block';
            historyViewLog = null;
            isEditingHistory = false;
            // Restore active workout screen if it was there
            if (currentActiveLog) {
                activeWorkoutScreen.style.display = 'block';
                renderActiveExercises(currentActiveLog);
            }
        } else {
            currentActiveLog = null;
            startWorkoutBtn.style.display = 'block';
        }
    });

    // --- History & Progression UI Logic ---

    viewHistoryBtn.addEventListener('click', async () => {
        const isHidden = historyScreen.style.display === 'none';
        historyScreen.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            await renderHistory();
        } else {
            // If hiding history, also hide details if they were open from history
            if (isEditingHistory) {
                activeWorkoutScreen.style.display = 'none';
                historyViewLog = null;
                isEditingHistory = false;
                // If there was an active workout, show it again
                if (currentActiveLog) {
                    activeWorkoutScreen.style.display = 'block';
                    renderActiveExercises(currentActiveLog);
                }
            }
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
                    <button class="export-log-btn" data-log-id="${log.id}">Export</button>
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
                historyViewLog = log;
                isEditingHistory = true;
                showActiveWorkout(log);
            });
        });

        document.querySelectorAll('.export-log-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const logId = e.target.dataset.logId;
                const log = await workoutEngine.getLogById(logId);
                if (log) {
                    await jsonTransferService.exportWorkoutLog(log);
                    alert('Workout log exported successfully.');
                }
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
