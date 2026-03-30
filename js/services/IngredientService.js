/**
 * IngredientService - Manages the ingredient database for nutrition tracking.
 * (PLAN-011 | R17 | LLD-011)
 */
import { persistenceService } from './PersistenceService.js';

class IngredientService {
    /**
     * Searches for ingredients in the database by name.
     */
    async search(query) {
        const ingredients = await persistenceService.getAll('ingredients');
        if (!query) return ingredients;

        const lowerQuery = query.toLowerCase();
        return ingredients.filter(ing =>
            ing.name.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Gets an ingredient by its ID (name).
     */
    async getById(id) {
        return await persistenceService.getById('ingredients', id);
    }

    /**
     * Saves or updates an ingredient in the database.
     */
    async save(ingredient) {
        // Ensure ID is generated from name if not present
        if (!ingredient.id && ingredient.name) {
            ingredient.id = ingredient.name.toLowerCase().trim().replace(/\s+/g, '_');
        }
        return await persistenceService.save('ingredients', ingredient);
    }

    /**
     * Helper to calculate macros for a specific weight.
     */
    calculateMacros(ingredient, weightInGrams) {
        const ratio = weightInGrams / 100;
        return {
            calories: Math.round(ingredient.caloriesPer100g * ratio * 10) / 10,
            protein: Math.round(ingredient.proteinPer100g * ratio * 10) / 10,
            carbs: Math.round(ingredient.carbsPer100g * ratio * 10) / 10,
            fats: Math.round(ingredient.fatsPer100g * ratio * 10) / 10
        };
    }
}

export const ingredientService = new IngredientService();
