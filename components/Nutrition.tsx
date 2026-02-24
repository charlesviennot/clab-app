
import React, { useState } from 'react';
import { Plus, Trash2, Search, Flame, Droplet, ChevronRight, Apple, ScanBarcode, Minus, Utensils, Globe, Loader2, Download } from 'lucide-react';
import { calculateDailyCalories, getNutrientTiming } from '../utils/helpers';
import { FOOD_DATABASE } from '../data/foodDatabase';

const MacroCard = ({ label, current, target, colorClass, bgClass, icon }: any) => {
    const percent = Math.min(100, (current / target) * 100);
    return (
        <div className={`p-3 rounded-2xl border flex flex-col justify-between h-24 shadow-sm transition-transform active:scale-95 ${bgClass}`}>
            <div className="flex justify-between items-start">
                <span className="text-xl">{icon}</span>
                <span className="text-[10px] font-bold opacity-70 uppercase tracking-tight text-slate-600 dark:text-slate-300">{label}</span>
            </div>
            <div>
                <div className="flex items-baseline gap-0.5 mb-1.5">
                    <span className="text-lg font-black text-slate-800 dark:text-white">{Math.round(current)}</span>
                    <span className="text-[10px] font-semibold text-slate-400">/ {Math.round(target)}g</span>
                </div>
                <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export const NutritionView = ({ userData, setUserData, nutritionLog, setNutritionLog, showFoodSearch, setShowFoodSearch }: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [waterIntake, setWaterIntake] = useState(0);
    
    // External Search State
    const [externalResults, setExternalResults] = useState<any[]>([]);
    const [isLoadingExternal, setIsLoadingExternal] = useState(false);
    const [searchMode, setSearchMode] = useState<'local' | 'web'>('local');

    const [selectedFood, setSelectedFood] = useState<any>(null);
    const [quantity, setQuantity] = useState<number>(100);

    // Calculate targets
    const metabolism = calculateDailyCalories(userData);
    const targetKcal = metabolism.target;
    const waterTarget = 2500; // Objectif hydratation standard
    
    // Macro split
    const weight = userData.weight || 75;
    const proteinTarget = Math.round(weight * 2);
    const fatTarget = Math.round(weight * 1);
    const carbsTarget = Math.round((targetKcal - (proteinTarget * 4 + fatTarget * 9)) / 4);

    // Get today's log
    const today = new Date().toISOString().split('T')[0];
    const todayLog = nutritionLog[today] || [];

    const todayStats = todayLog.reduce((acc: any, item: any) => {
        return {
            kcal: acc.kcal + item.kcal,
            protein: acc.protein + item.protein,
            carbs: acc.carbs + item.carbs,
            fats: acc.fats + item.fats
        };
    }, { kcal: 0, protein: 0, carbs: 0, fats: 0 });

    const addFood = (food: any, qty: number) => {
        const ratio = qty / 100;
        const entry = {
            id: Date.now(),
            name: food.name,
            emoji: food.emoji || '🍽️',
            quantity: qty,
            kcal: (food.per100g.kcal || 0) * ratio,
            protein: (food.per100g.protein || 0) * ratio,
            carbs: (food.per100g.carbs || 0) * ratio,
            fats: (food.per100g.fats || 0) * ratio
        };
        const newLog = { ...nutritionLog, [today]: [...todayLog, entry] };
        setNutritionLog(newLog);
        setShowFoodSearch(false);
        setSearchTerm('');
        setExternalResults([]);
        setSearchMode('local');
        setSelectedFood(null);
    };

    const handleFoodClick = (food: any) => {
        setSelectedFood(food);
        setQuantity(100);
    };

    const confirmAddFood = () => {
        if (!selectedFood) return;
        addFood(selectedFood, quantity);
        setSelectedFood(null);
    };

    const removeFood = (id: number) => {
        const newLog = { ...nutritionLog, [today]: todayLog.filter((i: any) => i.id !== id) };
        setNutritionLog(newLog);
    };

    const searchOpenFoodFacts = async () => {
        if (!searchTerm || searchTerm.length < 2) return;
        setIsLoadingExternal(true);
        setSearchMode('web');
        try {
            // Sort by unique_scans_n to get popular items first (fixes the "Rice" issue)
            const response = await fetch(`https://fr.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&sort_by=unique_scans_n&json=1&page_size=25`);
            const data = await response.json();
            
            if (data.products) {
                const mappedProducts = data.products
                    .filter((p: any) => p.nutriments && (p.product_name || p.product_name_fr)) 
                    .map((p: any) => ({
                        name: p.product_name_fr || p.product_name,
                        emoji: '🌍',
                        per100g: {
                            kcal: p.nutriments['energy-kcal_100g'] || (p.nutriments['energy-kj_100g'] / 4.184) || 0,
                            protein: p.nutriments['proteins_100g'] || 0,
                            carbs: p.nutriments['carbohydrates_100g'] || 0,
                            fats: p.nutriments['fat_100g'] || 0
                        },
                        brand: p.brands ? p.brands.split(',')[0] : "Marque inconnue"
                    }));
                setExternalResults(mappedProducts);
            }
        } catch (error) {
            console.error("Erreur recherche OFF", error);
        } finally {
            setIsLoadingExternal(false);
        }
    };

    const nutrientTiming = getNutrientTiming();
    const filteredFood = FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return (
        <>
            {/* MAIN CONTENT inside animated div */}
            <div className="space-y-6 animate-in slide-in-from-right-4 pb-24">
                
                {/* HYDRATATION CARD */}
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><Droplet size={80}/></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 font-bold text-lg"><Droplet className="fill-white" size={20}/> Hydratation</div>
                                <div className="text-xs opacity-80 font-medium">Objectif du jour : {waterTarget} ml</div>
                            </div>
                            <div className="text-3xl font-black">{waterIntake} <span className="text-sm font-medium opacity-80">ml</span></div>
                        </div>
                        {/* Bar */}
                        <div className="h-4 bg-black/20 rounded-full mb-6 overflow-hidden backdrop-blur-sm">
                            <div className="h-full bg-white/90 rounded-full transition-all duration-500" style={{width: `${Math.min(100, (waterIntake/waterTarget)*100)}%`}}></div>
                        </div>
                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button onClick={() => setWaterIntake(w => w + 250)} className="flex-1 bg-white/20 hover:bg-white/30 py-3 rounded-xl font-bold text-sm transition backdrop-blur-md border border-white/10 active:scale-95">+ 250ml</button>
                            <button onClick={() => setWaterIntake(w => w + 500)} className="flex-1 bg-white/20 hover:bg-white/30 py-3 rounded-xl font-bold text-sm transition backdrop-blur-md border border-white/10 active:scale-95">+ 500ml</button>
                            <button onClick={() => setWaterIntake(w => Math.max(0, w - 250))} className="px-4 bg-white/20 hover:bg-white/30 rounded-xl transition backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95"><Minus size={20}/></button>
                        </div>
                    </div>
                </div>

                {/* MON ÉNERGIE (CIRCULAR CHART) */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div>
                            <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">Mon Énergie</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Objectif: {userData.nutritionGoal === 'maintain' ? 'Maintien' : userData.nutritionGoal === 'cut' ? 'Perte' : 'Prise de masse'}</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition"><ScanBarcode size={20}/></button>
                            <button onClick={() => setShowFoodSearch(true)} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition active:scale-95"><Plus size={20}/></button>
                        </div>
                    </div>

                    {/* Circular Chart Area */}
                    <div className="flex items-center justify-between gap-2 mb-8 relative z-10">
                        <div className="text-center flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">Objectif</div>
                            <div className="font-black text-lg text-slate-700 dark:text-white truncate">{targetKcal}</div>
                        </div>
                        
                        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full -rotate-90 drop-shadow-xl overflow-visible">
                                {/* Background Circle */}
                                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8%" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                                {/* Progress Circle */}
                                <circle 
                                    cx="50%" cy="50%" r="45%" 
                                    stroke="currentColor" strokeWidth="8%" 
                                    fill="transparent" 
                                    strokeDasharray="283%" 
                                    strokeDashoffset={`${283 - ((Math.min(todayStats.kcal, targetKcal) / targetKcal) * 283)}%`} 
                                    strokeLinecap="round" 
                                    className="text-slate-800 dark:text-indigo-500 transition-all duration-1000 ease-out" 
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{Math.max(0, Math.round(targetKcal - todayStats.kcal))}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Restant</div>
                            </div>
                        </div>

                        <div className="text-center flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">Mangé</div>
                            <div className="font-black text-lg text-indigo-600 truncate">{Math.round(todayStats.kcal)}</div>
                        </div>
                    </div>

                    {/* Macros Row */}
                    <div className="grid grid-cols-3 gap-2 relative z-10">
                        <MacroCard 
                            label="Glucides" 
                            current={todayStats.carbs} 
                            target={carbsTarget} 
                            colorClass="bg-amber-500" 
                            bgClass="bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30"
                            icon="🌾" 
                        />
                        <MacroCard 
                            label="Protéines" 
                            current={todayStats.protein} 
                            target={proteinTarget} 
                            colorClass="bg-indigo-500" 
                            bgClass="bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30"
                            icon="🥩" 
                        />
                        <MacroCard 
                            label="Lipides" 
                            current={todayStats.fats} 
                            target={fatTarget} 
                            colorClass="bg-rose-500" 
                            bgClass="bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30"
                            icon="🥑" 
                        />
                    </div>
                </div>

                {/* FOOD LOG LIST */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Apple size={18} className="text-indigo-600"/> Journal du jour
                    </h4>
                    
                    {todayLog.length > 0 ? (
                        <div className="space-y-3">
                            {todayLog.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="text-2xl shrink-0">{item.emoji}</div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate">{item.name}</div>
                                            <div className="text-[10px] text-slate-400 font-medium truncate">{item.quantity}g • {Math.round(item.kcal)} kcal</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right text-[9px] font-bold text-slate-400 hidden sm:block bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-600">
                                            <span className="text-amber-500">G: {Math.round(item.carbs)}</span> • <span className="text-indigo-500">P: {Math.round(item.protein)}</span> • <span className="text-rose-500">L: {Math.round(item.fats)}</span>
                                        </div>
                                        <button onClick={() => removeFood(item.id)} className="text-slate-300 hover:text-rose-500 transition p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2">
                            <Utensils size={24} className="opacity-50"/>
                            <p>Aucun aliment ajouté aujourd'hui.</p>
                        </div>
                    )}
                </div>

                {/* TIMING CARD */}
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden border border-white/10">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Flame size={80}/></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                            {nutrientTiming.icon} Conseil du moment
                        </div>
                        <h3 className="text-xl font-bold mb-2">{nutrientTiming.label}</h3>
                        <p className="text-sm text-slate-300 leading-relaxed opacity-90">{nutrientTiming.advice}</p>
                    </div>
                </div>
            </div>

            {/* FOOD SEARCH MODAL - OUTSIDE of animated div to prevent stacking context clipping */}
            {showFoodSearch && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in top-0 left-0 w-full h-full">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
                        
                        {selectedFood ? (
                            // QUANTITY SELECTION VIEW
                            <div className="flex flex-col h-full">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                                    <button onClick={() => setSelectedFood(null)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold text-xs flex items-center gap-1">
                                        <ChevronRight size={16} className="rotate-180"/> Retour
                                    </button>
                                    <h3 className="font-bold text-slate-800 dark:text-white">Quantité</h3>
                                    <div className="w-10"></div>
                                </div>
                                
                                <div className="p-6 flex flex-col items-center gap-6 flex-1 overflow-y-auto">
                                    <div className="text-center">
                                        <div className="text-6xl mb-2">{selectedFood.emoji}</div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">{selectedFood.name}</h2>
                                        <p className="text-slate-400 text-sm font-medium">{Math.round(selectedFood.per100g.kcal)} kcal / 100g</p>
                                    </div>

                                    <div className="w-full max-w-xs">
                                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-2 rounded-2xl border border-slate-200 dark:border-slate-600">
                                            <input 
                                                type="number" 
                                                value={quantity} 
                                                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                                                className="w-full bg-transparent text-center text-3xl font-black text-slate-800 dark:text-white outline-none p-2"
                                                autoFocus
                                            />
                                            <span className="text-slate-400 font-bold pr-4">g</span>
                                        </div>
                                        
                                        <div className="flex justify-center gap-2 mt-3">
                                            {[50, 100, 150, 200].map(val => (
                                                <button 
                                                    key={val} 
                                                    onClick={() => setQuantity(val)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${quantity === val ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                                >
                                                    {val}g
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Live Preview */}
                                    <div className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                                        <div className="text-center mb-3">
                                            <span className="text-3xl font-black text-indigo-600">{Math.round((selectedFood.per100g.kcal * quantity) / 100)}</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase ml-1">kcal</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-slate-400">Glucides</div>
                                                <div className="font-bold text-slate-700 dark:text-slate-200">{Math.round((selectedFood.per100g.carbs * quantity) / 100)}g</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-slate-400">Protéines</div>
                                                <div className="font-bold text-slate-700 dark:text-slate-200">{Math.round((selectedFood.per100g.protein * quantity) / 100)}g</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-slate-400">Lipides</div>
                                                <div className="font-bold text-slate-700 dark:text-slate-200">{Math.round((selectedFood.per100g.fats * quantity) / 100)}g</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <button 
                                        onClick={confirmAddFood}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Plus size={20}/> Ajouter au journal
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // SEARCH VIEW
                            <>
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <Search size={18} className="text-indigo-600"/> Ajouter un aliment
                                        </h3>
                                        <button onClick={() => setShowFoodSearch(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs bg-slate-200 dark:bg-slate-700 px-3 py-1.5 rounded-lg transition">Fermer</button>
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            autoFocus
                                            placeholder="Pomme, Poulet, Riz..." 
                                            className="flex-1 bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-700 dark:text-white focus:border-indigo-500 transition shadow-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && searchOpenFoodFacts()}
                                        />
                                        <button 
                                            onClick={searchOpenFoodFacts}
                                            className="px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center"
                                            title="Rechercher sur Internet"
                                        >
                                            {isLoadingExternal ? <Loader2 size={20} className="animate-spin"/> : <Globe size={20}/>}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="overflow-y-auto p-2">
                                    {/* LOCAL RESULTS */}
                                    {filteredFood.length > 0 && (
                                        <div className="mb-4">
                                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base Locale</div>
                                            {filteredFood.map((food, idx) => (
                                                <div key={idx} onClick={() => handleFoodClick(food)} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer flex items-center justify-between group transition border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-2xl">{food.emoji}</div>
                                                        <div>
                                                            <div className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition">{food.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium">{Math.round(food.per100g.kcal)} kcal / 100g</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[9px] font-bold text-slate-300 group-hover:text-slate-400 hidden sm:block">
                                                            P:{food.per100g.protein} G:{food.per100g.carbs} L:{food.per100g.fats}
                                                        </div>
                                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400"/>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* EXTERNAL RESULTS */}
                                    {externalResults.length > 0 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2">
                                            <div className="px-3 py-2 text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1"><Globe size={10}/> Résultats Web (OpenFoodFacts)</div>
                                            {externalResults.map((food, idx) => (
                                                <div key={`ext-${idx}`} onClick={() => handleFoodClick(food)} className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl cursor-pointer flex items-center justify-between group transition border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-2xl">{food.emoji}</div>
                                                        <div>
                                                            <div className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition">{food.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium">{Math.round(food.per100g.kcal)} kcal • {food.brand || "Marque inconnue"}</div>
                                                        </div>
                                                    </div>
                                                    <Download size={16} className="text-slate-300 group-hover:text-indigo-500"/>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {filteredFood.length === 0 && externalResults.length === 0 && !isLoadingExternal && (
                                        <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-3">
                                            <Search size={24} className="opacity-50"/>
                                            <span>Aucun résultat local.</span>
                                            <button onClick={searchOpenFoodFacts} className="text-indigo-500 font-bold hover:underline">Rechercher "{searchTerm}" sur Internet ?</button>
                                        </div>
                                    )}
                                    
                                    {isLoadingExternal && (
                                        <div className="py-8 flex justify-center">
                                            <Loader2 className="animate-spin text-indigo-500" size={24}/>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
