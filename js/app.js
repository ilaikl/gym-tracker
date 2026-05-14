import { persistenceService } from './services/PersistenceService.js';
import { jsonTransferService } from './services/JSONTransferService.js';
import { templateService } from './services/TemplateService.js';
import { workoutEngine } from './services/WorkoutEngine.js';
import { progressionService } from './services/ProgressionService.js';
import { appInitializer } from './services/AppInitializer.js';
import { nutritionService } from './services/NutritionService.js';
import { ingredientService } from './services/IngredientService.js';
import { externalApiService } from './services/ExternalApiService.js';
import { authService } from './services/AuthService.js';
import { syncService } from './services/SyncService.js';

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

        // Load common exercises
        let commonExercises = [];
        try {
            const exDatalist = document.getElementById('existing-exercises-list');
            const manualExDatalist = document.getElementById('manual-exercises-list');

            // Phase 32: Use global library from PersistenceService
            commonExercises = await persistenceService.getAllExercises();

            // Fallback to fetching if empty (should be seeded by now)
            if (commonExercises.length === 0) {
                const response = await fetch('./data/exercises.json');
                commonExercises = await response.json();
            }

            const options = commonExercises.map(ex => `<option value="${ex.name}">`).join('');
            if (exDatalist) exDatalist.innerHTML = options;
            if (manualExDatalist) manualExDatalist.innerHTML = options;
        } catch (error) {
            console.error('Error loading common exercises:', error);
        }

        // Initialize Auth and Sync
        await authService.init();
        syncService.init();

        // Ensure commonExercises is accessible globally in the scope
        window.commonExercisesList = commonExercises;

        // Handle Auth UI
        const loginOverlay = document.getElementById('login-overlay');
        const googleLoginBtn = document.getElementById('google-login-btn');
        const skipLoginBtn = document.getElementById('skip-login-btn');
        const btnContinueOffline = document.getElementById('btn-continue-offline');
        const offlineBanner = document.getElementById('offline-banner');
        const userNameSpan = document.getElementById('user-name');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        // Check if user has skipped login before (session storage)
        const hasSkipped = sessionStorage.getItem('login-skipped');

        function updateAuthUI(user, isOfflineMode = false) {
            if (user || isOfflineMode) {
                loginOverlay.style.display = 'none';
                userNameSpan.textContent = user ? (user.displayName || user.email) : 'Offline Mode';
                loginBtn.style.display = 'none';
                logoutBtn.style.display = user ? 'block' : 'none';
            } else {
                userNameSpan.textContent = '';
                loginBtn.style.display = 'block';
                logoutBtn.style.display = 'none';

                if (!authService.isOnline()) {
                    offlineBanner.style.display = 'block';
                    googleLoginBtn.disabled = true;
                    googleLoginBtn.style.opacity = '0.5';
                    skipLoginBtn.style.display = 'none';
                    btnContinueOffline.style.display = 'block';
                } else {
                    offlineBanner.style.display = 'none';
                    googleLoginBtn.disabled = false;
                    googleLoginBtn.style.opacity = '1';
                    skipLoginBtn.style.display = 'block';
                    btnContinueOffline.style.display = 'none';
                }

                if (!hasSkipped) {
                    loginOverlay.style.display = 'flex';
                }
            }
        }

        window.addEventListener('auth-state-changed', (e) => {
            updateAuthUI(e.detail.user, e.detail.offline);
        });

        btnContinueOffline.onclick = () => {
            authService.continueOffline();
        };

        // Watch for connectivity changes
        window.addEventListener('online', () => {
            if (authService.isOfflineMode() && !authService.isAuthenticated()) {
                showOnlineRestoredBanner();
            }
            // Update login UI if visible
            if (loginOverlay.style.display === 'flex') {
                updateAuthUI(null);
            }
        });

        function showOnlineRestoredBanner() {
            // Check if banner already exists
            if (document.getElementById('online-restored-banner')) return;

            const banner = document.createElement('div');
            banner.id = 'online-restored-banner';
            banner.className = 'online-banner';
            banner.innerHTML = `
                <span>🌐 Back online!</span>
                <button id="btn-sync-now" style="margin-left: 10px; padding: 4px 8px; font-size: 0.8em;">Sign In & Sync</button>
                <button id="close-online-banner" style="background:none; border:none; margin-left:10px; cursor:pointer;">✕</button>
            `;
            document.body.prepend(banner);

            document.getElementById('btn-sync-now').onclick = () => {
                loginOverlay.style.display = 'flex';
                updateAuthUI(null);
                banner.remove();
            };
            document.getElementById('close-online-banner').onclick = () => banner.remove();
        }

        googleLoginBtn.onclick = async () => {
            try {
                await authService.signInWithGoogle();
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        };

        skipLoginBtn.onclick = () => {
            loginOverlay.style.display = 'none';
            sessionStorage.setItem('login-skipped', 'true');
        };

        loginBtn.onclick = () => {
            loginOverlay.style.display = 'flex';
        };

        logoutBtn.onclick = async () => {
            if (confirm('Are you sure you want to logout? Cloud sync will be disabled.')) {
                await authService.logout();
            }
        };

        // Initial UI state
        updateAuthUI(authService.getCurrentUser(), authService.isOfflineMode());

    } catch (error) {
        console.error('App: Failed to initialize app', error);
        alert('Application initialization failed: ' + error.message);
    }

    // --- Navigation Logic ---
    const navButtons = document.querySelectorAll('#navigation button');
    const sections = document.querySelectorAll('.app-section');

    function switchSection(targetId) {
        sections.forEach(sec => sec.style.display = 'none');
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = targetId === 'workout-section' && activeWorkoutScreen.style.display === 'flex' ? 'flex' : 'block';
        }

        // Hide special overlays if not in workout-section
        if (targetId !== 'workout-section') {
            console.log('App: Leaving workout section, hiding and stopping timer');
            activeWorkoutScreen.style.display = 'none';
            workoutBackBtn.style.display = 'none';
            restTimerOverlay.style.display = 'none';
            stopTimer();
        } else {
            console.log('App: Staying in or entering workout section');
            if (activeWorkoutScreen.style.display === 'none') {
                // If the active workout screen is hidden, ensure main workout section parts are visible
                startWorkoutBtn.style.display = 'block';
                checkForDraft();
            }
        }

        navButtons.forEach(b => {
            const btnSectionId = b.id.replace('nav-', '').replace('-btn', '') + '-section';
            if (btnSectionId === targetId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        if (targetId === 'nutrition-section') {
            renderNutritionDay();
        } else if (targetId === 'nutrition-history-section') {
            renderNutritionHistory();
        } else if (targetId === 'history-section') {
            renderHistory();
        } else if (targetId === 'program-section') {
            renderProgram();
        }
    }

    navButtons.forEach(btn => {
        btn.onclick = () => {
            const sectionId = btn.id.replace('nav-', '').replace('-btn', '') + '-section';
            switchSection(sectionId);
        };
    });

    // --- Nutrition UI Variables ---
    const mealsList = document.getElementById('meals-list');
    const addMealBtn = document.getElementById('add-meal-btn');
    const finishNutDayBtn = document.getElementById('finish-nut-day-btn');
    const ingredientModal = document.getElementById('ingredient-modal');
    const ingSearchInput = document.getElementById('ing-search-input');
    const ingSearchOnlineBtn = document.getElementById('ing-search-online-btn');
    const ingSearchResults = document.getElementById('ing-search-results');
    const ingNameInput = document.getElementById('ing-name');
    const ingWeightInput = document.getElementById('ing-weight');
    const ingCal100Input = document.getElementById('ing-cal-100');
    const ingPro100Input = document.getElementById('ing-pro-100');
    const ingCarb100Input = document.getElementById('ing-carb-100');
    const ingFat100Input = document.getElementById('ing-fat-100');
    const saveIngredientBtn = document.getElementById('save-ingredient-btn');
    const closeIngredientModalBtn = document.getElementById('close-ingredient-modal');
    const totalCaloriesSpan = document.getElementById('total-calories');
    const totalProteinSpan = document.getElementById('total-protein');
    const totalCarbsSpan = document.getElementById('total-carbs');
    const totalFatsSpan = document.getElementById('total-fats');
    const showMealHistoryBtn = document.getElementById('show-meal-history-btn');
    const mealHistoryModal = document.getElementById('meal-history-modal');
    const mealSearchInput = document.getElementById('meal-search-input');
    const mealSearchResults = document.getElementById('meal-search-results');
    const closeMealHistoryModalBtn = document.getElementById('close-meal-history-modal');

    const editMealModal = document.getElementById('edit-meal-modal');
    const editMealNameInput = document.getElementById('edit-meal-name');
    const editMealIngredientsList = document.getElementById('edit-meal-ingredients-list');
    const editMealAddIngBtn = document.getElementById('edit-meal-add-ing-btn');
    const saveEditMealBtn = document.getElementById('save-edit-meal-btn');
    const closeEditMealModalBtn = document.getElementById('close-edit-meal-modal');
    const ingredientModalTitle = document.getElementById('ingredient-modal-title');

    let currentNutritionLog = null;
    let currentNutritionDate = new Date().toISOString().split('T')[0];
    let currentSelectedMealId = null;
    let currentEditingMealId = null;
    let temporaryEditingMeal = null; // To hold the meal being edited before saving

    // --- Nutrition History Logic ---
    const addNutDayInput = document.getElementById('add-nut-day-input');
    const addNutDayBtn = document.getElementById('add-nut-day-btn');

    if (addNutDayBtn) {
        addNutDayBtn.onclick = async () => {
            const date = addNutDayInput.value;
            if (!date) {
                alert('Please select a date.');
                return;
            }
            await nutritionService.getLog(date); // Creates and saves if doesn't exist
            await renderNutritionHistory();
            alert(`Nutrition log for ${date} initialized.`);
        };
    }

    async function renderNutritionHistory() {
        const historyList = document.getElementById('nutrition-history-list');
        if (!historyList) return;
        historyList.innerHTML = '<p>Loading history...</p>';

        const summaries = await nutritionService.getHistorySummaries();

        if (summaries.length === 0) {
            historyList.innerHTML = '<p>No nutrition history found.</p>';
            return;
        }

        historyList.innerHTML = summaries.map(s => {
            const getStatusColor = (macro) => {
                const status = s.status && s.status.detail ? s.status.detail[macro] : s.status;
                if (status === 'green') return '#27ae60';
                if (status === 'yellow' || status === 'orange') return '#f39c12';
                return '#e74c3c';
            };

            const getOverallColor = () => {
                const overall = s.status && s.status.overall ? s.status.overall : s.status;
                if (overall === 'green') return '#27ae60';
                if (overall === 'yellow' || overall === 'orange') return '#f39c12';
                return '#e74c3c';
            };

            const formatTarget = (target) => {
                if (target && typeof target === 'object' && target.min !== undefined) {
                    return `${target.min}-${target.max}`;
                }
                return target || 0;
            };

            const targets = s.targetData || s.target;

            return `
            <div class="history-item" style="border-left: 8px solid ${getOverallColor()}; padding: 15px; margin-bottom: 15px; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); cursor: pointer;" onclick="window.navToNutritionDate('${s.date}')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <strong style="font-size: 1.1em;">${s.date}</strong>
                        ${s.isCompleted ? '<span style="background: #27ae60; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em;">FINISHED</span>' : ''}
                    </div>
                    <span style="font-size: 0.85em; background: #f0f0f0; padding: 3px 8px; border-radius: 12px; color: #555;">
                        ${s.isTrainingDay ? 'Training Day' : 'Rest Day'}
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 0.9em;">
                    <div style="color: ${getStatusColor('calories')}"><strong>Cal:</strong> ${Math.round(s.totals.calories)} (${formatTarget(targets.calories || targets.cal)})</div>
                    <div style="color: ${getStatusColor('protein')}"><strong>Pro:</strong> ${Math.round(s.totals.protein)} (${formatTarget(targets.protein || targets.pro)})g</div>
                    <div style="color: ${getStatusColor('carbs')}"><strong>Carb:</strong> ${Math.round(s.totals.carbs)} (${formatTarget(targets.carbs || targets.carb)})g</div>
                    <div style="color: ${getStatusColor('fats')}"><strong>Fat:</strong> ${Math.round(s.totals.fats)} (${formatTarget(targets.fats || targets.fat)})g</div>
                </div>
                <div style="margin-top: 10px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="btn-secondary export-nut-log-btn" data-date="${s.date}" style="font-size: 0.8em; padding: 4px 8px;">Export</button>
                    <button class="btn-secondary delete-nut-log-btn" data-date="${s.date}" style="font-size: 0.8em; padding: 4px 8px; color: #e74c3c;">Delete</button>
                </div>
            </div>
        `;}).join('');

            // Add event listeners
            document.querySelectorAll('.export-nut-log-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    const date = btn.dataset.date;
                    const log = await nutritionService.getLog(date);
                    if (log) {
                        await jsonTransferService.exportNutritionLog(log);
                    }
                };
            });

            document.querySelectorAll('.delete-nut-log-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    const date = btn.dataset.date;
                    if (confirm(`Are you sure you want to delete the nutrition log for ${date}?`)) {
                        await nutritionService.deleteLog(date);
                        await renderNutritionHistory();
                    }
                };
            });
        }

    // Global helper for navigation from history
    window.navToNutritionDate = (date) => {
        currentNutritionDate = date;
        switchSection('nutrition-section');
    };
    async function showMealEditor(meal) {
        currentEditingMealId = meal.id;
        temporaryEditingMeal = JSON.parse(JSON.stringify(meal)); // Deep copy for editing

        editMealNameInput.value = temporaryEditingMeal.name;
        renderEditMealIngredients();
        editMealModal.style.display = 'block';
    }

    function renderEditMealIngredients() {
        editMealIngredientsList.innerHTML = '';
        temporaryEditingMeal.ingredients.forEach((ing, index) => {
            const item = document.createElement('div');
            item.className = 'edit-ing-item';
            item.style = 'display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px;';
            item.innerHTML = `
                <div style="flex: 2;"><strong>${ing.name}</strong></div>
                <div style="flex: 1;">
                    <input type="number" class="edit-ing-weight" data-index="${index}" value="${ing.weight}" style="width: 70px;"> g
                </div>
                <div style="flex: 1; font-size: 0.85em; color: #666;">
                    ${Math.round(ing.calories)} cal
                </div>
                <button class="remove-edit-ing-btn" data-index="${index}" style="color: red; background: none; border: none; cursor: pointer;">✕</button>
            `;
            editMealIngredientsList.appendChild(item);
        });

        // Add listeners for weight change
        document.querySelectorAll('.edit-ing-weight').forEach(input => {
            input.onchange = async () => {
                const index = parseInt(input.dataset.index);
                const newWeight = parseFloat(input.value);
                if (!isNaN(newWeight) && newWeight > 0) {
                    const ing = temporaryEditingMeal.ingredients[index];
                    const ingTemplate = await ingredientService.getById(ing.id);
                    if (ingTemplate) {
                        const macros = ingredientService.calculateMacros(ingTemplate, newWeight);
                        ing.weight = newWeight;
                        Object.assign(ing, macros);
                        renderEditMealIngredients(); // Re-render to update cal display
                    }
                }
            };
        });

        // Add listeners for removal
        document.querySelectorAll('.remove-edit-ing-btn').forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index);
                temporaryEditingMeal.ingredients.splice(index, 1);
                renderEditMealIngredients();
            };
        });
    }

    editMealAddIngBtn.onclick = () => {
        currentSelectedMealId = 'temporary'; // Special flag for edit modal
        ingredientModalTitle.textContent = 'Add Ingredient to Meal';
        openIngredientModal();
    };

    saveEditMealBtn.onclick = async () => {
        temporaryEditingMeal.name = editMealNameInput.value.trim();
        if (!temporaryEditingMeal.name) {
            alert('Please enter a meal name.');
            return;
        }

        await nutritionService.updateMeal(currentNutritionLog, currentEditingMealId, temporaryEditingMeal);
        editMealModal.style.display = 'none';
        renderMeals();
        updateNutritionSummary();
    };

    closeEditMealModalBtn.onclick = () => {
        editMealModal.style.display = 'none';
        currentEditingMealId = null;
        temporaryEditingMeal = null;
    };

    async function renderNutritionDay(date) {
        if (date) currentNutritionDate = date;
        currentNutritionLog = await nutritionService.getLog(currentNutritionDate);
        updateNutritionSummary();
        renderMeals();
    }

    async function updateNutritionSummary() {
        const totals = nutritionService.calculateDayTotals(currentNutritionLog);

        // Compare with targets
        const settings = await persistenceService.getById('settings', 'current') || {};
        const workouts = await persistenceService.getAll('workoutLogs');
        const workoutsOnDate = workouts.filter(w => w.date === currentNutritionLog.date && w.status === 'completed');

        const isTrainDay = workoutsOnDate.length > 0;
        const globalTargets = settings.nutritionTargets || {};
        const targetsSnapshot = currentNutritionLog.targetsSnapshot || globalTargets;
        const targets = isTrainDay ? targetsSnapshot.trainingDay : targetsSnapshot.restDay;

        const dateLabel = document.getElementById('nutrition-date-label');
        if (dateLabel) {
            dateLabel.innerText = `${currentNutritionLog.date} (${isTrainDay ? 'Training' : 'Rest'} Day)`;
        }

        const summaryCard = document.getElementById('nutrition-summary-card');
        if (!summaryCard) return;

        summaryCard.className = 'nutrition-summary-card';
        summaryCard.innerHTML = '';

        const macros = [
            { label: 'Calories', key: 'calories', unit: '', total: totals.calories, target: targets?.calories },
            { label: 'Protein', key: 'protein', unit: 'g', total: totals.protein, target: targets?.protein },
            { label: 'Carbs', key: 'carbs', unit: 'g', total: totals.carbs, target: targets?.carbs },
            { label: 'Fats', key: 'fats', unit: 'g', total: totals.fats, target: targets?.fats }
        ];

        macros.forEach(m => {
            const status = nutritionService.evaluateMacroStatus(m.total, m.target);
            let color = '#e74c3c'; // red
            if (status === 'green') color = '#27ae60';
            if (status === 'yellow' || status === 'orange') color = '#f39c12';

            const isRange = m.target && typeof m.target === 'object' && m.target.min !== undefined;
            const targetDisplay = isRange ? `${m.target.min}-${m.target.max}${m.unit}` : (m.target ? `${m.target}${m.unit}` : '-');
            const targetMax = isRange ? m.target.max : (m.target || 0);
            const percent = targetMax > 0 ? (m.total / targetMax) * 100 : 0;

            const statDiv = document.createElement('div');
            statDiv.className = 'macro-stat';
            statDiv.innerHTML = `
                <strong>${m.label}</strong>
                <span class="value" style="color: ${color}">${Math.round(m.total)}${m.unit}</span>
                <span class="target">/ ${targetDisplay}</span>
                <div class="macro-progress-bar">
                    <div class="macro-progress-fill" style="width: ${Math.min(percent, 100)}%; background: ${color}"></div>
                </div>
            `;
            summaryCard.appendChild(statDiv);
        });
    }

    function renderMeals() {
        if (!mealsList) return;
        mealsList.innerHTML = '';
        currentNutritionLog.meals.forEach(meal => {
            const totals = nutritionService.calculateMealTotals(meal);
            const mealCard = document.createElement('div');
            mealCard.className = 'meal-card';
            mealCard.innerHTML = `
                <div class="meal-card-header">
                    <h4>${meal.name}</h4>
                    <div class="meal-header-actions">
                        <small style="color: #666; margin-right: 5px;">${Math.round(totals.calories)} kcal</small>
                        <button class="btn-icon edit-meal-name-btn" data-meal-id="${meal.id}" title="Edit Name">✏️</button>
                        <button class="btn-icon delete remove-meal-btn" data-meal-id="${meal.id}" title="Remove Meal">✕</button>
                    </div>
                </div>
                <div class="ingredients-list">
                    ${meal.ingredients.map(ing => `
                        <div class="ingredient-row">
                            <div class="ingredient-info">
                                <span class="ingredient-name">${ing.name}</span>
                                <span class="ingredient-details">${ing.weight}g | ${Math.round(ing.calories)} cal | P: ${Math.round(ing.protein)}g | C: ${Math.round(ing.carbs)}g | F: ${Math.round(ing.fats)}g</span>
                            </div>
                            <div class="ingredient-actions">
                                <button class="btn-icon edit edit-ing-btn" data-meal-id="${meal.id}" data-ing-name="${ing.name}" title="Edit Weight">✏️</button>
                                <button class="btn-icon delete remove-ing-btn" data-meal-id="${meal.id}" data-ing-name="${ing.name}" title="Remove">✕</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="meal-card-footer">
                    <button class="add-ingredient-btn add-ing-to-meal-btn" data-meal-id="${meal.id}">+ Add Ingredient</button>
                </div>
            `;
            mealsList.appendChild(mealCard);
        });

        // Add Meal Event Listeners
        document.querySelectorAll('.add-ing-to-meal-btn').forEach(btn => {
            btn.onclick = () => {
                currentSelectedMealId = btn.dataset.mealId;
                openIngredientModal();
            };
        });

        document.querySelectorAll('.edit-meal-name-btn').forEach(btn => {
            btn.onclick = async () => {
                const mealId = btn.dataset.mealId;
                const meal = currentNutritionLog.meals.find(m => m.id === mealId);
                const newName = prompt('Enter new meal name:', meal.name);
                if (newName && newName.trim()) {
                    await nutritionService.updateMealName(currentNutritionLog, mealId, newName.trim());
                    renderMeals();
                }
            };
        });

        document.querySelectorAll('.remove-meal-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('Remove this entire meal?')) {
                    await nutritionService.removeMeal(currentNutritionLog, btn.dataset.mealId);
                    renderMeals();
                    updateNutritionSummary();
                }
            };
        });

        document.querySelectorAll('.edit-ing-btn').forEach(btn => {
            btn.onclick = async () => {
                const mealId = btn.dataset.mealId;
                const ingName = btn.dataset.ingName;
                const meal = currentNutritionLog.meals.find(m => m.id === mealId);
                const ing = meal.ingredients.find(i => i.name === ingName);

                const newWeight = prompt(`Update weight for ${ingName} (g):`, ing.weight);
                if (newWeight && !isNaN(parseFloat(newWeight))) {
                    await nutritionService.updateIngredient(currentNutritionLog, mealId, ingName, parseFloat(newWeight));
                    renderMeals();
                    updateNutritionSummary();
                }
            };
        });

        document.querySelectorAll('.remove-ing-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm(`Remove ${btn.dataset.ingName} from this meal?`)) {
                    await nutritionService.removeIngredient(currentNutritionLog, btn.dataset.mealId, btn.dataset.ingName);
                    renderMeals();
                    updateNutritionSummary();
                }
            };
        });
    }

    addMealBtn.onclick = async () => {
        const mealName = prompt('Enter meal name (e.g., Breakfast, Lunch):');
        if (mealName !== null && mealName.trim() !== '') {
            nutritionService.addMeal(currentNutritionLog, mealName.trim());
            await nutritionService.saveLog(currentNutritionLog);
            renderMeals();
            updateNutritionSummary();
        }
    };

    // --- Meal History Logic ---
    showMealHistoryBtn.onclick = () => {
        mealHistoryModal.style.display = 'block';
        mealSearchInput.value = '';
        mealSearchResults.style.display = 'none';
        mealSearchInput.focus();
    };

    closeMealHistoryModalBtn.onclick = () => {
        mealHistoryModal.style.display = 'none';
    };

    mealSearchInput.oninput = async () => {
        const query = mealSearchInput.value.trim();
        if (query.length < 2) {
            mealSearchResults.style.display = 'none';
            return;
        }

        const results = await nutritionService.searchHistoricalMeals(query);
        if (results.length > 0) {
            mealSearchResults.innerHTML = results.map(meal => `
                <div class="search-result-item" data-meal-name="${meal.name}" style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;">
                    <strong>${meal.name}</strong><br>
                    <small>${meal.ingredients.length} ingredients</small>
                </div>
            `).join('');
            mealSearchResults.style.display = 'block';

            document.querySelectorAll('#meal-search-results .search-result-item').forEach(item => {
                item.onclick = async () => {
                    const mealName = item.dataset.mealName;
                    const fullMeal = results.find(m => m.name === mealName);

                    if (fullMeal) {
                        // Clone the meal
                        const newMeal = nutritionService.addMeal(currentNutritionLog, fullMeal.name);
                        newMeal.ingredients = JSON.parse(JSON.stringify(fullMeal.ingredients)); // Deep copy

                        await nutritionService.saveLog(currentNutritionLog);
                        renderMeals();
                        updateNutritionSummary();
                        mealHistoryModal.style.display = 'none';
                    }
                };
            });
        } else {
            mealSearchResults.innerHTML = '<div style="padding: 10px;">No meals found</div>';
            mealSearchResults.style.display = 'block';
        }
    };

    finishNutDayBtn.onclick = async () => {
        currentNutritionLog.status = 'completed';
        await nutritionService.saveLog(currentNutritionLog);

        const totals = nutritionService.calculateDayTotals(currentNutritionLog);
        const settings = await persistenceService.getById('settings', 'current') || {};
        const workouts = await persistenceService.getAll('workoutLogs');
        const workoutsOnDate = workouts.filter(w => w.date === currentNutritionLog.date && w.status === 'completed');

        const isTrainDay = workoutsOnDate.length > 0;
        const targets = settings.nutritionTargets ?
            (isTrainDay ? settings.nutritionTargets.trainingDay : settings.nutritionTargets.restDay) : null;

        let message = `Daily Summary for ${currentNutritionLog.date} (${isTrainDay ? 'Training' : 'Rest'} Day):\n\n`;
        message += `Calories: ${Math.round(totals.calories)}${targets ? ' / ' + targets.calories : ''}\n`;
        message += `Protein: ${Math.round(totals.protein)}g${targets ? ' / ' + targets.protein + 'g' : ''}\n`;
        message += `Carbs: ${Math.round(totals.carbs)}g${targets ? ' / ' + targets.carbs + 'g' : ''}\n`;
        message += `Fats: ${Math.round(totals.fats)}g${targets ? ' / ' + targets.fats + 'g' : ''}\n`;

        if (targets) {
            const calDiff = Math.round(totals.calories - targets.calories);
            message += `\nStatus: ${calDiff > 0 ? '+' + calDiff : calDiff} kcal vs Target`;
        }

        alert(message);
    };

    function openIngredientModal() {
        ingredientModal.style.display = 'block';
        ingSearchInput.value = '';
        ingNameInput.value = '';
        ingWeightInput.value = '100';
        ingCal100Input.value = '';
        ingPro100Input.value = '';
        ingCarb100Input.value = '';
        ingFat100Input.value = '';
        ingSearchResults.style.display = 'none';
    }

    ingSearchInput.oninput = async () => {
        const query = ingSearchInput.value.trim();
        if (query.length < 2) {
            ingSearchResults.style.display = 'none';
            return;
        }
        const results = await ingredientService.search(query);
        renderIngredientSearchResults(results);
    };

    ingSearchOnlineBtn.onclick = async () => {
        const query = ingSearchInput.value.trim();
        if (!query) return alert('Enter a search term');

        ingSearchOnlineBtn.disabled = true;
        ingSearchOnlineBtn.innerText = 'Searching...';

        try {
            const results = await externalApiService.searchFood(query);
            renderIngredientSearchResults(results);
        } catch (e) {
            alert('Error searching online');
        } finally {
            ingSearchOnlineBtn.disabled = false;
            ingSearchOnlineBtn.innerText = 'Search Online';
        }
    };

    function renderIngredientSearchResults(results) {
        if (results.length > 0) {
            ingSearchResults.innerHTML = results.map(ing => `
                <div class="ing-search-item"
                     data-name="${ing.name.replace(/"/g, '&quot;')}"
                     data-cal="${ing.caloriesPer100g}"
                     data-pro="${ing.proteinPer100g}"
                     data-carb="${ing.carbsPer100g}"
                     data-fat="${ing.fatsPer100g}">
                    ${ing.name} ${ing.brand ? `(${ing.brand})` : ''} - ${ing.caloriesPer100g} cal/100g
                </div>
            `).join('');
            ingSearchResults.style.display = 'block';

            document.querySelectorAll('.ing-search-item').forEach(item => {
                item.onclick = () => {
                    ingNameInput.value = item.dataset.name;
                    ingCal100Input.value = item.dataset.cal;
                    ingPro100Input.value = item.dataset.pro;
                    ingCarb100Input.value = item.dataset.carb;
                    ingFat100Input.value = item.dataset.fat;
                    ingSearchResults.style.display = 'none';
                    ingSearchInput.value = item.dataset.name;
                };
            });
        } else {
            ingSearchResults.innerHTML = '<div style="padding: 10px; font-size: 0.85em; color: #666;">No results found.</div>';
            ingSearchResults.style.display = 'block';
        }
    }

    saveIngredientBtn.onclick = async () => {
        const name = ingNameInput.value.trim();
        const weight = parseFloat(ingWeightInput.value);
        const cal100 = parseFloat(ingCal100Input.value);
        const pro100 = parseFloat(ingPro100Input.value);
        const carb100 = parseFloat(ingCarb100Input.value);
        const fat100 = parseFloat(ingFat100Input.value);

        if (!name || isNaN(weight) || isNaN(cal100)) {
            alert('Please fill in name, weight, and calories.');
            return;
        }

        const ingredientData = {
            id: name.toLowerCase().replace(/\s+/g, '_'),
            name,
            caloriesPer100g: cal100,
            proteinPer100g: pro100 || 0,
            carbsPer100g: carb100 || 0,
            fatsPer100g: fat100 || 0
        };

        await nutritionService.addIngredientToMeal(currentNutritionLog, currentSelectedMealId, ingredientData, weight);
        await nutritionService.saveLog(currentNutritionLog);

        ingredientModal.style.display = 'none';
        renderMeals();
        updateNutritionSummary();
    };

    closeIngredientModalBtn.onclick = () => {
        ingredientModal.style.display = 'none';
    };

    // --- Settings UI ---
    const targetTrainCalMin = document.getElementById('target-train-cal-min');
    const targetTrainCalMax = document.getElementById('target-train-cal-max');
    const targetTrainCalCritMinus = document.getElementById('target-train-cal-crit-minus');
    const targetTrainCalCritPlus = document.getElementById('target-train-cal-crit-plus');
    const targetTrainProMin = document.getElementById('target-train-pro-min');
    const targetTrainProMax = document.getElementById('target-train-pro-max');
    const targetTrainProCritMinus = document.getElementById('target-train-pro-crit-minus');
    const targetTrainProCritPlus = document.getElementById('target-train-pro-crit-plus');
    const targetTrainCarbMin = document.getElementById('target-train-carb-min');
    const targetTrainCarbMax = document.getElementById('target-train-carb-max');
    const targetTrainCarbCritMinus = document.getElementById('target-train-carb-crit-minus');
    const targetTrainCarbCritPlus = document.getElementById('target-train-carb-crit-plus');
    const targetTrainFatMin = document.getElementById('target-train-fat-min');
    const targetTrainFatMax = document.getElementById('target-train-fat-max');
    const targetTrainFatCritMinus = document.getElementById('target-train-fat-crit-minus');
    const targetTrainFatCritPlus = document.getElementById('target-train-fat-crit-plus');

    const targetRestCalMin = document.getElementById('target-rest-cal-min');
    const targetRestCalMax = document.getElementById('target-rest-cal-max');
    const targetRestCalCritMinus = document.getElementById('target-rest-cal-crit-minus');
    const targetRestCalCritPlus = document.getElementById('target-rest-cal-crit-plus');
    const targetRestProMin = document.getElementById('target-rest-pro-min');
    const targetRestProMax = document.getElementById('target-rest-pro-max');
    const targetRestProCritMinus = document.getElementById('target-rest-pro-crit-minus');
    const targetRestProCritPlus = document.getElementById('target-rest-pro-crit-plus');
    const targetRestCarbMin = document.getElementById('target-rest-carb-min');
    const targetRestCarbMax = document.getElementById('target-rest-carb-max');
    const targetRestCarbCritMinus = document.getElementById('target-rest-carb-crit-minus');
    const targetRestCarbCritPlus = document.getElementById('target-rest-carb-crit-plus');
    const targetRestFatMin = document.getElementById('target-rest-fat-min');
    const targetRestFatMax = document.getElementById('target-rest-fat-max');
    const targetRestFatCritMinus = document.getElementById('target-rest-fat-crit-minus');
    const targetRestFatCritPlus = document.getElementById('target-rest-fat-crit-plus');

    const saveSettingsBtn = document.getElementById('save-settings-btn');

    async function loadSettings() {
        const settings = await persistenceService.getById('settings', 'current') || {};
        const nt = settings.nutritionTargets || {};
        const train = nt.trainingDay || {};
        const rest = nt.restDay || {};

        // Helper to fill range inputs
        const fill = (macro, target) => {
            const minEl = document.getElementById(`target-${macro}-min`);
            const maxEl = document.getElementById(`target-${macro}-max`);
            const critMinusEl = document.getElementById(`target-${macro}-crit-minus`);
            const critPlusEl = document.getElementById(`target-${macro}-crit-plus`);

            if (target && typeof target === 'object' && target.min !== undefined) {
                if (minEl) minEl.value = target.min;
                if (maxEl) maxEl.value = target.max;
                if (critMinusEl) critMinusEl.value = target.critMinus !== undefined ? target.critMinus : (target.criticality || 0);
                if (critPlusEl) critPlusEl.value = target.critPlus !== undefined ? target.critPlus : (target.criticality || 0);
            } else if (target) {
                // Backward compatibility for single values
                if (minEl) minEl.value = target;
                if (maxEl) maxEl.value = target;
            }
        };

        fill('train-cal', train.calories);
        fill('train-pro', train.protein);
        fill('train-carb', train.carbs);
        fill('train-fat', train.fats);

        fill('rest-cal', rest.calories);
        fill('rest-pro', rest.protein);
        fill('rest-carb', rest.carbs);
        fill('rest-fat', rest.fats);
    }

    saveSettingsBtn.onclick = async () => {
        const settings = await persistenceService.getById('settings', 'current') || {};

        const getRange = (prefix) => ({
            min: parseFloat(document.getElementById(`${prefix}-min`).value) || 0,
            max: parseFloat(document.getElementById(`${prefix}-max`).value) || 0,
            critMinus: parseFloat(document.getElementById(`${prefix}-crit-minus`).value) || 0,
            critPlus: parseFloat(document.getElementById(`${prefix}-crit-plus`).value) || 0
        });

        settings.nutritionTargets = {
            trainingDay: {
                calories: getRange('target-train-cal'),
                protein: getRange('target-train-pro'),
                carbs: getRange('target-train-carb'),
                fats: getRange('target-train-fat')
            },
            restDay: {
                calories: getRange('target-rest-cal'),
                protein: getRange('target-rest-pro'),
                carbs: getRange('target-rest-carb'),
                fats: getRange('target-rest-fat')
            }
        };
        await persistenceService.save('settings', settings, 'current');
        alert('Settings saved!');
    };

    loadSettings();

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
    const programEditor = document.getElementById('program-editor');
    const programDaysList = document.getElementById('program-days-list');
    const addDayBtn = document.getElementById('add-day-btn');

    // Exercise Editor
    const exerciseEditor = document.getElementById('exercise-editor');
    const exNameInput = document.getElementById('ex-name');
    const exDatalist = document.getElementById('existing-exercises-list');
    const manualExDatalist = document.getElementById('manual-exercises-list');
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

    // --- Rest Timer ---
    const restTimerOverlay = document.getElementById('rest-timer-overlay');
    const timerDisplay = document.getElementById('timer-display');
    const timerPauseBtn = document.getElementById('timer-pause-btn');
    const timerResetBtn = document.getElementById('timer-reset-btn');
    const hideTimerBtn = document.getElementById('hide-timer-btn');

    let timerInterval = null;
    let timerSeconds = 0;
    let isTimerPaused = false;

    function startTimer() {
        if (timerInterval) {
            console.log('Timer: Interval already exists, clearing it before restart');
            clearInterval(timerInterval);
        }
        console.log('Timer: Starting');
        restTimerOverlay.style.display = 'flex';
        restTimerOverlay.style.zIndex = '10000'; // Force extremely high z-index
        isTimerPaused = false;
        timerPauseBtn.textContent = 'Pause';

        // Use a self-referencing interval to ensure it's not cleared by mistake elsewhere
        timerInterval = setInterval(() => {
            if (!isTimerPaused) {
                timerSeconds++;
                console.log('Timer: Tick', timerSeconds);
                updateTimerDisplay();
            } else {
                console.log('Timer: Paused, no tick');
            }
        }, 1000);
        console.log('Timer: Interval started with ID', timerInterval);
    }

    function stopTimer() {
        console.log('Timer: Stopping and clearing interval ID', timerInterval);
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
        timerSeconds = 0;
        updateTimerDisplay();
        console.log('Timer: Stopped');
    }

    function pauseTimer() {
        isTimerPaused = !isTimerPaused;
        timerPauseBtn.textContent = isTimerPaused ? 'Resume' : 'Pause';
    }

    function resetTimer() {
        timerSeconds = 0;
        updateTimerDisplay();
        if (isTimerPaused) {
            isTimerPaused = false;
            timerPauseBtn.textContent = 'Pause';
        }
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timerSeconds / 60);
        const secs = timerSeconds % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    timerPauseBtn.onclick = pauseTimer;
    timerResetBtn.onclick = resetTimer;
    hideTimerBtn.onclick = () => {
        restTimerOverlay.style.display = 'none';
        // stopTimer(); // User wanted "unhide" option, let it keep running
    };
    const completeWorkoutBtn = document.getElementById('complete-workout-btn');

    // Add Exercise Modal UI
    const addExModal = document.getElementById('add-ex-modal');
    const showAddExModalBtn = document.getElementById('show-add-ex-modal-btn');
    const closeAddExModalBtn = document.getElementById('close-add-ex-modal');
    const toggleExistingBtn = document.getElementById('toggle-existing-ex');
    const toggleManualBtn = document.getElementById('toggle-manual-ex');
    const existingExContainer = document.getElementById('existing-ex-container');
    const manualExContainer = document.getElementById('manual-ex-container');
    const addExistingExConfirm = document.getElementById('add-existing-ex-confirm');
    const addManualExConfirm = document.getElementById('add-manual-ex-confirm');

    // Replace Exercise Modal UI — Phase 37 (PLAN-037 | R51 | LLD-037)
    const replaceExModal = document.getElementById('replace-ex-modal');
    const closeReplaceModalBtn = document.getElementById('close-replace-modal');
    const replaceExInfo = document.getElementById('replace-ex-info');
    const replaceSubMuscleSection = document.getElementById('replace-submuscle-section');
    const replaceSubMuscleList = document.getElementById('replace-submuscle-list');
    const replaceMuscleSection = document.getElementById('replace-muscle-section');
    const replaceMuscleList = document.getElementById('replace-muscle-list');
    const replaceNoResults = document.getElementById('replace-noresults');

    // Progression UI Elements (Inline)
    function createInlineHistoryUI(container, exerciseId, buttonContainer = null) {
        const historyBtn = document.createElement('button');
        historyBtn.innerText = 'Progress';
        historyBtn.className = 'view-progression-btn';
        historyBtn.dataset.exTemplateId = exerciseId;
        historyBtn.style.width = '100%';

        const historyContainer = document.createElement('div');
        historyContainer.className = 'inline-history-container active-history-container';
        historyContainer.style.display = 'none';
        historyContainer.style.marginTop = '10px';
        historyContainer.style.fontSize = '0.9em';
        historyContainer.style.padding = '10px';
        historyContainer.style.background = '#fff';
        historyContainer.style.border = '1px solid #ddd';
        historyContainer.style.borderRadius = '8px';
        historyContainer.style.backgroundColor = '#f9f9f9';
        historyContainer.style.boxSizing = 'border-box';
        historyContainer.style.width = '100%';

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

        if (buttonContainer) {
            buttonContainer.appendChild(historyBtn);
        } else {
            container.appendChild(historyBtn);
        }
        container.appendChild(historyContainer);
    }

    // History & Progression UI
    const historyScreen = document.getElementById('history-screen');
    const historyList = document.getElementById('history-list');
    const progressionScreen = document.getElementById('progression-screen');
    const progressionExName = document.getElementById('progression-ex-name');
    const progressionList = document.getElementById('progression-list');
    const backToHistoryBtn = document.getElementById('back-to-history-btn');
    const cancelActiveWorkoutBtn = document.getElementById('cancel-active-workout-btn');
    const workoutBackBtn = document.getElementById('workout-back-btn');
    const toggleBarsBtn = document.getElementById('toggle-bars-btn');
    let lastAutoToggleTime = 0; // Move out of scope to be shared

    if (toggleBarsBtn) {
        toggleBarsBtn.onclick = () => {
            const header = document.getElementById('workout-header');
            const footer = document.getElementById('active-workout-footer');
            if (header.classList.contains('minimized')) {
                header.classList.remove('minimized');
                footer.classList.remove('minimized');
                toggleBarsBtn.textContent = '☰';
            } else {
                header.classList.add('minimized');
                footer.classList.add('minimized');
                toggleBarsBtn.textContent = '⛶'; // Fullscreen symbol
            }
            lastAutoToggleTime = Date.now(); // Update cooldown on manual toggle too
        };
    }

    if (activeExercisesList) {
        let lastScrollTop = 0;
        const TOGGLE_COOLDOWN = 300; // ms

        activeExercisesList.onscroll = () => {
            const now = Date.now();
            const header = document.getElementById('workout-header');
            const footer = document.getElementById('active-workout-footer');
            if (!header || !footer) return;

            const currentScrollTop = activeExercisesList.scrollTop;
            const scrollHeight = activeExercisesList.scrollHeight;
            const clientHeight = activeExercisesList.clientHeight;

            // If scrolled to bottom (threshold 40px), automatically expand bars
            const isAtBottom = (scrollHeight - currentScrollTop - clientHeight) < 40;
            // If scrolled to top (threshold 40px), automatically expand bars
            const isAtTop = currentScrollTop < 40;

            if (now - lastAutoToggleTime > TOGGLE_COOLDOWN) {
                if (isAtBottom || isAtTop) {
                    if (header.classList.contains('minimized')) {
                        header.classList.remove('minimized');
                        footer.classList.remove('minimized');
                        if (toggleBarsBtn) toggleBarsBtn.textContent = '☰';
                        console.log(`UI: Auto-expanding bars at ${isAtBottom ? 'bottom' : 'top'} of scroll`);
                        lastAutoToggleTime = now;
                    }
                } else if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
                    // If scrolling down significantly, minimize bars
                    if (!header.classList.contains('minimized')) {
                        header.classList.add('minimized');
                        footer.classList.add('minimized');
                        if (toggleBarsBtn) toggleBarsBtn.textContent = '⛶';
                        console.log('UI: Auto-minimizing bars when scrolling down');
                        lastAutoToggleTime = now;
                    }
                }
            }

            lastScrollTop = currentScrollTop;
        };
    }

    let currentActiveLog = null;
    let historyViewLog = null;
    let isEditingHistory = false;
    let currentEditingDayId = null;
    let currentEditingExId = null;

    const existingExDatalist = document.getElementById('existing-exercises-list');
    const uniqueExercisesMap = new Map();

    async function populateExerciseDatalist() {
        const program = await templateService.getProgram();
        if (!program) return;
        uniqueExercisesMap.clear();
        existingExDatalist.innerHTML = '';
        program.days.forEach(day => {
            day.exercises.forEach(ex => {
                if (!uniqueExercisesMap.has(ex.name)) {
                    uniqueExercisesMap.set(ex.name, ex);
                    const option = document.createElement('option');
                    option.value = ex.name;
                    existingExDatalist.appendChild(option);
                }
            });
        });
    }

    exNameInput.addEventListener('input', () => {
        const name = exNameInput.value.trim();
        if (uniqueExercisesMap.has(name)) {
            const ex = uniqueExercisesMap.get(name);
            // Auto-fill if empty or confirmed
            if (!exBodyPartInput.value.trim() || confirm(`Exercise "${name}" found in program. Copy details?`)) {
                exBodyPartInput.value = ex.bodyPartPrimary;
                exTargetWeightInput.value = ex.defaultWeight.value;
                exTargetUnitInput.value = ex.defaultWeight.unit;
                exTargetSetsInput.value = ex.targetSets.map(s => s.targetReps || s.maxReps || 0).join(', ');
                exNotesInput.value = ex.notes || '';
            }
        }
    });

    // Info Button logic
    const toggleRestTimerBtn = document.getElementById('toggle-rest-timer-btn');
    if (toggleRestTimerBtn) {
        toggleRestTimerBtn.onclick = () => {
            console.log('Timer: Toggle button clicked. Current display:', restTimerOverlay.style.display);
            if (restTimerOverlay.style.display === 'flex') {
                restTimerOverlay.style.display = 'none';
                console.log('Timer: Hiding overlay');
            } else {
                restTimerOverlay.style.display = 'flex';
                restTimerOverlay.style.zIndex = '10000';
                console.log('Timer: Showing overlay');
                if (!timerInterval) {
                    console.log('Timer: Starting timer from toggle button');
                    startTimer();
                }
                updateTimerDisplay();
            }
        };
    }

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
        const sectionHistory = document.getElementById('workout-section-history');
        const sectionHistoryList = document.getElementById('workout-section-history-list');

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
                if (sectionHistory) sectionHistory.style.display = 'none';
            };

            document.getElementById('discard-btn').onclick = async () => {
                if (confirm('Are you sure you want to discard this draft?')) {
                    await workoutEngine.deleteWorkoutLog(draft.id);
                    resumeContainer.style.display = 'none';
                    await checkForDraft(); // Refresh history too
                }
            };
        } else {
            resumeContainer.style.display = 'none';
        }

        // Also render quick history in workout section
        if (sectionHistory && sectionHistoryList) {
            sectionHistory.style.display = 'block';
            const completedLogs = logs.filter(l => l.status === 'completed').slice(-5).reverse();
            sectionHistoryList.innerHTML = '';
            if (completedLogs.length === 0) {
                sectionHistoryList.innerHTML = '<p>No recent history.</p>';
            } else {
                completedLogs.forEach(log => {
                    const item = document.createElement('div');
                    item.style.padding = '8px';
                    item.style.borderBottom = '1px solid #eee';
                    item.style.display = 'flex';
                    item.style.justifyContent = 'space-between';
                    item.innerHTML = `<span>${log.date} - ${log.dayName}</span><button class="view-log-btn" data-log-id="${log.id}" style="width:auto; padding: 4px 8px; font-size: 0.8em;">View</button>`;
                    sectionHistoryList.appendChild(item);
                });
                sectionHistoryList.querySelectorAll('.view-log-btn').forEach(btn => {
                    btn.onclick = async (e) => {
                        const logId = e.target.dataset.logId;
                        const log = await workoutEngine.getLogById(logId);
                        historyViewLog = log;
                        isEditingHistory = true;
                        showActiveWorkout(log);
                    };
                });
            }
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

    // Reset All Data Logic
    const resetAllDataBtn = document.getElementById('reset-all-data-btn');
    if (resetAllDataBtn) {
        resetAllDataBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to reset all workout and nutrition history? This will also revert your program to the default template. This action cannot be undone.')) {
                return;
            }

            // Final confirmation for such a destructive action
            if (!confirm('FINAL WARNING: This will permanently delete ALL your logs. Proceed?')) {
                return;
            }

            try {
                await persistenceService.clearStore('workoutLogs');
                await persistenceService.clearStore('nutritionLogs');
                await persistenceService.clearStore('program');
                await persistenceService.clearStore('settings');
                await persistenceService.clearStore('ingredients');

                // Re-seed default program and settings
                await appInitializer.init();

                alert('Data reset successful. The app will now reload.');
                window.location.reload();
            } catch (error) {
                console.error('Reset failed:', error);
                alert('Failed to reset data: ' + error.message);
            }
        });
    }

    // Program Editor Logic
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
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4 style="margin: 0;">${day.name} (${day.type})</h4>
                    <button class="delete-day-btn btn-danger btn-sm" data-day-id="${day.id}" title="Delete Day">🗑</button>
                </div>
                <div class="exercises-list" data-day-id="${day.id}"></div>
                <div class="add-ex-section" style="margin-top: 10px;">
                    <button class="add-ex-btn" data-day-id="${day.id}">Add Exercise</button>
                    <div class="inline-add-editor-container" data-day-id="${day.id}" style="margin-top: 10px;"></div>
                </div>
            `;

            day.exercises.forEach(ex => {
            const dayElEx = document.createElement('div');
            dayElEx.className = 'exercise-item program-ex-card';
            dayElEx.dataset.exId = ex.id;
            dayElEx.style.borderBottom = '1px solid #eee';
            dayElEx.style.padding = '10px 0';
            dayElEx.style.display = 'block'; // Ensure it's block, overriding .exercise-item flex

            const repsString = ex.targetSets.map(s => s.targetReps || s.maxReps || 0).join(', ');

            dayElEx.innerHTML = `
                <div class="program-ex-details-row">
                    <!-- Column 1: Name and Drag Handle -->
                    <div class="name-column">
                        <div class="drag-handle">⠿</div>
                        <div class="card-header" style="padding: 0;">${ex.name}</div>
                    </div>

                    <!-- Column 2: Info (Targets/Cues) -->
                    <div class="info-column">
                        <div class="target-info-block" style="margin: 0;">
                            <strong>Target:</strong> ${ex.bodyPartPrimary} | ${ex.defaultWeight.value}${ex.defaultWeight.unit} | Reps: ${repsString}
                        </div>
                        ${ex.notes ? `<div class="cues-info-block" style="margin: 0;"><strong>Cues:</strong> ${ex.notes}</div>` : ''}
                    </div>

                    <!-- Column 3: Actions (Buttons) -->
                    <div class="actions-column">
                        <button class="edit-ex-btn" data-day-id="${day.id}" data-ex-id="${ex.id}">Edit</button>
                        <button class="delete-ex-btn" data-day-id="${day.id}" data-ex-id="${ex.id}">Delete</button>
                        <div class="progress-btn-anchor" data-ex-id="${ex.id}"></div>
                    </div>
                </div>

                <!-- Progress Container: Spans full width outside the details row -->
                <div class="history-anchor-fullwidth" data-ex-id="${ex.id}" style="width: 100%; box-sizing: border-box;"></div>
                <div class="inline-editor-container" data-ex-id="${ex.id}" style="margin-top: 10px; width: 100%; box-sizing: border-box;"></div>
            `;
            dayEl.querySelector('.exercises-list').appendChild(dayElEx);
        });
            programDaysList.appendChild(dayEl);

            // Inject inline history buttons
            day.exercises.forEach(ex => {
                const anchor = dayEl.querySelector(`.history-anchor-fullwidth[data-ex-id="${ex.id}"]`);
                const btnAnchor = dayEl.querySelector(`.progress-btn-anchor[data-ex-id="${ex.id}"]`);
                if (anchor) createInlineHistoryUI(anchor, ex.id, btnAnchor);
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

        document.querySelectorAll('.delete-day-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const dayId = e.target.dataset.dayId;
                const program = await templateService.getProgram();
                const day = program.days.find(d => d.id === dayId);
                const dayName = day ? day.name : 'this day';

                if (confirm(`Delete day "${dayName}"? This will also delete all exercises in this day. This cannot be undone.`)) {
                    await templateService.deleteDay(dayId);
                    await renderProgram();
                }
            });
        });

        // Initialize Sortable for each day's exercise list
        document.querySelectorAll('.exercises-list').forEach(listEl => {
            new Sortable(listEl, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: async (evt) => {
                    const dayId = evt.to.dataset.dayId;
                    const exerciseIds = Array.from(evt.to.children).map(child => child.dataset.exId);
                    await templateService.reorderExercises(dayId, exerciseIds);
                    // No need to re-render, Sortable already moved the DOM element
                }
            });
        });
    }

    async function showExerciseEditor(dayId, exId) {
        exerciseEditor.style.display = 'block';
        await populateExerciseDatalist();
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

    // Exercise Picker Logic
    const pickerModal = document.getElementById('exercise-picker-modal');
    const pickerSearch = document.getElementById('picker-search');
    const pickerCategories = document.getElementById('picker-categories');
    const closePickerModalBtn = document.getElementById('close-picker-modal');
    let currentPickerCallback = null;

    async function openExercisePicker(callback) {
        currentPickerCallback = callback;
        pickerModal.style.display = 'flex';
        pickerSearch.value = '';
        await renderPickerCategories();
    }

    async function renderPickerCategories(filter = '') {
        const exercises = await persistenceService.getAllExercises();
        const grouped = {};

        exercises.forEach(ex => {
            const muscle = ex.muscle || 'Other';
            if (!grouped[muscle]) grouped[muscle] = [];

            if (!filter || ex.name.toLowerCase().includes(filter.toLowerCase())) {
                grouped[muscle].push(ex);
            }
        });

        pickerCategories.innerHTML = '';

        // Sort muscle groups: manual/my exercises first, then alphabetical
        const muscles = Object.keys(grouped).sort((a, b) => {
            const aIsManual = a === 'My Exercises' || a === 'Manual';
            const bIsManual = b === 'My Exercises' || b === 'Manual';
            if (aIsManual && !bIsManual) return -1;
            if (!aIsManual && bIsManual) return 1;
            return a.localeCompare(b);
        });

        muscles.forEach(muscle => {
            if (grouped[muscle].length === 0) return;

            const catDiv = document.createElement('div');
            catDiv.className = 'picker-category';

            const catHeader = document.createElement('div');
            catHeader.className = 'picker-category-header';
            catHeader.innerHTML = `<span>${muscle} (${grouped[muscle].length})</span><span class="toggle-icon">▼</span>`;
            catHeader.onclick = () => {
                const list = catDiv.querySelector('.picker-exercise-list');
                const icon = catHeader.querySelector('.toggle-icon');
                if (list.style.display === 'none') {
                    list.style.display = 'block';
                    icon.innerText = '▲';
                } else {
                    list.style.display = 'none';
                    icon.innerText = '▼';
                }
            };

            const exList = document.createElement('div');
            exList.className = 'picker-exercise-list';
            exList.style.display = filter ? 'block' : 'none'; // Auto-expand if searching

            grouped[muscle].forEach(ex => {
                const exItem = document.createElement('div');
                exItem.className = 'picker-exercise-item';
                exItem.innerHTML = `
                    <div class="ex-name">${ex.name}</div>
                    <div class="ex-info">${ex.equipment || ''} ${ex.difficulty ? '· ' + ex.difficulty : ''}</div>
                `;
                exItem.onclick = async () => {
                    // Phase 41: Fresh read for latest targets before calling back
                    const fresh = await persistenceService.getExercise(ex.id) || ex;
                    pickerModal.style.display = 'none';
                    currentPickerCallback(fresh);
                };
                exList.appendChild(exItem);
            });

            catDiv.appendChild(catHeader);
            catDiv.appendChild(exList);
            pickerCategories.appendChild(catDiv);
        });
    }

    pickerSearch.oninput = () => renderPickerCategories(pickerSearch.value);
    closePickerModalBtn.onclick = () => {
        pickerModal.style.display = 'none';
        // If there's a pending add modal context, re-show it
        if (addExModal && addExModal.dataset.reopenOnClose === 'true') {
            addExModal.dataset.reopenOnClose = '';
            addExModal.style.display = 'flex';
        }
    };

    // Hook up pickers to existing forms
    exNameInput.onclick = () => {
        openExercisePicker((ex) => {
            exNameInput.value = ex.name;
            exBodyPartInput.value = ex.muscle || ex.bodyPartPrimary || '';
            exNotesInput.value = ex.notes || ex.instructions || '';

            // Phase 36: Pre-fill targets from global library
            if (ex.targetWeight !== undefined) {
                exTargetWeightInput.value = ex.targetWeight;
            } else if (ex.defaultWeight) {
                exTargetWeightInput.value = ex.defaultWeight.value;
                exTargetUnitInput.value = ex.defaultWeight.unit;
            }

            if (ex.targetSets && Array.isArray(ex.targetSets)) {
                exTargetSetsInput.value = ex.targetSets.map(s => s.targetReps || 0).join(', ');
            } else if (ex.targetReps && Array.isArray(ex.targetReps)) {
                exTargetSetsInput.value = ex.targetReps.join(', ');
            }
        });
    };

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
        console.log('App: Showing active workout');
        activeWorkoutScreen.style.display = 'flex'; // Set display to flex
        switchSection('workout-section'); // Ensure we are in workout section
        startWorkoutScreen.style.display = 'none';
        historyScreen.style.display = 'none';
        workoutBackBtn.style.display = 'block';
        activeDayName.innerText = `${log.dayName} - ${log.date}`;

        // Ensure resume and menu parts of workout section are hidden while active
        startWorkoutBtn.style.display = 'none';
        resumeContainer.style.display = 'none';
        const sectionHistory = document.getElementById('workout-section-history');
        if (sectionHistory) sectionHistory.style.display = 'none';

        // Ensure Rest Timer overlay is visible by default when entering active workout
        console.log('App: Auto-showing Rest Timer');
        restTimerOverlay.style.display = 'flex';
        restTimerOverlay.style.zIndex = '10000';
        updateTimerDisplay();

        // Start timer automatically if not already running when entering workout
        if (!timerInterval) {
            console.log('App: Auto-starting Rest Timer on enter');
            startTimer();
        }

        renderActiveExercises(log);
    }

    function renderActiveExercises(log) {
        activeExercisesList.innerHTML = '';
        log.exercises.forEach(ex => {
            const exEl = document.createElement('div');
            exEl.className = 'logged-exercise-card';
            exEl.dataset.exId = ex.id;

            const targetWeight = ex.actualSets[0]?.targetWeight || 0;
            const targetSets = ex.actualSets.length;
            const targetReps = ex.actualSets[0]?.targetReps || 0;

            exEl.innerHTML = `
                <div class="card-row" style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <div class="drag-handle" style="flex: 0 0 auto;">⠿</div>
                    <div class="card-header" style="flex: 1;">${ex.name}</div>
                    <button class="remove-exercise-btn" data-ex-id="${ex.id}" style="width: auto; padding: 6px 10px; margin: 0; font-size: 0.8em; background-color: transparent; color: var(--danger); border: 1px solid #ffcccc;">Remove</button>
                </div>

                <div class="target-info-block" style="width: 100%; display: block; box-sizing: border-box; margin-bottom: 12px;">
                    <strong>Target:</strong> ${targetSets} x ${targetReps} @ ${targetWeight}kg
                </div>

                ${ex.targetSnapshot.notes ? `<div class="cues-info-block" style="width: 100%; display: block; box-sizing: border-box; margin-bottom: 12px;"><strong>Cues:</strong> ${ex.targetSnapshot.notes}</div>` : ''}

                <div class="logged-sets-list" style="margin-bottom: 15px; border-top: 1px solid #eee; padding-top: 10px;">
                    ${ex.actualSets.map((set, idx) => `
                        <div class="set-row" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0;">
                            <div style="font-weight: bold; color: #555;">Set ${set.setNumber} <span class="set-target-label">×${set.targetReps || 0}</span></div>
                            <div style="display: flex; gap: 10px;">
                                <input type="number" class="actual-weight" data-ex-id="${ex.id}" data-set-idx="${idx}" value="${set.actualWeight}" placeholder="kg" style="width: 70px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <input type="number" class="actual-reps" data-ex-id="${ex.id}" data-set-idx="${idx}" value="${set.actualReps || ''}" placeholder="reps" style="width: 70px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="card-actions horizontal-actions" style="display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 10px !important; width: 100% !important;">
                    <button class="add-set-btn" data-ex-id="${ex.id}" style="flex: 1 1 0% !important; min-width: 80px !important; margin: 0 !important; width: auto !important;">+ Set</button>
                    <button class="remove-set-btn" data-ex-id="${ex.id}" style="flex: 1 1 0% !important; min-width: 80px !important; margin: 0 !important; width: auto !important;">- Set</button>
                    <button class="replace-exercise-btn" data-ex-id="${ex.id}" style="flex: 1 1 0% !important; min-width: 80px !important; margin: 0 !important; width: auto !important;">Replace</button>
                    <button class="promote-target-btn" data-ex-id="${ex.id}" style="flex: 1 1 0% !important; min-width: 80px !important; margin: 0 !important; width: auto !important;">Promote</button>
                </div>

                <div class="active-history-fullwidth" data-ex-id="${ex.templateExerciseId}" style="width: 100%;">
                    <span class="active-history-anchor" data-ex-id="${ex.templateExerciseId}"></span>
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
                const val = parseFloat(e.target.value) || 0;
                const field = e.target.classList.contains('actual-reps') ? 'actualReps' : 'actualWeight';

                const log = isEditingHistory ? historyViewLog : currentActiveLog;
                if (!log) return;
                await workoutEngine.updateSet(log.id, exId, setIdx, { [field]: val });

                // Start/Reset Rest Timer when a set is completed (reps > 0)
                if (field === 'actualReps' && val > 0 && !isEditingHistory) {
                    resetTimer();
                    startTimer();
                }

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

        // Attach replace exercise listener
        document.querySelectorAll('.replace-exercise-btn').forEach(btn => {
            btn.addEventListener('click', withActiveLog(async (e) => {
                const exId = e.target.dataset.exId;
                const log = isEditingHistory ? historyViewLog : currentActiveLog;
                const loggedEx = log.exercises.find(ex => ex.id === exId);
                if (loggedEx) {
                    openReplaceModal(log.id, loggedEx);
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

        // Initialize Sortable for active workout — Phase 39 (PLAN-039 | R53 | LLD-039)
        new Sortable(activeExercisesList, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            forceFallback: true,        // JS fallback drag — required for real mobile
            fallbackOnBody: true,       // Append ghost to body (avoids stacking context issues)
            fallbackTolerance: 3,
            delay: 150,                 // ms hold before drag activates
            delayOnTouchOnly: true,     // Only apply delay on touch, not mouse
            touchStartThreshold: 5,     // px movement before drag begins
            onEnd: async (evt) => {
                const exerciseIds = Array.from(activeExercisesList.children).map(child => child.dataset.exId);
                const log = isEditingHistory ? historyViewLog : currentActiveLog;
                if (!log) return;
                const updatedLog = await workoutEngine.reorderExercises(log.id, exerciseIds);
                if (isEditingHistory) historyViewLog = updatedLog;
                else currentActiveLog = updatedLog;
            }
        });
    }

    // --- Add Exercise Modal Logic ---
    showAddExModalBtn.addEventListener('click', () => {
        addExModal.style.display = 'flex';
        // Default to existing tab
        existingExContainer.style.display = 'block';
        manualExContainer.style.display = 'none';
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

    // Phase 40: "Browse Exercise Library" opens the categorized picker
    // (PLAN-040 | R54 | LLD-040)
    addExistingExConfirm.addEventListener('click', withActiveLog(() => {
        addExModal.style.display = 'none';
        openExercisePicker(async (ex) => {
            // Phase 41: Fresh read for latest targets
            const fresh = await persistenceService.getExercise(ex.id) || ex;
            // Build template compatible with workoutEngine.addExtraExercise
            const exTemplate = buildExerciseTemplate(fresh);
            const log = isEditingHistory ? historyViewLog : currentActiveLog;
            const updatedLog = await workoutEngine.addExtraExercise(log.id, exTemplate);
            if (isEditingHistory) historyViewLog = updatedLog;
            else currentActiveLog = updatedLog;
            renderActiveExercises(updatedLog);
        });
    }));

    /**
     * Builds a template object compatible with WorkoutEngine.snapshotExercise
     * from a global exercises-store record.
     */
    function buildExerciseTemplate(ex) {
        const targetSets = ex.targetSets && ex.targetSets.length > 0
            ? ex.targetSets
            : Array.from({ length: ex.targetReps && Array.isArray(ex.targetReps) ? ex.targetReps.length : 3 },
                (_, i) => ({ setNumber: i + 1, targetReps: Array.isArray(ex.targetReps) ? ex.targetReps[i] || 10 : (ex.targetReps || 10) }));

        return {
            id: ex.id,
            name: ex.name,
            bodyPartPrimary: ex.muscle || ex.bodyPartPrimary || '',
            bodyPartSecondary: ex.bodyPartSecondary || [],
            targetSets,
            repGoalType: 'fixed',
            defaultWeight: ex.defaultWeight || { value: ex.targetWeight || 0, unit: 'kg', label: '' },
            notes: ex.notes || ex.instructions || '',
            source: ex.source || 'library'
        };
    }

    // Phase 40: Manual exercise name taps open picker for existing, or allow free text
    // (PLAN-040 | R54 | LLD-040)
    const manualExNameEl = document.getElementById('manual-ex-name');
    const manualExBodyPartEl = document.getElementById('manual-ex-bodypart');
    manualExNameEl.addEventListener('click', () => {
        openExercisePicker((ex) => {
            manualExNameEl.value = ex.name;
            manualExBodyPartEl.value = ex.muscle || ex.bodyPartPrimary || '';
            document.getElementById('manual-ex-notes').value = ex.notes || ex.instructions || '';
            if (ex.targetWeight !== undefined) document.getElementById('manual-ex-weight').value = ex.targetWeight;
            if (ex.targetSets && ex.targetSets.length > 0) {
                document.getElementById('manual-ex-sets').value = ex.targetSets.length;
                document.getElementById('manual-ex-reps').value = ex.targetSets[0].targetReps || 10;
            } else if (Array.isArray(ex.targetReps) && ex.targetReps.length > 0) {
                document.getElementById('manual-ex-sets').value = ex.targetReps.length;
                document.getElementById('manual-ex-reps').value = ex.targetReps[0];
            }
            // Re-show add modal after picker closes
            addExModal.style.display = 'flex';
        });
        // Hide add modal while picker is open
        addExModal.style.display = 'none';
    });

    addManualExConfirm.addEventListener('click', withActiveLog(async () => {
        const name = document.getElementById('manual-ex-name').value.trim();
        const bodyPart = document.getElementById('manual-ex-bodypart').value.trim();
        const setsCount = parseInt(document.getElementById('manual-ex-sets').value) || 3;
        const reps = parseInt(document.getElementById('manual-ex-reps').value) || 10;
        const weight = parseFloat(document.getElementById('manual-ex-weight').value) || 0;
        const notes = document.getElementById('manual-ex-notes').value || '';

        if (!name) return alert('Exercise name is required');

        const targetSets = [];
        for (let i = 1; i <= setsCount; i++) {
            targetSets.push({ setNumber: i, targetReps: reps });
        }

        const manualId = `manual_${Date.now()}`;
        const manualExTemplate = {
            id: manualId,
            name,
            muscle: bodyPart || 'My Exercises',
            bodyPartPrimary: bodyPart || 'My Exercises',
            bodyPartSecondary: [],
            targetSets,
            targetReps: reps,
            targetWeight: weight,
            repGoalType: 'fixed',
            defaultWeight: { value: weight, unit: 'kg', label: '' },
            notes,
            source: 'manual'
        };

        // Phase 40/54: Always save to global exercises library so it appears in picker
        try {
            await persistenceService.saveExercise(manualExTemplate);
            if (window.commonExercisesList) {
                window.commonExercisesList.push(manualExTemplate);
            }
        } catch (err) {
            console.error('Error saving manual exercise to library:', err);
        }

        const log = isEditingHistory ? historyViewLog : currentActiveLog;
        const updatedLog = await workoutEngine.addExtraExercise(log.id, manualExTemplate);
        if (isEditingHistory) historyViewLog = updatedLog;
        else currentActiveLog = updatedLog;

        // Clear fields
        manualExNameEl.value = '';
        manualExBodyPartEl.value = '';
        document.getElementById('manual-ex-sets').value = '3';
        document.getElementById('manual-ex-reps').value = '10';
        document.getElementById('manual-ex-weight').value = '0';
        document.getElementById('manual-ex-notes').value = '';

        addExModal.style.display = 'none';
        renderActiveExercises(updatedLog);
    }));

    // --- Replace Exercise Modal Logic --- Phase 37 (PLAN-037 | R51 | LLD-037)
    async function openReplaceModal(logId, loggedEx) {
        const muscle = loggedEx.bodyPartPrimary || loggedEx.muscle || '';
        const subMuscle = loggedEx.subMuscle || '';
        replaceExInfo.innerText = `Replacing: ${loggedEx.name}${subMuscle ? ' (' + subMuscle + ')' : ''}`;
        replaceSubMuscleList.innerHTML = '<p style="padding:8px;color:#888;">Loading...</p>';
        replaceMuscleList.innerHTML = '';
        replaceSubMuscleSection.style.display = 'none';
        replaceMuscleSection.style.display = 'none';
        replaceNoResults.style.display = 'none';
        replaceExModal.style.display = 'flex';

        try {
            const currentId = loggedEx.templateExerciseId || loggedEx.id;

            // 1. Sub-muscle query (precise match)
            let subMatches = [];
            if (subMuscle) {
                subMatches = (await persistenceService.getExercisesBySubMuscle(subMuscle))
                    .filter(ex => ex.id !== currentId);
            }

            // 2. Broad muscle fallback
            const broadMatches = (await persistenceService.getExercisesByMuscle(muscle))
                .filter(ex => ex.id !== currentId && !subMatches.some(sm => sm.id === ex.id));

            renderReplacementList(replaceSubMuscleList, subMatches, logId, loggedEx.id);
            renderReplacementList(replaceMuscleList, broadMatches, logId, loggedEx.id);

            replaceSubMuscleSection.style.display = subMatches.length > 0 ? 'block' : 'none';
            replaceMuscleSection.style.display = broadMatches.length > 0 ? 'block' : 'none';
            replaceNoResults.style.display = (subMatches.length === 0 && broadMatches.length === 0) ? 'block' : 'none';
        } catch (err) {
            console.error('Error loading replacement suggestions:', err);
            replaceSubMuscleList.innerHTML = '<p style="color:red;padding:8px;">Error loading suggestions.</p>';
            replaceSubMuscleSection.style.display = 'block';
        }
    }

    function renderReplacementList(container, list, logId, oldLoggedExId) {
        container.innerHTML = '';
        list.forEach(ex => {
            const btn = document.createElement('button');
            btn.className = 'replacement-item-btn';
            btn.style.cssText = 'width:100%;text-align:left;padding:10px;margin-bottom:5px;background:#f0f0f0;border:1px solid #ddd;border-radius:4px;cursor:pointer;font-size:0.95em;';
            btn.innerHTML = `<strong>${ex.name}</strong>${ex.equipment ? '<br><small style="color:#888;">' + ex.equipment + '</small>' : ''}`;
            btn.onclick = async () => {
                const updatedLog = await workoutEngine.replaceExercise(logId, oldLoggedExId, ex);
                if (isEditingHistory) historyViewLog = updatedLog;
                else currentActiveLog = updatedLog;
                renderActiveExercises(updatedLog);
                replaceExModal.style.display = 'none';
            };
            container.appendChild(btn);
        });
    }

    closeReplaceModalBtn.onclick = () => {
        replaceExModal.style.display = 'none';
    };

    completeWorkoutBtn.addEventListener('click', withActiveLog(async () => {
        if (confirm('Complete workout?')) {
            const log = isEditingHistory ? historyViewLog : currentActiveLog;
            await workoutEngine.completeWorkout(log.id);
            if (!isEditingHistory) {
                alert('Workout completed and saved!');
            }
            console.log('App: Completing workout');
            activeWorkoutScreen.style.display = 'none';
            workoutBackBtn.style.display = 'none'; // Ensure back button is hidden
            restTimerOverlay.style.display = 'none';
            stopTimer();
            if (isEditingHistory) {
                historyScreen.style.display = 'block';
                historyViewLog = null;
                isEditingHistory = false;
                switchSection('history-section');
                await renderHistory();
            } else {
                currentActiveLog = null;
                switchSection('workout-section');
                startWorkoutBtn.style.display = 'block';
            }
        }
    }));

    cancelActiveWorkoutBtn.addEventListener('click', () => {
        console.log('App: Exiting active workout via Cancel');
        activeWorkoutScreen.style.display = 'none';
        workoutBackBtn.style.display = 'none';
        restTimerOverlay.style.display = 'none';
        stopTimer();
        if (isEditingHistory) {
            historyScreen.style.display = 'block';
            historyViewLog = null;
            isEditingHistory = false;
            // Restore active workout screen if it was there
            if (currentActiveLog) {
                activeWorkoutScreen.style.display = 'block';
                workoutBackBtn.style.display = 'block';
                renderActiveExercises(currentActiveLog);
            }
        } else {
            currentActiveLog = null;
            startWorkoutBtn.style.display = 'block';
        }
    });

    workoutBackBtn.addEventListener('click', () => {
        if (isEditingHistory) {
            // When viewing history details, "Back" should return to history list
            activeWorkoutScreen.style.display = 'none';
            workoutBackBtn.style.display = 'none';
            historyScreen.style.display = 'block';
            historyViewLog = null;
            isEditingHistory = false;
            switchSection('history-section');
            renderHistory();
        } else {
            // "Back" should now hide the active workout screen and return to workout section
            console.log('App: Hiding active workout screen to return to menu');
            activeWorkoutScreen.style.display = 'none';
            workoutBackBtn.style.display = 'none';
            // We stay in workout-section, but now active screen is hidden, so we show the menu
            startWorkoutBtn.style.display = 'block';
            checkForDraft();
        }
    });

    // --- History & Progression UI Logic ---
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
