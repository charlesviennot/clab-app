
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Flame, Droplet, ChevronRight, Apple, ScanBarcode, Minus, Utensils, Globe, Loader2, Download, X, Mic, Send, Key } from 'lucide-react';
import { calculateDailyCalories, getNutrientTiming, vibrate } from '../utils/helpers';
import { FOOD_DATABASE } from '../data/foodDatabase';
import { Scanner } from '@yudiel/react-qr-scanner';
import { GoogleGenAI, Type } from '@google/genai';

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
    const [showScanner, setShowScanner] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);

    // Voice Input State
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [voiceText, setVoiceText] = useState('');
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [isListening, setIsListening] = useState(false);
    
    // API Key State
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [tempApiKey, setTempApiKey] = useState('');
    const [hasStoredKey, setHasStoredKey] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('USER_GEMINI_API_KEY');
        if (storedKey) {
            setHasStoredKey(true);
        }
    }, []);

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
            id: editingId || Date.now(),
            name: food.name,
            emoji: food.emoji || '🍽️',
            quantity: qty,
            kcal: (food.per100g.kcal || 0) * ratio,
            protein: (food.per100g.protein || 0) * ratio,
            carbs: (food.per100g.carbs || 0) * ratio,
            fats: (food.per100g.fats || 0) * ratio,
            per100g: food.per100g // Keep per100g for future edits
        };

        let newLogData;
        if (editingId) {
            // Update existing entry
            newLogData = todayLog.map((item: any) => item.id === editingId ? entry : item);
        } else {
            // Add new entry
            newLogData = [...todayLog, entry];
        }

        const newLog = { ...nutritionLog, [today]: newLogData };
        setNutritionLog(newLog);
        setShowFoodSearch(false);
        setSearchTerm('');
        setExternalResults([]);
        setSearchMode('local');
        setSelectedFood(null);
        setEditingId(null);
        if(userData.hapticEnabled) vibrate(50);
    };

    const handleFoodClick = (food: any) => {
        setSelectedFood(food);
        setQuantity(100);
        setEditingId(null);
    };

    const handleEditFood = (item: any) => {
        // Reconstruct food object from log item
        const food = {
            name: item.name,
            emoji: item.emoji,
            per100g: item.per100g || {
                kcal: (item.kcal / item.quantity) * 100,
                protein: (item.protein / item.quantity) * 100,
                carbs: (item.carbs / item.quantity) * 100,
                fats: (item.fats / item.quantity) * 100
            }
        };
        setSelectedFood(food);
        setQuantity(item.quantity);
        setEditingId(item.id);
        setShowFoodSearch(true);
    };

    const confirmAddFood = () => {
        if (!selectedFood) return;
        addFood(selectedFood, quantity);
        setSelectedFood(null);
    };

    const removeFood = (id: number) => {
        const newLog = { ...nutritionLog, [today]: todayLog.filter((i: any) => i.id !== id) };
        setNutritionLog(newLog);
        if(userData.hapticEnabled) vibrate(50);
    };

    const searchOpenFoodFacts = async () => {
        if (!searchTerm || searchTerm.length < 2) return;
        setIsLoadingExternal(true);
        setSearchMode('web');
        
        const fetchOFF = async (query: string) => {
             const response = await fetch(`https://fr.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&sort_by=unique_scans_n&json=1&page_size=25`);
             return await response.json();
        };

        try {
            // 1. First attempt with full query
            let data = await fetchOFF(searchTerm);
            
            // 2. Fallback strategy: if 0 results, try removing the last word (often the brand or a specific detail)
            if ((!data.products || data.products.length === 0) && searchTerm.includes(' ')) {
                const simplifiedTerm = searchTerm.split(' ').slice(0, -1).join(' ');
                if (simplifiedTerm.length > 2) {
                    console.log("Tentative de recherche simplifiée:", simplifiedTerm);
                    data = await fetchOFF(simplifiedTerm);
                }
            }

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
            } else {
                setExternalResults([]);
            }
        } catch (error) {
            console.error("Erreur recherche OFF", error);
            setExternalResults([]);
        } finally {
            setIsLoadingExternal(false);
        }
    };

    const handleScan = async (result: any) => {
        if (result) {
            const code = result[0].rawValue;
            setShowScanner(false);
            setIsLoadingExternal(true);
            setShowFoodSearch(true);
            if(userData.hapticEnabled) vibrate(100);
            try {
                const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
                const data = await response.json();
                if (data.status === 1 && data.product) {
                    const p = data.product;
                    const food = {
                        name: p.product_name_fr || p.product_name,
                        emoji: '📦',
                        per100g: {
                            kcal: p.nutriments['energy-kcal_100g'] || (p.nutriments['energy-kj_100g'] / 4.184) || 0,
                            protein: p.nutriments['proteins_100g'] || 0,
                            carbs: p.nutriments['carbohydrates_100g'] || 0,
                            fats: p.nutriments['fat_100g'] || 0
                        },
                        brand: p.brands ? p.brands.split(',')[0] : "Marque inconnue"
                    };
                    handleFoodClick(food);
                } else {
                    alert("Produit non trouvé !");
                    if(userData.hapticEnabled) vibrate([50, 50, 50]);
                }
            } catch (error) {
                console.error("Erreur scan", error);
                alert("Erreur lors de la récupération du produit.");
                if(userData.hapticEnabled) vibrate([50, 50, 50]);
            } finally {
                setIsLoadingExternal(false);
            }
        }
    };

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            if(userData.hapticEnabled) vibrate(50);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setVoiceText(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Erreur reconnaissance vocale", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const processVoiceInput = async () => {
        if (!voiceText.trim()) return;
        setIsProcessingVoice(true);
        
        try {
            const storedKey = localStorage.getItem('USER_GEMINI_API_KEY');
            const envKey = process.env.GEMINI_API_KEY;
            const apiKey = storedKey || envKey;
            
            if (!apiKey) {
                setShowApiKeyModal(true);
                setIsProcessingVoice(false);
                return;
            }

            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `L'utilisateur a dit : "${voiceText}". 
                Extrais les aliments mentionnés, estime leur quantité en grammes, et donne les valeurs nutritionnelles pour 100g (kcal, protéines, glucides, lipides).
                Trouve aussi un emoji pertinent pour chaque aliment.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Nom de l'aliment en français" },
                                emoji: { type: Type.STRING, description: "Un seul emoji représentant l'aliment" },
                                quantity: { type: Type.NUMBER, description: "Quantité estimée en grammes" },
                                per100g: {
                                    type: Type.OBJECT,
                                    properties: {
                                        kcal: { type: Type.NUMBER },
                                        protein: { type: Type.NUMBER },
                                        carbs: { type: Type.NUMBER },
                                        fats: { type: Type.NUMBER }
                                    },
                                    required: ["kcal", "protein", "carbs", "fats"]
                                }
                            },
                            required: ["name", "emoji", "quantity", "per100g"]
                        }
                    }
                }
            });

            const jsonStr = response.text?.trim() || "[]";
            const foods = JSON.parse(jsonStr);

            if (foods && foods.length > 0) {
                // Add all foods to the log directly
                let currentLogData = [...todayLog];
                foods.forEach((food: any) => {
                    const ratio = food.quantity / 100;
                    currentLogData.push({
                        id: Date.now() + Math.random(),
                        name: food.name,
                        emoji: food.emoji || '🍽️',
                        quantity: food.quantity,
                        kcal: (food.per100g.kcal || 0) * ratio,
                        protein: (food.per100g.protein || 0) * ratio,
                        carbs: (food.per100g.carbs || 0) * ratio,
                        fats: (food.per100g.fats || 0) * ratio,
                        per100g: food.per100g
                    });
                });
                
                setNutritionLog({ ...nutritionLog, [today]: currentLogData });
                setVoiceText('');
                setShowVoiceModal(false);
                if(userData.hapticEnabled) vibrate([50, 50, 50]);
            } else {
                alert("Je n'ai pas pu comprendre les aliments mentionnés.");
            }
        } catch (error) {
            console.error("Erreur IA", error);
            alert("Une erreur est survenue lors de l'analyse.");
        } finally {
            setIsProcessingVoice(false);
        }
    };

    const saveApiKey = () => {
        if (tempApiKey.trim()) {
            localStorage.setItem('USER_GEMINI_API_KEY', tempApiKey.trim());
            setHasStoredKey(true);
            setShowApiKeyModal(false);
            alert("Clé API sauvegardée ! Vous pouvez maintenant utiliser la saisie vocale.");
            // Optionally trigger the voice processing again if there's text
            if (voiceText.trim()) {
                processVoiceInput();
            }
        }
    };

    const deleteApiKey = () => {
        if (window.confirm("Voulez-vous vraiment supprimer votre clé API de cet appareil ?")) {
            localStorage.removeItem('USER_GEMINI_API_KEY');
            setTempApiKey('');
            setHasStoredKey(false);
            setShowApiKeyModal(false);
            alert("Clé API supprimée avec succès.");
        }
    };

    const openApiKeySettings = () => {
        const storedKey = localStorage.getItem('USER_GEMINI_API_KEY');
        setTempApiKey(storedKey || '');
        setShowApiKeyModal(true);
    };

    const nutrientTiming = getNutrientTiming();
    const filteredFood = FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return (
        <>
            {/* MAIN CONTENT inside animated div */}
            <div className="space-y-6 pb-24">
                
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
                            <button onClick={() => setShowVoiceModal(true)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition"><Mic size={20}/></button>
                            <button onClick={() => setShowScanner(true)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition"><ScanBarcode size={20}/></button>
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
                                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition group cursor-pointer" onClick={() => handleEditFood(item)}>
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
                                        <button onClick={(e) => { e.stopPropagation(); removeFood(item.id); }} className="text-slate-300 hover:text-rose-500 transition p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full">
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

            {/* BARCODE SCANNER MODAL */}
            {showScanner && (
                <div 
                    className="fixed inset-0 z-[10000] bg-black overflow-hidden touch-none overscroll-none"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', width: '100vw' }}
                >
                    <div className="absolute top-0 left-0 right-0 p-4 z-50 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pt-safe">
                        <button onClick={() => setShowScanner(false)} className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md hover:bg-white/30 transition-colors flex items-center gap-2 pr-4">
                            <X size={20}/> <span className="text-sm font-bold">Fermer</span>
                        </button>
                    </div>

                    <div className="absolute inset-0 w-full h-full bg-black scanner-wrapper">
                         <style>{`
                             .scanner-wrapper > div,
                             .scanner-wrapper > section {
                                 padding-top: 0 !important;
                                 height: 100% !important;
                                 width: 100% !important;
                                 position: absolute !important;
                                 top: 0 !important;
                                 left: 0 !important;
                                 margin: 0 !important;
                             }
                             .scanner-wrapper video {
                                 object-fit: cover !important;
                                 width: 100% !important;
                                 height: 100% !important;
                                 position: absolute !important;
                                 top: 0 !important;
                                 left: 0 !important;
                                 margin: 0 !important;
                             }
                         `}</style>
                         <Scanner 
                            onScan={handleScan} 
                            components={{ finder: false }}
                         />
                    </div>
                    
                    {/* Clean SVG Mask Overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-40" preserveAspectRatio="none">
                        <defs>
                            <mask id="scanner-mask">
                                <rect width="100%" height="100%" fill="white" />
                                <rect x="50%" y="50%" width="256" height="256" transform="translate(-128, -128)" rx="24" fill="black" />
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#scanner-mask)" />
                    </svg>

                    {/* Overlay Cutout Borders & Text */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-50">
                        <div className="w-64 h-64 relative">
                            {/* Corners */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-[24px]"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-[24px]"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-[24px]"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-[24px]"></div>
                        </div>
                        <p className="text-white font-medium mt-8 bg-black/40 px-5 py-2.5 rounded-full backdrop-blur-md text-sm shadow-xl">Placez le code-barres ici</p>
                    </div>
                </div>
            )}

            {/* VOICE INPUT MODAL */}
            {showVoiceModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300 top-0 left-0 w-full h-full">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 relative">
                        <button onClick={() => setShowVoiceModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition">
                            <X size={24}/>
                        </button>
                        
                        <div className="text-center mb-6 mt-4">
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mic size={32}/>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Saisie Vocale</h2>
                            <p className="text-slate-500 text-sm">Dites ce que vous avez mangé, l'IA s'occupe du reste.</p>
                        </div>

                        <div className="relative mb-6">
                            <textarea 
                                value={voiceText}
                                onChange={(e) => setVoiceText(e.target.value)}
                                placeholder="Ex: J'ai mangé deux œufs brouillés, une tranche de pain complet et un café..."
                                className="w-full h-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-700 dark:text-white outline-none focus:border-indigo-500 transition resize-none"
                            ></textarea>
                            
                            <button 
                                onClick={startListening}
                                className={`absolute bottom-4 right-4 p-3 rounded-full text-white shadow-lg transition-all ${isListening ? 'bg-rose-500 animate-pulse scale-110' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                <Mic size={20}/>
                            </button>
                        </div>

                        <button 
                            onClick={processVoiceInput}
                            disabled={!voiceText.trim() || isProcessingVoice}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isProcessingVoice ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>}
                            {isProcessingVoice ? "Analyse en cours..." : "Analyser le repas"}
                        </button>
                    </div>
                </div>
            )}

            {/* FOOD SEARCH MODAL - OUTSIDE of animated div to prevent stacking context clipping */}
            {showFoodSearch && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300 top-0 left-0 w-full h-full">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        
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

            <div className="mt-8 flex justify-center pb-8">
                <button 
                    onClick={openApiKeySettings}
                    className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-indigo-500 transition"
                >
                    <Key size={14} />
                    {hasStoredKey ? "Gérer ma clé API Gemini" : "Configurer l'IA Gemini"}
                </button>
            </div>

            {/* API KEY MODAL */}
            {showApiKeyModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Globe className="text-indigo-500" /> Clé API Requise
                                </h3>
                                <button onClick={() => setShowApiKeyModal(false)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition">
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Pour analyser intelligemment vos repas par la voix, l'application utilise l'intelligence artificielle Gemini.
                            </p>
                            
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl mb-6 text-xs text-indigo-800 dark:text-indigo-200 space-y-2">
                                <p><strong>Pourquoi une clé ?</strong> L'IA a un coût. En utilisant votre propre clé gratuite, l'application reste 100% gratuite et sans abonnement.</p>
                                <p><strong>Sécurité :</strong> Votre clé est sauvegardée <em>uniquement</em> sur votre appareil (navigateur). Elle n'est jamais envoyée sur nos serveurs.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Votre clé API Gemini</label>
                                    <input 
                                        type="password" 
                                        value={tempApiKey}
                                        onChange={(e) => setTempApiKey(e.target.value)}
                                        placeholder="AIzaSy..."
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                                        Obtenir une clé API gratuite ici
                                    </a>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    {hasStoredKey && (
                                        <button 
                                            onClick={deleteApiKey}
                                            className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl py-4 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                                        >
                                            Supprimer
                                        </button>
                                    )}
                                    <button 
                                        onClick={saveApiKey}
                                        disabled={!tempApiKey.trim()}
                                        className="flex-[2] bg-indigo-600 text-white rounded-xl py-4 font-bold disabled:opacity-50 hover:bg-indigo-700 transition"
                                    >
                                        Sauvegarder
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
