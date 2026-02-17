
export const FOOD_DATABASE = [
    // --- SOURCES DE PROTÉINES ---
    { name: "Poulet (Blanc cuit)", emoji: "🍗", category: "proteins", per100g: { kcal: 165, protein: 31, carbs: 0, fats: 3.6 } },
    { name: "Poulet (Cru)", emoji: "🥩", category: "proteins", per100g: { kcal: 120, protein: 23, carbs: 0, fats: 2.5 } },
    { name: "Boeuf (Haché 5%)", emoji: "🥩", category: "proteins", per100g: { kcal: 135, protein: 21, carbs: 0, fats: 5 } },
    { name: "Boeuf (Steak)", emoji: "🥩", category: "proteins", per100g: { kcal: 150, protein: 26, carbs: 0, fats: 5 } },
    { name: "Oeuf (Entier, Moyen)", emoji: "🥚", category: "proteins", per100g: { kcal: 140, protein: 12, carbs: 0.7, fats: 10 } },
    { name: "Blanc d'oeuf", emoji: "🍳", category: "proteins", per100g: { kcal: 52, protein: 11, carbs: 0.7, fats: 0.2 } },
    { name: "Thon (En boîte)", emoji: "🐟", category: "proteins", per100g: { kcal: 116, protein: 26, carbs: 0, fats: 1 } },
    { name: "Saumon (Cru/Cuit)", emoji: "🐟", category: "proteins", per100g: { kcal: 208, protein: 20, carbs: 0, fats: 13 } },
    { name: "Whey Protéine (Poudre)", emoji: "🥤", category: "proteins", per100g: { kcal: 370, protein: 75, carbs: 5, fats: 5 } },
    { name: "Fromage Blanc 0%", emoji: "🥣", category: "proteins", per100g: { kcal: 48, protein: 8, carbs: 4, fats: 0 } },
    { name: "Skyr / Yaourt Grec", emoji: "🥣", category: "proteins", per100g: { kcal: 60, protein: 10, carbs: 4, fats: 0.2 } },
    { name: "Tofu", emoji: "🧊", category: "proteins", per100g: { kcal: 76, protein: 8, carbs: 2, fats: 4.8 } },
    { name: "Lentilles (Cuites)", emoji: "🥘", category: "proteins", per100g: { kcal: 116, protein: 9, carbs: 20, fats: 0.4 } },

    // --- GLUCIDES (CARBS) ---
    { name: "Riz Blanc (Cuit)", emoji: "🍚", category: "carbs", per100g: { kcal: 130, protein: 2.7, carbs: 28, fats: 0.3 } },
    { name: "Riz Blanc (Cru)", emoji: "🍚", category: "carbs", per100g: { kcal: 365, protein: 7, carbs: 80, fats: 1 } },
    { name: "Pâtes (Cuites)", emoji: "🍝", category: "carbs", per100g: { kcal: 158, protein: 6, carbs: 31, fats: 1 } },
    { name: "Pâtes (Crues)", emoji: "🍝", category: "carbs", per100g: { kcal: 360, protein: 12, carbs: 73, fats: 1.5 } },
    { name: "Flocons d'Avoine", emoji: "🌾", category: "carbs", per100g: { kcal: 375, protein: 14, carbs: 60, fats: 7 } },
    { name: "Pomme de Terre (Cuite)", emoji: "🥔", category: "carbs", per100g: { kcal: 86, protein: 1.7, carbs: 20, fats: 0.1 } },
    { name: "Patate Douce (Cuite)", emoji: "🍠", category: "carbs", per100g: { kcal: 86, protein: 1.6, carbs: 20, fats: 0.1 } },
    { name: "Pain Complet", emoji: "🍞", category: "carbs", per100g: { kcal: 265, protein: 9, carbs: 49, fats: 3 } },
    { name: "Quinoa (Cuit)", emoji: "🥗", category: "carbs", per100g: { kcal: 120, protein: 4.4, carbs: 21, fats: 1.9 } },
    { name: "Banane", emoji: "🍌", category: "carbs", per100g: { kcal: 89, protein: 1.1, carbs: 23, fats: 0.3 } },
    { name: "Pomme", emoji: "🍎", category: "carbs", per100g: { kcal: 52, protein: 0.3, carbs: 14, fats: 0.2 } },
    { name: "Myrtilles/Fruits Rouges", emoji: "🫐", category: "carbs", per100g: { kcal: 57, protein: 0.7, carbs: 14, fats: 0.3 } },
    { name: "Miel", emoji: "🍯", category: "carbs", per100g: { kcal: 304, protein: 0.3, carbs: 82, fats: 0 } },

    // --- LIPIDES (FATS) ---
    { name: "Avocat", emoji: "🥑", category: "fats", per100g: { kcal: 160, protein: 2, carbs: 9, fats: 15 } },
    { name: "Amandes", emoji: "🥜", category: "fats", per100g: { kcal: 579, protein: 21, carbs: 22, fats: 50 } },
    { name: "Noix", emoji: "🌰", category: "fats", per100g: { kcal: 654, protein: 15, carbs: 14, fats: 65 } },
    { name: "Beurre de Cacahuète", emoji: "🥜", category: "fats", per100g: { kcal: 588, protein: 25, carbs: 20, fats: 50 } },
    { name: "Huile d'Olive", emoji: "🫒", category: "fats", per100g: { kcal: 884, protein: 0, carbs: 0, fats: 100 } },
    { name: "Beurre", emoji: "🧈", category: "fats", per100g: { kcal: 717, protein: 0.9, carbs: 0.1, fats: 81 } },
    { name: "Chocolat Noir (85%)", emoji: "🍫", category: "fats", per100g: { kcal: 580, protein: 9, carbs: 19, fats: 48 } },

    // --- AUTRES / LÉGUMES ---
    { name: "Brocolis/Haricots Verts", emoji: "🥦", category: "veggies", per100g: { kcal: 35, protein: 2.8, carbs: 7, fats: 0.4 } },
    { name: "Épinards", emoji: "🍃", category: "veggies", per100g: { kcal: 23, protein: 2.9, carbs: 3.6, fats: 0.4 } },
    { name: "Carottes", emoji: "🥕", category: "veggies", per100g: { kcal: 41, protein: 0.9, carbs: 9.6, fats: 0.2 } },
    { name: "Tomates", emoji: "🍅", category: "veggies", per100g: { kcal: 18, protein: 0.9, carbs: 3.9, fats: 0.2 } },
    { name: "Lait demi-écrémé", emoji: "🥛", category: "other", per100g: { kcal: 47, protein: 3.4, carbs: 4.9, fats: 1.5 } },
    { name: "Lait d'Amande (Sans sucre)", emoji: "🥛", category: "other", per100g: { kcal: 13, protein: 0.9, carbs: 0.2, fats: 1.1 } },
];
