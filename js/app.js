import { persistenceService } from './services/PersistenceService.js';
import { jsonTransferService } from './services/JSONTransferService.js';
import { templateService } from './services/TemplateService.js';
import { workoutEngine } from './services/WorkoutEngine.js';
import { progressionService } from './services/ProgressionService.js';
import { appInitializer } from './services/AppInitializer.js';
import { nutritionService } from './services/NutritionService.js';
import { ingredientService } from './services/IngredientService.js';

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

    // --- Navigation Logic ---
    const navButtons = document.querySelectorAll('#navigation button');
    const sections = document.querySelectorAll('.app-section');

    function switchSection(targetId) {
        sections.forEach(sec => sec.style.display = 'none');
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.style.display = 'block';

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
                <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
                    <button class="btn-secondary export-nut-log-btn" data-date="${s.date}" style="font-size: 0.8em; padding: 4px 8px;">Export</button>
                </div>
            </div>
        `;}).join('');

            // Add event listeners for Export button in Nutrition History
            document.querySelectorAll('.export-nut-log-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation(); // Don't navigate when clicking export
                    const date = btn.dataset.date;
                    const log = await nutritionService.getLog(date);
                    if (log) {
                        await jsonTransferService.exportNutritionLog(log);
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
        const targets = settings.nutritionTargets ?
            (isTrainDay ? settings.nutritionTargets.trainingDay : settings.nutritionTargets.restDay) : null;

        const dateLabel = document.getElementById('nutrition-date-label');
        dateLabel.innerText = `${currentNutritionLog.date} (${isTrainDay ? 'Training' : 'Rest'} Day)`;

        totalCaloriesSpan.innerHTML = `<span>${Math.round(totals.calories)}</span>`;
        totalProteinSpan.innerHTML = `<span>${Math.round(totals.protein)}</span>`;
        totalCarbsSpan.innerHTML = `<span>${Math.round(totals.carbs)}</span>`;
        totalFatsSpan.innerHTML = `<span>${Math.round(totals.fats)}</span>`;

        if (targets) {
            const getStatusColor = (total, target) => {
                const status = nutritionService.evaluateMacroStatus(total, target);
                if (status === 'green') return '#27ae60';
                if (status === 'yellow' || status === 'orange') return '#f39c12';
                return '#e74c3c';
            };

            const appendTarget = (span, total, target) => {
                const statusColor = getStatusColor(total, target);
                const isRange = target && typeof target === 'object' && target.min !== undefined;
                const targetDisplay = isRange ? `${target.min}-${target.max}` : target;
                const targetMax = isRange ? target.max : target;

                const percent = targetMax > 0 ? (total / targetMax) * 100 : 0;

                span.style.color = statusColor;
                span.innerHTML += ` <small style="color: #666;">/ ${targetDisplay}</small>`;
                span.innerHTML += `<div style="width: 100%; height: 4px; background: #eee; margin-top: 4px; border-radius: 2px;">
                    <div style="width: ${Math.min(percent, 100)}%; height: 100%; background: ${statusColor}; border-radius: 2px;"></div>
                </div>`;
            };

            appendTarget(totalCaloriesSpan, totals.calories, targets.calories);
            appendTarget(totalProteinSpan, totals.protein, targets.protein);
            appendTarget(totalCarbsSpan, totals.carbs, targets.carbs);
            appendTarget(totalFatsSpan, totals.fats, targets.fats);
        }
    }

    function renderMeals() {
        mealsList.innerHTML = '';
        currentNutritionLog.meals.forEach(meal => {
            const totals = nutritionService.calculateMealTotals(meal);
            const mealDiv = document.createElement('div');
            mealDiv.className = 'meal-card';
            mealDiv.innerHTML = `
                <div class="meal-header">
                    <h4>${meal.name}</h4>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <small>${Math.round(totals.calories)} kcal | P: ${Math.round(totals.protein)}g</small>
                        <button class="add-ing-to-meal-btn" data-meal-id="${meal.id}" style="font-size: 0.8em; padding: 2px 6px;">+ Add</button>
                        <button class="edit-meal-btn" data-meal-id="${meal.id}" style="font-size: 0.8em; padding: 2px 6px;">Edit</button>
                        <button class="remove-meal-btn" data-meal-id="${meal.id}" style="color:red; background:none; border:none; padding: 2px 6px;">✕</button>
                    </div>
                </div>
                <div class="ingredients-list">
                    ${meal.ingredients.map(ing => `
                        <div class="ingredient-item">
                            <span>${ing.name} (${ing.weight}g)</span>
                            <span class="ingredient-macros">${Math.round(ing.calories)} cal | P: ${Math.round(ing.protein)}g</span>
                        </div>
                    `).join('')}
                </div>
            `;
            mealsList.appendChild(mealDiv);
        });

        // Add Meal Event Listeners
        document.querySelectorAll('.add-ing-to-meal-btn').forEach(btn => {
            btn.onclick = () => {
                currentSelectedMealId = btn.dataset.mealId;
                openIngredientModal();
            };
        });

        document.querySelectorAll('.edit-meal-btn').forEach(btn => {
            btn.onclick = () => {
                const mealId = btn.dataset.mealId;
                const meal = currentNutritionLog.meals.find(m => m.id === mealId);
                if (meal) {
                    currentEditingMealId = mealId;
                    showMealEditor(meal);
                }
            };
        });

        document.querySelectorAll('.remove-meal-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('Remove this meal?')) {
                    nutritionService.removeMeal(currentNutritionLog, btn.dataset.mealId);
                    await nutritionService.saveLog(currentNutritionLog);
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
        if (results.length > 0) {
            ingSearchResults.innerHTML = results.map(ing => `
                <div class="ing-search-item" data-ing-id="${ing.id}">
                    ${ing.name} (${ing.caloriesPer100g} cal/100g)
                </div>
            `).join('');
            ingSearchResults.style.display = 'block';

            document.querySelectorAll('.ing-search-item').forEach(item => {
                item.onclick = async () => {
                    const ing = await ingredientService.getById(item.dataset.ingId);
                    if (ing) {
                        ingNameInput.value = ing.name;
                        ingCal100Input.value = ing.caloriesPer100g;
                        ingPro100Input.value = ing.proteinPer100g;
                        ingCarb100Input.value = ing.carbsPer100g;
                        ingFat100Input.value = ing.fatsPer100g;
                        ingSearchResults.style.display = 'none';
                        ingSearchInput.value = ing.name;
                    }
                };
            });
        } else {
            ingSearchResults.style.display = 'none';
        }
    };

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

        if (currentSelectedMealId === 'temporary') {
            const macros = ingredientService.calculateMacros(ingredientData, weight);
            temporaryEditingMeal.ingredients.push({
                id: ingredientData.id,
                name: ingredientData.name,
                weight: weight,
                ...macros
            });
            renderEditMealIngredients();
        } else {
            await nutritionService.addIngredientToMeal(currentNutritionLog, currentSelectedMealId, ingredientData, weight);
            await nutritionService.saveLog(currentNutritionLog);
        }

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
