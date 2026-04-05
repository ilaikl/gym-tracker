/**
 * ExternalApiService - Handles calls to external APIs (USDA FoodData Central).
 * (PLAN-024 | R35 | LLD-024)
 */
class ExternalApiService {
    constructor() {
        this.apiKey = process.env.FDC_API_KEY;
        this.baseUrl = 'https://api.nal.usda.gov/fdc/v1';
    }

    /**
     * Searches for food items in the USDA FoodData Central database.
     * @param {string} query - The search term.
     * @returns {Promise<Array>} - List of mapped food items.
     */
    async searchFood(query) {
        if (!query) return [];
        if (!this.apiKey) {
            console.error('FDC API Key is missing. Please check your .env file.');
            return [];
        }

        try {
            const url = `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&pageSize=15`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`FDC API error: ${response.status}`);
            }

            const data = await response.json();
            return this.mapFdcResults(data.foods || []);
        } catch (error) {
            console.error('Error fetching food from FDC:', error);
            return [];
        }
    }

    /**
     * Maps raw FDC search results to internal macro format.
     */
    mapFdcResults(foods) {
        return foods.map(food => {
            const nutrients = food.foodNutrients || [];

            // Nutrient IDs: 1008 (Energy kcal), 1003 (Protein), 1004 (Fat), 1005 (Carbs)
            // Sometimes IDs differ between data types (Branded vs Foundation/SR Legacy)
            const getNutrient = (ids) => {
                const n = nutrients.find(n => ids.includes(n.nutrientId) || ids.includes(parseInt(n.nutrientId)));
                return n ? parseFloat(n.value) : 0;
            };

            return {
                id: `fdc_${food.fdcId}`,
                name: food.description,
                brand: food.brandOwner || '',
                caloriesPer100g: getNutrient([1008, 2047]), // 1008 is standard, 2047 is often used in branded
                proteinPer100g: getNutrient([1003]),
                fatsPer100g: getNutrient([1004]),
                carbsPer100g: getNutrient([1005])
            };
        });
    }
}

export const externalApiService = new ExternalApiService();
