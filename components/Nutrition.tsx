import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanBarcode, X, AlertTriangle, RefreshCw, Search, Zap, Plus, 
  Minus, Scale, TrendingDown, Activity, TrendingUp, Utensils, 
  Trash2, Wheat, Beef, Droplet, Calculator, ShoppingBag, Edit2
} from 'lucide-react';

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

export const NutritionView = ({ userData, setUserData, nutritionLog, setNutritionLog }: any) => {
    const [isAddingMeal, setIsAddingMeal] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    // On ajoute 'quantity' et 'per100g' pour gérer le calcul auto
    const [newMeal, setNewMeal] = useState({ name: '', kcal: '', protein: '', carbs: '', fats: '', quantity: '', per100g: null as any });
    const [editingId, setEditingId] = useState<number | null>(null);
    
    // États pour la recherche API
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Calculs Métaboliques (Mifflin-St Jeor)
    const calculateTDEE = () => {
        if (!userData.weight || !userData.height || !userData.age || !userData.gender) return 2000;
        
        let bmr = 0;
        if (userData.gender === 'male') {
            bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age + 5;
        } else {
            bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age - 161;
        }
        
        const totalSessions = (userData.runDaysPerWeek || 0) + (userData.strengthDaysPerWeek || 0) + (userData.hyroxSessionsPerWeek || 0);
        let activityMultiplier = 1.2;
        if (totalSessions >= 3) activityMultiplier = 1.375;
        if (totalSessions >= 5) activityMultiplier = 1.55;
        if (totalSessions >= 7) activityMultiplier = 1.725;
        
        const maintenance = Math.round(bmr * activityMultiplier);
        
        switch (userData.nutritionGoal) {
            case 'cut': return maintenance - 400;
            case 'bulk': return maintenance + 300;
            default: return maintenance;
        }
    };
    
    const targetCalories = calculateTDEE();
    const proteinTarget = Math.round(userData.weight * (userData.strengthDaysPerWeek > 0 ? 2.0 : 1.6)); 
    const fatTarget = Math.round((targetCalories * 0.25) / 9);
    const carbTarget = Math.round((targetCalories - (proteinTarget * 4) - (fatTarget * 9)) / 4); 

    const today = new Date().toISOString().split('T')[0];
    const todayLog = nutritionLog[today] || [];
    
    const currentTotals = todayLog.reduce((acc: any, meal: any) => ({
        kcal: acc.kcal + (parseInt(meal.kcal) || 0),
        protein: acc.protein + (parseInt(meal.protein) || 0),
        carbs: acc.carbs + (parseInt(meal.carbs) || 0),
        fats: acc.fats + (parseInt(meal.fats) || 0)
    }), { kcal: 0, protein: 0, carbs: 0, fats: 0 });

    const handleCloseModal = () => {
        setNewMeal({ name: '', kcal: '', protein: '', carbs: '', fats: '', quantity: '', per100g: null });
        setSearchQuery('');
        setSearchResults([]);
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

    // Fonction de recherche OpenFoodFacts
    const searchFood = async () => {
        if (!searchQuery || searchQuery.length < 2) return;
        setIsSearching(true);
        try {
            // Requête vers l'API OpenFoodFacts
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

    const selectSearchedProduct = (product: any) => {
        const name = `${product.product_name || "Produit Inconnu"} ${product.brands ? `(${product.brands})` : ''}`;
        const nutriments = product.nutriments || {};

        // Stockage des valeurs de base pour 100g
        const per100g = {
            kcal: nutriments['energy-kcal_100g'] || 0,
            protein: nutriments.proteins_100g || 0,
            carbs: nutriments.carbohydrates_100g || 0,
            fats: nutriments.fat_100g || 0
        };

        setNewMeal({
            name: name,
            kcal: Math.round(per100g.kcal).toString(),
            protein: Math.round(per100g.protein).toString(),
            carbs: Math.round(per100g.carbs).toString(),
            fats: Math.round(per100g.fats).toString(),
            quantity: '100', // Par défaut 100g
            per100g: per100g
        });
        setSearchResults([]); // Cacher la liste après sélection
    };

    const handleScanSuccess = (product: any) => {
        const name = product.product_name || "Produit scanné";
        const nutriments = product.nutriments || {};
        
        // Stockage des valeurs de base pour 100g
        const per100g = {
            kcal: nutriments['energy-kcal_100g'] || 0,
            protein: nutriments.proteins_100g || 0,
            carbs: nutriments.carbohydrates_100g || 0,
            fats: nutriments.fat_100g || 0
        };

        setNewMeal({
            name: name,
            kcal: Math.round(per100g.kcal).toString(),
            protein: Math.round(per100g.protein).toString(),
            carbs: Math.round(per100g.carbs).toString(),
            fats: Math.round(per100g.fats).toString(),
            quantity: '100', // Par défaut 100g
            per100g: per100g
        });
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

            {(!userData.height || !userData.gender || !userData.age) && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl animate-in fade-in">
                    <h4 className="font-bold text-orange-800 text-sm mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Complétez votre profil</h4>
                    <p className="text-xs text-orange-700 mb-3">Pour un calcul précis, nous avons besoin de vos infos.</p>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="Taille (cm)" className="p-2 rounded-lg text-sm border-orange-200 outline-none" value={userData.height || ''} onChange={(e) => setUserData({...userData, height: parseInt(e.target.value)})} />
                        <input type="number" placeholder="Âge" className="p-2 rounded-lg text-sm border-orange-200 outline-none" value={userData.age || ''} onChange={(e) => setUserData({...userData, age: parseInt(e.target.value)})} />
                        <select className="p-2 rounded-lg text-sm border-orange-200 col-span-2 outline-none" value={userData.gender || ''} onChange={(e) => setUserData({...userData, gender: e.target.value})}>
                            <option value="">Sélectionner le genre</option>
                            <option value="male">Homme</option>
                            <option value="female">Femme</option>
                        </select>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center"><Scale size={20}/></div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Poids Actuel</div>
                        <div className="font-black text-lg text-slate-800 flex items-baseline gap-1">{userData.weight} <span className="text-sm font-medium text-slate-400">kg</span></div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setUserData({...userData, weight: userData.weight - 0.5})} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"><Minus size={16}/></button>
                    <button onClick={() => setUserData({...userData, weight: userData.weight + 0.5})} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"><Plus size={16}/></button>
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
                {todayLog.length > 0 ? (
                    <div className="space-y-2">
                        {todayLog.map((meal: any) => (
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

                        {/* Barre de recherche API */}
                        <div className="mb-6 relative z-50">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Rechercher (ex: Fromage blanc, Pâtes...)" 
                                    className="w-full pl-10 pr-12 py-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchFood()}
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <button 
                                    onClick={searchFood}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                    disabled={isSearching}
                                >
                                    {isSearching ? <RefreshCw className="animate-spin" size={16}/> : <Search size={16}/>}
                                </button>
                            </div>
                            
                            {/* Résultats de recherche */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50 divide-y divide-slate-50">
                                    {searchResults.map((product) => (
                                        <button 
                                            key={product.id} 
                                            onClick={() => selectSearchedProduct(product)}
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