import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanBarcode, X, AlertTriangle, RefreshCw, Search, Zap, Plus, 
  Minus, Scale, TrendingDown, Activity, TrendingUp, Utensils, 
  Trash2, Wheat, Beef, Droplet, Calculator, ShoppingBag, Edit2, GlassWater, Clock, Globe
} from 'lucide-react';
import { calculateDailyCalories, getNutrientTiming } from '../utils/helpers';
import { FOOD_DATABASE } from '../data/foodDatabase';

const ScannerModal = ({ onClose, onScanSuccess }: {onClose: () => void, onScanSuccess: (data: any) => void}) => {
    const [barcode, setBarcode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);
    const scannerRef = useRef<any>(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://unpkg.com/html5-qrcode";
        script.async = true;
        
        script.onload = () => {
            if(!(window as any).Html5Qrcode) {
                setError("Erreur chargement librairie.");
                return;
            }

            const html5QrCode = new (window as any).Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            
            html5QrCode.start(
                { facingMode: "environment" }, 
                config, 
                (decodedText: string) => {
                    html5QrCode.pause(); 
                    fetchProduct(decodedText);
                },
                (errorMessage: string) => { }
            ).catch((err: any) => {
                console.error(err);
                setError("Accès caméra refusé. Vérifiez vos permissions.");
            });
        };

        document.body.appendChild(script);

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop().then(() => scannerRef.current.clear());
                } catch (e) { console.log("Scanner stop error", e); }
            }
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const fetchProduct = async (code: string) => {
        setLoading(true);
        setError(null);
        setBarcode(code); 
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
            const data = await response.json();
            if (data.status === 1) {
                 const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                 audio.play().catch(e => console.log("Audio error", e));
                 
                 if(scannerRef.current) {
                     await scannerRef.current.stop();
                     scannerRef.current.clear();
                 }
                 onScanSuccess(data.product);
                 onClose();
            } else {
                setError("Produit introuvable. Scannez un autre code.");
                if(scannerRef.current) scannerRef.current.resume(); 
            }
        } catch (err) {
            setError("Erreur réseau.");
            if(scannerRef.current) scannerRef.current.resume();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] bg-black flex flex-col items-center justify-center">
            <div className="relative w-full h-full max-w-md bg-black flex flex-col">
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                    <span className="text-white font-bold flex items-center gap-2"><ScanBarcode size={20}/> Scanner un produit</span>
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white"><X size={20}/></button>
                </div>
                
                <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
                    <div id="reader" className="w-full h-full object-cover"></div>
                    
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 p-6 text-center">
                            <div>
                                <AlertTriangle size={48} className="mx-auto mb-4 text-rose-500"/>
                                <p className="text-white mb-4">{error}</p>
                                <button onClick={() => { setError(null); window.location.reload(); }} className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold">Réessayer</button>
                            </div>
                        </div>
                    )}
                     {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                            <RefreshCw className="animate-spin text-white" size={48}/>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
                     <p className="text-slate-400 text-xs text-center mb-2">Visez le code-barres ou entrez-le manuellement.</p>
                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Code-barres (ex: 3017620422003)" 
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition font-mono"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                        />
                        <button 
                            onClick={() => fetchProduct(barcode)}
                            disabled={!barcode || loading}
                            className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20}/> : <Search size={20}/>}
                        </button>
                     </div>
                     <button 
                        onClick={() => fetchProduct('3033490004743')} 
                        className="w-full py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition flex items-center justify-center gap-2"
                     >
                        <Zap size={14} className="text-yellow-400"/> Simulation (Scanner une Danette Vanille)
                     </button>
                </div>
            </div>
        </div>
    );
};

export const NutrientTiming = () => {
    const timing = getNutrientTiming();
    return (
        <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Clock size={48}/></div>
            <div className="relative z-10 flex items-start gap-4">
                <div className="text-3xl bg-white/10 p-2 rounded-xl backdrop-blur-md">{timing.icon}</div>
                <div>
                    <h4 className="font-bold text-sm text-indigo-300 uppercase tracking-wide mb-1">{timing.label} (Maintenant)</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{timing.advice}</p>
                </div>
            </div>
        </div>
    );
};

export const NutritionView = ({ userData, setUserData, nutritionLog, setNutritionLog }: any) => {
    const [isAddingMeal, setIsAddingMeal] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [newMeal, setNewMeal] = useState({ name: '', kcal: '', protein: '', carbs: '', fats: '', quantity: '', per100g: null as any });
    const [editingId, setEditingId] = useState<number | null>(null);
    
    // États pour la recherche
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [localResults, setLocalResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Calcul des résultats locaux instantanés
    useEffect(() => {
        if (searchQuery.length < 2) {
            setLocalResults([]);
            return;
        }
        const filtered = FOOD_DATABASE.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setLocalResults(filtered);
    }, [searchQuery]);

    // Récupération de l'objectif calorique via le helper partagé
    const { target: targetCalories } = calculateDailyCalories(userData);
    
    const proteinTarget = Math.round(userData.weight * (userData.strengthDaysPerWeek > 0 ? 2.0 : 1.6)); 
    const fatTarget = Math.round((targetCalories * 0.25) / 9);
    const carbTarget = Math.round((targetCalories - (proteinTarget * 4) - (fatTarget * 9)) / 4); 

    const today = new Date().toISOString().split('T')[0];
    const todayLog = nutritionLog[today] || [];
    
    // WATER TRACKING LOGIC
    const waterEntry = todayLog.find((m: any) => m.name === 'WATER_TRACKER');
    const waterIntake = waterEntry ? parseInt(waterEntry.kcal) : 0; 

    const updateWater = (amount: number) => {
        const updatedLog = { ...nutritionLog };
        if (!updatedLog[today]) updatedLog[today] = [];
        
        const newAmount = Math.max(0, waterIntake + amount);
        
        if (waterEntry) {
            updatedLog[today] = updatedLog[today].map((m: any) => 
                m.name === 'WATER_TRACKER' ? { ...m, kcal: newAmount.toString() } : m
            );
        } else {
            updatedLog[today].push({ 
                id: 'water-' + Date.now(), 
                name: 'WATER_TRACKER', 
                kcal: newAmount.toString(), 
                protein: '0', carbs: '0', fats: '0' 
            });
        }
        setNutritionLog(updatedLog);
    };

    const baseWater = userData.weight * 35; 
    const activeWater = (userData.dailyActivity === 'active' ? 500 : userData.dailyActivity === 'very_active' ? 1000 : 0);
    const waterTarget = baseWater + activeWater;

    const currentTotals = todayLog.filter((m:any) => m.name !== 'WATER_TRACKER').reduce((acc: any, meal: any) => ({
        kcal: acc.kcal + (parseInt(meal.kcal) || 0),
        protein: acc.protein + (parseInt(meal.protein) || 0),
        carbs: acc.carbs + (parseInt(meal.carbs) || 0),
        fats: acc.fats + (parseInt(meal.fats) || 0)
    }), { kcal: 0, protein: 0, carbs: 0, fats: 0 });

    const handleCloseModal = () => {
        setNewMeal({ name: '', kcal: '', protein: '', carbs: '', fats: '', quantity: '', per100g: null });
        setSearchQuery('');
        setSearchResults([]);
        setLocalResults([]);
        setEditingId(null);
        setIsAddingMeal(false);
    };

    const addMeal = () => {
        if (!newMeal.name || !newMeal.kcal) return;
        const updatedLog = { ...nutritionLog };
        if (!updatedLog[today]) updatedLog[today] = [];

        if (editingId) {
             updatedLog[today] = updatedLog[today].map((m: any) => m.id === editingId ? { ...newMeal, id: editingId } : m);
        } else {
             updatedLog[today].push({ ...newMeal, id: Date.now() });
        }
        
        setNutritionLog(updatedLog);
        handleCloseModal();
    };

    const startEdit = (meal: any) => {
        setNewMeal({
            name: meal.name,
            kcal: meal.kcal,
            protein: meal.protein || '',
            carbs: meal.carbs || '',
            fats: meal.fats || '',
            quantity: meal.quantity || '',
            per100g: meal.per100g || null
        });
        setEditingId(meal.id);
        setIsAddingMeal(true);
    };

    const deleteMeal = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const updatedLog = { ...nutritionLog };
        updatedLog[today] = updatedLog[today].filter((m: any) => m.id !== id);
        setNutritionLog(updatedLog);
        if (editingId === id) handleCloseModal();
    };

    const searchFoodAPI = async () => {
        if (!searchQuery || searchQuery.length < 2) return;
        setIsSearching(true);
        setLocalResults([]); // Clear local to show API results are coming
        try {
            const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments,id,_keywords`);
            const data = await res.json();
            if (data.products) {
                setSearchResults(data.products);
            }
        } catch (e) {
            console.error("Erreur recherche OFF", e);
        } finally {
            setIsSearching(false);
        }
    };

    const selectProduct = (product: any, isLocal = false) => {
        let name, per100g;

        if (isLocal) {
            name = `${product.emoji} ${product.name}`;
            per100g = product.per100g;
        } else {
            name = `${product.product_name || "Produit Inconnu"} ${product.brands ? `(${product.brands})` : ''}`;
            per100g = {
                kcal: product.nutriments?.['energy-kcal_100g'] || 0,
                protein: product.nutriments?.proteins_100g || 0,
                carbs: product.nutriments?.carbohydrates_100g || 0,
                fats: product.nutriments?.fat_100g || 0
            };
        }

        setNewMeal({
            name: name,
            kcal: Math.round(per100g.kcal).toString(),
            protein: Math.round(per100g.protein).toString(),
            carbs: Math.round(per100g.carbs).toString(),
            fats: Math.round(per100g.fats).toString(),
            quantity: '100',
            per100g: per100g
        });
        setSearchResults([]);
        setLocalResults([]);
        setSearchQuery('');
    };

    const handleScanSuccess = (product: any) => {
        selectProduct(product, false);
        setIsAddingMeal(true); 
    };

    const handleQtyChange = (val: string) => {
        const qty = parseFloat(val);
        if (isNaN(qty) || !newMeal.per100g) {
            setNewMeal({ ...newMeal, quantity: val });
            return;
        }

        const ratio = qty / 100;
        setNewMeal({
            ...newMeal,
            quantity: val,
            kcal: Math.round(newMeal.per100g.kcal * ratio).toString(),
            protein: Math.round(newMeal.per100g.protein * ratio).toString(),
            carbs: Math.round(newMeal.per100g.carbs * ratio).toString(),
            fats: Math.round(newMeal.per100g.fats * ratio).toString(),
        });
    };

    const MacroBar = ({ label, current, target, color, icon: Icon, unit = 'g' }: any) => {
        const percent = Math.min(100, (current / target) * 100);
        return (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className={`p-1.5 rounded-lg ${color.bg} ${color.text}`}><Icon size={12}/></div>
                        {label}
                    </div>
                    <div className="text-xs font-medium text-slate-400">{current} / {target}{unit}</div>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${color.fill}`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 pb-20">
            {isScanning && <ScannerModal onClose={() => setIsScanning(false)} onScanSuccess={handleScanSuccess} />}
            
            {/* NUTRIENT TIMING */}
            <NutrientTiming />

            {/* HYDRATION TRACKER */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-black flex items-center gap-2"><GlassWater size={20}/> Hydratation</h3>
                            <p className="text-xs text-blue-100 opacity-90">Objectif du jour : {waterTarget} ml</p>
                        </div>
                        <div className="text-3xl font-black">{waterIntake} <span className="text-sm font-medium opacity-70">ml</span></div>
                    </div>
                    
                    <div className="h-4 w-full bg-black/20 rounded-full overflow-hidden mb-6 backdrop-blur-sm">
                        <div 
                            className="h-full bg-white transition-all duration-700 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                            style={{ width: `${Math.min(100, (waterIntake / waterTarget) * 100)}%` }}
                        ></div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => updateWater(250)} className="flex-1 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold text-sm transition flex items-center justify-center gap-1 active:scale-95">
                            <Plus size={14}/> 250ml
                        </button>
                        <button onClick={() => updateWater(500)} className="flex-1 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold text-sm transition flex items-center justify-center gap-1 active:scale-95">
                            <Plus size={14}/> 500ml
                        </button>
                        <button onClick={() => updateWater(-250)} className="w-12 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-xl transition active:scale-95">
                            <Minus size={16}/>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">Mon Énergie</h3>
                        <p className="text-xs text-slate-500 font-medium">Objectif: {userData.nutritionGoal === 'cut' ? 'Perte de poids' : userData.nutritionGoal === 'bulk' ? 'Prise de masse' : 'Maintien'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsScanning(true)} className="bg-slate-900 text-white p-2 rounded-xl shadow-lg hover:scale-105 transition" title="Scanner un produit"><ScanBarcode size={24}/></button>
                        <button onClick={() => setIsAddingMeal(true)} className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg hover:scale-105 transition" title="Ajout manuel"><Plus size={24}/></button>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-8 mb-6">
                    <div className="text-center">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Objectif</div>
                        <div className="text-xl font-black text-slate-700">{targetCalories}</div>
                    </div>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                            <circle 
                                cx="50" cy="50" r="45" fill="none" stroke={currentTotals.kcal > targetCalories ? "#f43f5e" : "#4f46e5"} strokeWidth="10" 
                                strokeDasharray="283" 
                                strokeDashoffset={283 - (Math.min(currentTotals.kcal / targetCalories, 1) * 283)} 
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-slate-800">{targetCalories - currentTotals.kcal}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Restant</span>
                        </div>
                    </div>
                    <div className="text-center">
                         <div className="text-xs font-bold text-slate-400 uppercase mb-1">Mangé</div>
                         <div className="text-xl font-black text-indigo-600">{currentTotals.kcal}</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <MacroBar label="Glucides" current={currentTotals.carbs} target={carbTarget} icon={Wheat} color={{bg:'bg-amber-100', text:'text-amber-600', fill:'bg-amber-400'}} />
                    <MacroBar label="Protéines" current={currentTotals.protein} target={proteinTarget} icon={Beef} color={{bg:'bg-blue-100', text:'text-blue-600', fill:'bg-blue-500'}} />
                    <MacroBar label="Lipides" current={currentTotals.fats} target={fatTarget} icon={Droplet} color={{bg:'bg-rose-100', text:'text-rose-600', fill:'bg-rose-400'}} />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1 flex">
                {[
                    {id: 'cut', label: 'Perte', icon: TrendingDown},
                    {id: 'maintain', label: 'Maintien', icon: Activity},
                    {id: 'bulk', label: 'Masse', icon: TrendingUp}
                ].map(g => (
                    <button 
                        key={g.id}
                        onClick={() => setUserData({...userData, nutritionGoal: g.id})}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${userData.nutritionGoal === g.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <g.icon size={16}/> {g.label}
                    </button>
                ))}
            </div>

            <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Utensils size={18}/> Journal du jour</h4>
                {todayLog.filter((m:any) => m.name !== 'WATER_TRACKER').length > 0 ? (
                    <div className="space-y-2">
                        {todayLog.filter((m:any) => m.name !== 'WATER_TRACKER').map((meal: any) => (
                            <div 
                                key={meal.id} 
                                onClick={() => startEdit(meal)}
                                className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition group"
                            >
                                <div>
                                    <div className="font-bold text-sm text-slate-700 group-hover:text-indigo-700">{meal.name}</div>
                                    <div className="text-[10px] text-slate-400 flex gap-2 group-hover:text-indigo-400">
                                        {meal.quantity && <span className="font-medium text-indigo-500">{meal.quantity}g •</span>}
                                        <span>{meal.kcal} kcal</span>
                                        {meal.protein && <span>• {meal.protein}g P</span>}
                                        {meal.carbs && <span>• {meal.carbs}g G</span>}
                                        {meal.fats && <span>• {meal.fats}g L</span>}
                                    </div>
                                </div>
                                <button onClick={(e) => deleteMeal(e, meal.id)} className="text-slate-300 hover:text-rose-500 p-2"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Aucun repas enregistré aujourd'hui.
                    </div>
                )}
            </div>

            {isAddingMeal && (
                <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-xl text-slate-800">{editingId ? 'Modifier l\'aliment' : 'Ajouter un aliment'}</h3>
                            <button onClick={handleCloseModal} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
                        </div>

                        {/* Barre de recherche Hybride */}
                        <div className="mb-6 relative z-50">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Chercher (ex: Poulet, Riz, Oeuf...)" 
                                    className="w-full pl-10 pr-12 py-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchFoodAPI()}
                                    autoFocus
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                {searchQuery.length > 2 && (
                                    <button 
                                        onClick={searchFoodAPI}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition"
                                        title="Chercher sur le web"
                                    >
                                        <Globe size={16}/>
                                    </button>
                                )}
                            </div>
                            
                            {/* Résultats Locaux (Prioritaires) */}
                            {localResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-indigo-100 max-h-60 overflow-y-auto z-50 divide-y divide-slate-50 ring-2 ring-indigo-500/10">
                                    <div className="px-3 py-2 bg-indigo-50 text-[10px] font-bold uppercase text-indigo-500 tracking-wider">Base de données Rapide</div>
                                    {localResults.map((product, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => selectProduct(product, true)}
                                            className="w-full text-left p-3 hover:bg-indigo-50 transition flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-xl">{product.emoji}</div>
                                                <div>
                                                    <div className="font-bold text-xs text-slate-800">{product.name}</div>
                                                    <div className="text-[10px] text-slate-400">{product.per100g.kcal} kcal / 100g</div>
                                                </div>
                                            </div>
                                            <Plus size={14} className="text-indigo-500 opacity-0 group-hover:opacity-100"/>
                                        </button>
                                    ))}
                                    <button onClick={searchFoodAPI} className="w-full text-center py-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition border-t border-indigo-100">
                                        Pas trouvé ? Chercher "{searchQuery}" sur le web
                                    </button>
                                </div>
                            )}

                            {/* Résultats API (Fallback) */}
                            {searchResults.length > 0 && localResults.length === 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50 divide-y divide-slate-50">
                                    <div className="px-3 py-2 bg-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Résultats Web</div>
                                    {searchResults.map((product) => (
                                        <button 
                                            key={product.id} 
                                            onClick={() => selectProduct(product, false)}
                                            className="w-full text-left p-3 hover:bg-indigo-50 transition flex items-center justify-between group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-xs text-slate-800 truncate">{product.product_name}</div>
                                                <div className="text-[10px] text-slate-500 truncate">{product.brands}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded group-hover:bg-indigo-200 group-hover:text-indigo-700">
                                                    {Math.round(product.nutriments?.['energy-kcal_100g'] || 0)} kcal
                                                </div>
                                                <Plus size={14} className="text-indigo-500 opacity-0 group-hover:opacity-100"/>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {isSearching && (
                                <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-xl shadow-xl text-center">
                                    <RefreshCw className="animate-spin mx-auto text-indigo-600" size={24}/>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Nom</label>
                                <input type="text" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Banane, Poulet..." value={newMeal.name} onChange={e => setNewMeal({...newMeal, name: e.target.value})} />
                            </div>

                            {newMeal.per100g && (
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-1"><Scale size={14}/> Quantité</label>
                                        <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold">Auto-calcul activé</span>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            className="w-full p-3 bg-white rounded-xl border border-indigo-200 font-black text-2xl text-indigo-700 focus:ring-4 focus:ring-indigo-100 outline-none" 
                                            placeholder="100" 
                                            value={newMeal.quantity} 
                                            onChange={e => handleQtyChange(e.target.value)} 
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-indigo-300">grammes</span>
                                    </div>
                                    <p className="text-[10px] text-indigo-400 mt-2 text-center">Modifiez la quantité pour mettre à jour les valeurs ci-dessous.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Calories</label>
                                    <div className="relative">
                                        <input type="number" className={`w-full p-3 bg-slate-50 rounded-xl border font-bold text-slate-700 focus:ring-2 outline-none transition-colors ${newMeal.per100g ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 focus:ring-indigo-500'}`} placeholder="0" value={newMeal.kcal} onChange={e => setNewMeal({...newMeal, kcal: e.target.value})} readOnly={!!newMeal.per100g} />
                                        <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">kcal</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Protéines</label>
                                    <div className="relative">
                                        <input type="number" className={`w-full p-3 bg-slate-50 rounded-xl border font-bold text-slate-700 focus:ring-2 outline-none transition-colors ${newMeal.per100g ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 focus:ring-indigo-500'}`} placeholder="Opt." value={newMeal.protein} onChange={e => setNewMeal({...newMeal, protein: e.target.value})} readOnly={!!newMeal.per100g} />
                                        <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">g</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Glucides</label>
                                    <div className="relative">
                                        <input type="number" className={`w-full p-3 bg-slate-50 rounded-xl border font-bold text-slate-700 focus:ring-2 outline-none transition-colors ${newMeal.per100g ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 focus:ring-indigo-500'}`} placeholder="Opt." value={newMeal.carbs} onChange={e => setNewMeal({...newMeal, carbs: e.target.value})} readOnly={!!newMeal.per100g} />
                                        <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">g</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Lipides</label>
                                    <div className="relative">
                                        <input type="number" className={`w-full p-3 bg-slate-50 rounded-xl border font-bold text-slate-700 focus:ring-2 outline-none transition-colors ${newMeal.per100g ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 focus:ring-indigo-500'}`} placeholder="Opt." value={newMeal.fats} onChange={e => setNewMeal({...newMeal, fats: e.target.value})} readOnly={!!newMeal.per100g} />
                                        <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">g</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={addMeal} disabled={!newMeal.name || !newMeal.kcal} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 mt-4">
                                {editingId ? "Mettre à jour" : "Ajouter au journal"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};