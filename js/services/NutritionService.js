/**
 * NutritionService - Manages daily nutrition logs and calculations.
 * (PLAN-011 | R16 | LLD-011)
 */
import { persistenceService } from './PersistenceService.js';
import { ingredientService } from './IngredientService.js';

class NutritionService {
    /**
     * Gets the nutrition log for a specific date. Creates one if it doesn't exist.
     */
    async getLog(date) {
        const id = `nutrition_${date}`;
        let log = await persistenceService.getById('nutritionLogs', id);

        if (!log) {
            const settings = await persistenceService.getById('settings', 'current') || {};
            log = {
                id,
                date,
                meals: [],
                status: 'draft',
                targetsSnapshot: settings.nutritionTargets ? JSON.parse(JSON.stringify(settings.nutritionTargets)) : null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await persistenceService.save('nutritionLogs', log);
        }
        return log;
    }

    /**
     * Saves the entire nutrition log for a day.
     */
    async saveLog(log) {
        log.updatedAt = new Date().toISOString();
        return await persistenceService.save('nutritionLogs', log);
    }

    /**
     * Adds a meal to a log.
     */
    addMeal(log, mealName) {
        const meal = {
            id: `meal_${Date.now()}`,
            name: mealName || `Meal ${log.meals.length + 1}`,
            ingredients: []
        };
        log.meals.push(meal);
        return meal;
    }

    /**
     * Removes a meal from a log.
     */
    async removeMeal(log, mealId) {
        log.meals = log.meals.filter(m => m.id !== mealId);
        this.updateLogTotals(log);
        await this.saveLog(log);
    }

    /**
     * Updates an ingredient within a meal.
     */
    async updateIngredient(log, mealId, ingredientName, updatedWeight) {
        const meal = log.meals.find(m => m.id === mealId);
        if (!meal) return;

        const ingIdx = meal.ingredients.findIndex(ing => ing.name === ingredientName);
        if (ingIdx === -1) return;

        const ingredient = meal.ingredients[ingIdx];
        const baseIngredient = await ingredientService.getByName(ingredientName);

        if (baseIngredient) {
            const macros = ingredientService.calculateMacros(baseIngredient, updatedWeight);
            meal.ingredients[ingIdx] = {
                ...ingredient,
                weight: updatedWeight,
                ...macros
            };
            this.updateLogTotals(log);
            await this.saveLog(log);
        }
    }

    /**
     * Removes an ingredient from a meal.
     */
    async removeIngredient(log, mealId, ingredientName) {
        const meal = log.meals.find(m => m.id === mealId);
        if (!meal) return;

        meal.ingredients = meal.ingredients.filter(ing => ing.name !== ingredientName);
        this.updateLogTotals(log);
        await this.saveLog(log);
    }

    /**
     * Updates a meal's name.
     */
    async updateMealName(log, mealId, newName) {
        const meal = log.meals.find(m => m.id === mealId);
        if (meal) {
            meal.name = newName;
            await this.saveLog(log);
        }
    }

    /**
     * Deletes a nutrition log by date.
     */
    async deleteLog(date) {
        const id = `nutrition_${date}`;
        await persistenceService.delete('nutritionLogs', id);
    }

    /**
     * Updates an existing meal in the log.
     */
    async updateMeal(log, mealId, updatedMeal) {
        const idx = log.meals.findIndex(m => m.id === mealId);
        if (idx > -1) {
            log.meals[idx] = updatedMeal;
            this.updateLogTotals(log);
            await this.saveLog(log);
        }
    }

    /**
     * Recalculates and updates the log totals based on all meals.
     */
    updateLogTotals(log) {
        const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
        log.meals.forEach(meal => {
            const mealTotals = this.calculateMealTotals(meal);
            totals.calories += mealTotals.calories;
            totals.protein += mealTotals.protein;
            totals.carbs += mealTotals.carbs;
            totals.fats += mealTotals.fats;
        });
        log.totals = totals;
    }

    /**
     * Adds or updates an ingredient in a meal.
     */
    async addIngredientToMeal(log, mealId, ingredientData, weight) {
        const meal = log.meals.find(m => m.id === mealId);
        if (!meal) return;

        // Calculate macros for the given weight
        const macros = ingredientService.calculateMacros(ingredientData, weight);

        const loggedIngredient = {
            id: ingredientData.id,
            name: ingredientData.name,
            weight: weight,
            ...macros
        };

        // If ingredient already exists in the meal, update it, else add new
        const existingIdx = meal.ingredients.findIndex(ing => ing.name === loggedIngredient.name);
        if (existingIdx > -1) {
            meal.ingredients[existingIdx] = loggedIngredient;
        } else {
            meal.ingredients.push(loggedIngredient);
        }

        // Auto-save the ingredient to the global database if it's new or updated
        await ingredientService.save({
            id: ingredientData.id,
            name: ingredientData.name,
            caloriesPer100g: ingredientData.caloriesPer100g,
            proteinPer100g: ingredientData.proteinPer100g,
            carbsPer100g: ingredientData.carbsPer100g,
            fatsPer100g: ingredientData.fatsPer100g
        });

        return loggedIngredient;
    }

    /**
     * Calculates totals for a meal.
     */
    calculateMealTotals(meal) {
        if (!meal || !meal.ingredients) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
        return meal.ingredients.reduce((acc, ing) => {
            acc.calories += (ing.calories || 0);
            acc.protein += (ing.protein || 0);
            acc.carbs += (ing.carbs || 0);
            acc.fats += (ing.fats || 0);
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }

    /**
     * Calculates totals for the entire day.
     */
    calculateDayTotals(log) {
        if (!log || !log.meals) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
        return log.meals.reduce((acc, meal) => {
            const mealTotals = this.calculateMealTotals(meal);
            acc.calories += mealTotals.calories;
            acc.protein += mealTotals.protein;
            acc.carbs += mealTotals.carbs;
            acc.fats += mealTotals.fats;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }

    /**
     * Gets summary of all nutritional logs.
     */
    async getHistorySummaries() {
        const logs = await persistenceService.getAll('nutritionLogs');
        const workouts = await persistenceService.getAll('workoutLogs');
        const settings = await persistenceService.getById('settings', 'current') || {};

        const globalTargets = settings.nutritionTargets || {
            trainingDay: {
                calories: { min: 2200, max: 2300, critMinus: 100, critPlus: 100 },
                protein: { min: 145, max: 155, critMinus: 10, critPlus: 50 },
                carbs: { min: 200, max: 220, critMinus: 20, critPlus: 20 },
                fats: { min: 50, max: 60, critMinus: 10, critPlus: 10 }
            },
            restDay: {
                calories: { min: 2000, max: 2100, critMinus: 100, critPlus: 100 },
                protein: { min: 140, max: 150, critMinus: 10, critPlus: 50 },
                carbs: { min: 140, max: 160, critMinus: 20, critPlus: 20 },
                fats: { min: 50, max: 60, critMinus: 10, critPlus: 10 }
            }
        };

        const summaries = logs.map(log => {
            const totals = this.calculateDayTotals(log);
            const workoutOnDate = workouts.some(w => w.date === log.date && w.status === 'completed');

            // Use snapshotted targets if available, otherwise fallback to settings
            const targets = log.targetsSnapshot || globalTargets;
            const dailyTarget = workoutOnDate ? targets.trainingDay : targets.restDay;

            return {
                id: log.id,
                date: log.date,
                isTrainingDay: workoutOnDate,
                isCompleted: log.status === 'completed',
                totals,
                target: {
                    cal: dailyTarget.calories,
                    pro: dailyTarget.protein,
                    carb: dailyTarget.carbs,
                    fat: dailyTarget.fats
                },
                targetData: dailyTarget, // Pass raw target data for range formatting in UI
                status: this.evaluateStatus(totals, dailyTarget)
            };
        });

        // Sort by date descending
        return summaries.sort((a, b) => b.date.localeCompare(a.date));
    }

    /**
     * Helper to evaluate status color based on targets and criticality.
     */
    evaluateStatus(totals, targets) {
        const statuses = {
            calories: this.evaluateMacroStatus(totals.calories, targets.calories || targets.cal),
            protein: this.evaluateMacroStatus(totals.protein, targets.protein || targets.pro),
            carbs: this.evaluateMacroStatus(totals.carbs, targets.carbs || targets.carb),
            fats: this.evaluateMacroStatus(totals.fats, targets.fats || targets.fat)
        };

        // Determine if in range (ignore criticality for overall row status)
        const inRange = {
            calories: this.isInRange(totals.calories, targets.calories || targets.cal),
            protein: this.isInRange(totals.protein, targets.protein || targets.pro),
            carbs: this.isInRange(totals.carbs, targets.carbs || targets.carb),
            fats: this.isInRange(totals.fats, targets.fats || targets.fat)
        };

        const inRangeCount = Object.values(inRange).filter(v => v).length;

        let overallStatus = 'red';
        if (inRangeCount === 4) overallStatus = 'green';
        else if (inRangeCount > 0) overallStatus = 'yellow';

        return {
            overall: overallStatus,
            detail: statuses
        };
    }

    /**
     * Checks if a value is strictly within the target range.
     */
    isInRange(actual, target) {
        if (!target) return false;
        if (target.min !== undefined && target.max !== undefined) {
            return actual >= parseFloat(target.min) && actual <= parseFloat(target.max);
        }
        const targetVal = target.calories || target.cal || target.protein || target.pro || target.carbs || target.carb || target.fats || target.fat || target;
        const diff = Math.abs(actual - targetVal);
        return diff <= (targetVal * 0.1);
    }

    /**
     * Logic for evaluating a single macro status.
     * Supports both legacy single-value targets and new range-based targets with split tolerances.
     */
    evaluateMacroStatus(actual, target) {
        if (!target) return 'red';

        // Range-based logic (new)
        if (target.min !== undefined && target.max !== undefined) {
            const min = parseFloat(target.min);
            const max = parseFloat(target.max);
            const critMinus = parseFloat(target.critMinus !== undefined ? target.critMinus : (target.criticality || 0));
            const critPlus = parseFloat(target.critPlus !== undefined ? target.critPlus : (target.criticality || 0));

            if (actual >= min && actual <= max) return 'green';
            if (actual >= (min - critMinus) && actual <= (max + critPlus)) return 'yellow';
            return 'red';
        }

        // Legacy single-value logic
        const targetVal = target.calories || target.cal || target.protein || target.pro || target.carbs || target.carb || target.fats || target.fat || target;
        const diff = Math.abs(actual - targetVal);
        const threshold = targetVal * 0.1;

        if (diff <= threshold) return 'green';
        if (diff <= threshold * 2) return 'orange';
        return 'red';
    }

    /**
     * Searches historical meals by name.
     */
    async searchHistoricalMeals(query) {
        const logs = await persistenceService.getAll('nutritionLogs');
        const meals = [];
        const seenNames = new Set();

        const lowerQuery = query.toLowerCase();

        for (const log of logs) {
            for (const meal of log.meals) {
                if (meal.name.toLowerCase().includes(lowerQuery) && !seenNames.has(meal.name.toLowerCase())) {
                    meals.push(meal);
                    seenNames.add(meal.name.toLowerCase());
                }
            }
        }

        return meals.slice(0, 10); // Limit results
    }
}

export const nutritionService = new NutritionService();
