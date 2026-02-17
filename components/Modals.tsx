
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, ListPlus, Search, Dumbbell, Plus, Clock, Footprints, 
  Minus, SkipForward, Check, Square, Activity, Timer, 
  Brain, Target, CheckCircle, Download, Camera, Save, Upload, Copy, FileJson, Calculator, ChevronRight, Disc, HeartPulse
} from 'lucide-react';
import { STRENGTH_PROTOCOLS, RUN_PROTOCOLS } from '../data/protocols';
import { parseRestTime, getMuscleActivation, formatStopwatch, calculate1RM, calculatePlates, calculateHeartRateZones } from '../utils/helpers';
import { MuscleHeatmap } from './Visuals';
import { downloadShareImage, downloadTCX } from '../utils/logic';

// --- NEW COMPONENT: Heart Rate Modal ---
export const HeartRateModal = ({ onClose, userData }: { onClose: () => void, userData: any }) => {
    const [maxHr, setMaxHr] = useState(userData?.heartRate?.max || 180);
    const [restHr, setRestHr] = useState(userData?.heartRate?.rest || 60);
    
    const zones = calculateHeartRateZones(maxHr, restHr);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={20}/></button>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><HeartPulse size={20} className="text-rose-600"/> Zones Cardiaques</h3>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">FC Max</label>
                            <input type="number" value={maxHr} onChange={e => setMaxHr(parseInt(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 font-black text-xl text-slate-700 dark:text-white outline-none focus:border-rose-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">FC Repos</label>
                            <input type="number" value={restHr} onChange={e => setRestHr(parseInt(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 font-black text-xl text-slate-700 dark:text-white outline-none focus:border-rose-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        {zones.map(z => (
                            <div key={z.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full ${z.color} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>Z{z.id}</div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{z.name}</div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-400 leading-tight max-w-[160px]">{z.desc}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-slate-800 dark:text-white text-sm">{z.minBpm}-{z.maxBpm}</div>
                                    <div className="text-[9px] text-slate-400 font-mono">bpm</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: Plate Calculator Modal ---
export const PlateCalculatorModal = ({ onClose }: { onClose: () => void }) => {
    const [targetWeight, setTargetWeight] = useState<string>('');
    const [plates, setPlates] = useState<number[]>([]);
    
    const calculate = (wStr: string) => {
        setTargetWeight(wStr);
        const w = parseFloat(wStr);
        if(!isNaN(w)) {
            setPlates(calculatePlates(w));
        } else {
            setPlates([]);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Disc size={20} className="text-rose-600"/> Calculateur de Disques</h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Charge Totale (Barre 20kg incluse)</label>
                        <div className="flex items-center gap-2 mt-2">
                            <input 
                                type="number" 
                                value={targetWeight} 
                                onChange={e => calculate(e.target.value)} 
                                className="flex-1 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 font-black text-3xl text-slate-700 dark:text-white outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 transition text-center" 
                                placeholder="ex: 80" 
                                autoFocus
                            />
                            <span className="font-bold text-slate-400">KG</span>
                        </div>
                    </div>

                    <div className="h-24 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden border border-slate-200 dark:border-slate-700">
                        {/* Barre */}
                        <div className="w-full h-4 bg-slate-400 absolute z-0"></div>
                        {/* Disques */}
                        <div className="flex items-center gap-1 z-10">
                            {plates.length > 0 ? (
                                plates.map((p, i) => {
                                    let h = "h-16"; 
                                    let color = "bg-rose-500";
                                    if(p === 25) { h = "h-20"; color = "bg-red-600"; }
                                    if(p === 20) { h = "h-20"; color = "bg-blue-600"; }
                                    if(p === 15) { h = "h-16"; color = "bg-yellow-500"; }
                                    if(p === 10) { h = "h-14"; color = "bg-green-600"; }
                                    if(p === 5) { h = "h-10"; color = "bg-white border-2 border-slate-300"; }
                                    if(p <= 2.5) { h = "h-8"; color = "bg-slate-700"; }

                                    return (
                                        <div key={i} className={`w-3 ${h} ${color} rounded-sm shadow-sm border-r border-black/10 flex items-center justify-center`}></div>
                                    );
                                })
                            ) : (
                                <span className="text-xs font-bold text-slate-400 bg-white/50 px-2 py-1 rounded">Barre vide (20kg)</span>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-3 text-center">À charger par côté</h4>
                        {plates.length > 0 ? (
                            <div className="flex flex-wrap justify-center gap-2">
                                {plates.map((p, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-600 border-2 border-slate-200 dark:border-slate-500 flex items-center justify-center font-bold text-slate-700 dark:text-white shadow-sm text-xs">
                                            {p}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 text-xs italic">-</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: 1RM Calculator Modal ---
export const OneRMModal = ({ onClose }: { onClose: () => void }) => {
    const [weight, setWeight] = useState<string>('');
    const [reps, setReps] = useState<string>('');
    const [result, setResult] = useState<number | null>(null);

    const calculate = () => {
        const w = parseFloat(weight);
        const r = parseFloat(reps);
        if(w && r) {
            setResult(calculate1RM(w, r));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={20}/></button>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Calculator size={20} className="text-indigo-600"/> Calculateur 1RM</h3>
                
                <div className="space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                        Entrez une performance récente (Poids x Répétitions) pour estimer votre charge maximale théorique (1RM).
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Poids (kg)</label>
                            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 font-black text-xl text-slate-700 dark:text-white outline-none focus:border-indigo-500" placeholder="ex: 60" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Reps</label>
                            <input type="number" value={reps} onChange={e => setReps(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 font-black text-xl text-slate-700 dark:text-white outline-none focus:border-indigo-500" placeholder="ex: 8" />
                        </div>
                    </div>

                    <button onClick={calculate} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                        Calculer
                    </button>

                    {result && (
                        <div className="mt-6 animate-in slide-in-from-bottom-2">
                            <div className="text-center mb-6">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Votre 1RM Estimé</div>
                                <div className="text-5xl font-black text-slate-800 dark:text-white">{result} <span className="text-lg text-slate-400 font-bold">kg</span></div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-2">Charges de travail suggérées</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {[90, 80, 70, 60, 50].map(pct => (
                                        <div key={pct} className="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg border border-slate-100 dark:border-slate-600 text-center">
                                            <div className="text-[10px] font-bold text-indigo-500">{pct}%</div>
                                            <div className="font-black text-slate-700 dark:text-slate-200">{Math.round(result * (pct/100))} <span className="text-[10px] text-slate-400 font-normal">kg</span></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- EXISTING MODALS ---
export const DataManagementModal = ({ onClose }: { onClose: () => void }) => {
    const [importData, setImportData] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    const getFullData = () => {
        return localStorage.getItem('clab_storage') || '';
    };

    const handleExport = () => {
        const data = getFullData();
        if (data) {
            navigator.clipboard.writeText(data).then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            });
        }
    };

    const handleDownload = () => {
        const data = getFullData();
        if(!data) return;
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clab_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = () => {
        if (!importData) return;
        try {
            JSON.parse(importData); // Validate JSON
            localStorage.setItem('clab_storage', importData);
            window.location.reload();
        } catch (e) {
            alert("Format de données invalide. Vérifiez votre copie.");
        }
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if(content) {
                try {
                    JSON.parse(content);
                    localStorage.setItem('clab_storage', content);
                    window.location.reload();
                } catch(e) {
                    alert("Fichier corrompu ou invalide.");
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Save size={20} className="text-indigo-600"/> Sauvegarde & Données</h3>
                
                <div className="space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-indigo-900 dark:text-indigo-200">Exporter les données</span>
                            <Upload size={16} className="text-indigo-500"/>
                        </div>
                        <p className="text-[10px] text-indigo-700 dark:text-indigo-300">Sauvegardez tout (Progression, Nutrition, Profil) dans un fichier sécurisé.</p>
                        
                        <div className="flex gap-2">
                            <button onClick={handleDownload} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                                <FileJson size={14}/> Télécharger fichier
                            </button>
                            <button onClick={handleExport} className={`flex-1 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${copySuccess ? 'bg-green-500 text-white' : 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50'}`}>
                                {copySuccess ? <Check size={14}/> : <Copy size={14}/>} Copier texte
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Importer une sauvegarde</span>
                            <Download size={16} className="text-slate-500"/>
                        </div>
                        
                        <div className="relative">
                            <input 
                                type="file" 
                                accept=".json" 
                                onChange={handleFileImport}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-full py-3 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-500 text-slate-500 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:border-indigo-400 hover:text-indigo-500 transition">
                                <Upload size={14}/> Choisir un fichier .json
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-600"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px]">
                                <span className="px-2 bg-slate-50 dark:bg-slate-700 text-slate-400 uppercase">Ou coller texte</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 p-2 text-[10px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-indigo-500 outline-none font-mono text-slate-800 dark:text-white"
                                placeholder="Collez le code ici..."
                                value={importData}
                                onChange={(e) => setImportData(e.target.value)}
                            />
                            <button onClick={handleImport} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition disabled:opacity-50" disabled={!importData}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ExerciseCatalog = ({ onClose, onSelect }: {onClose: () => void, onSelect: (ex: any) => void}) => {
  const [activeCategory, setActiveCategory] = useState('Jambes');
  const [searchTerm, setSearchTerm] = useState('');

  const categories: Record<string, any[]> = useMemo(() => ({
    'Jambes': [ ...STRENGTH_PROTOCOLS.hypertrophy.legs, ...STRENGTH_PROTOCOLS.force.legs, ...STRENGTH_PROTOCOLS.street_workout.legs, ...STRENGTH_PROTOCOLS.hyrox.legs_compromised, ...STRENGTH_PROTOCOLS.home_no_equipment.legs_home, ...STRENGTH_PROTOCOLS.reinforcement.stability_lower ],
    'Pecs / Poussée': [ ...STRENGTH_PROTOCOLS.hypertrophy.push, ...STRENGTH_PROTOCOLS.street_workout.push, ...STRENGTH_PROTOCOLS.hypertrophy.chest_back.filter(e => e.note && e.note.includes('Pecs')), ...STRENGTH_PROTOCOLS.force.upper.filter(e => e.name.includes('Press') || e.name.includes('Dips')), ...STRENGTH_PROTOCOLS.home_no_equipment.push_home, ...STRENGTH_PROTOCOLS.reinforcement.total_body_tone.filter(e => e.name.includes('Pompes')) ],
    'Dos / Tirage': [ ...STRENGTH_PROTOCOLS.hypertrophy.pull, ...STRENGTH_PROTOCOLS.street_workout.pull, ...STRENGTH_PROTOCOLS.hypertrophy.chest_back.filter(e => e.note && e.note.includes('Dos')), ...STRENGTH_PROTOCOLS.force.upper.filter(e => e.name.includes('Row') || e.name.includes('Pull')), ...STRENGTH_PROTOCOLS.home_no_equipment.pull_home, ...STRENGTH_PROTOCOLS.reinforcement.posture_upper ],
    'Épaules / Bras': [ ...STRENGTH_PROTOCOLS.hypertrophy.shoulders_arms ],
    'Gainage / Abdos': [ ...STRENGTH_PROTOCOLS.street_workout.skills_core, ...STRENGTH_PROTOCOLS.hypertrophy.pull.filter(e => e.name.includes('Crunch')), ...STRENGTH_PROTOCOLS.home_no_equipment.core_home, ...STRENGTH_PROTOCOLS.reinforcement.core_back ],
    'Hyrox / Cardio': [ ...STRENGTH_PROTOCOLS.hyrox.functional_endurance, ...STRENGTH_PROTOCOLS.hyrox.sleds_strength, ...STRENGTH_PROTOCOLS.hyrox.ergs_power, ...STRENGTH_PROTOCOLS.home_no_equipment.full_home ],
    'Mobilité / PPG': [ ...STRENGTH_PROTOCOLS.reinforcement.mobility_flow, ...STRENGTH_PROTOCOLS.reinforcement.posture_upper, ...STRENGTH_PROTOCOLS.reinforcement.total_body_tone ]
  }), []);

  const uniqueExercises = (exList: any[]) => {
      const seen = new Set();
      return exList.filter(ex => {
          const duplicate = seen.has(ex.name);
          seen.add(ex.name);
          return !duplicate;
      });
  };

  const currentList = uniqueExercises(categories[activeCategory] || []).filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"><X size={24}/></button>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4"><ListPlus className="text-indigo-600"/> Catalogue d'Exercices</h3>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input type="text" placeholder="Rechercher un exercice..." className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition font-bold text-slate-700 placeholder:font-normal" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
            <div className="w-1/3 bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-700 overflow-y-auto p-2 space-y-1">
                {Object.keys(categories).map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-between group ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                        {cat}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeCategory === cat ? 'bg-indigo-500 text-indigo-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>{uniqueExercises(categories[cat]).length}</span>
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 dark:bg-slate-800">
                {currentList.length > 0 ? (
                    currentList.map((ex, idx) => (
                        <div key={idx} onClick={() => onSelect(ex)} className="p-3 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:shadow-md transition cursor-pointer group flex items-start gap-3 bg-white dark:bg-slate-800">
                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-lg overflow-hidden shrink-0">
                                {ex.imageUrl ? <img src={ex.imageUrl} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-slate-400"><Dumbbell size={16}/></div>}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{ex.name}</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{ex.instructions}</p>
                            </div>
                            <button className="p-2 bg-indigo-100 text-indigo-600 rounded-lg opacity-0 group-hover:opacity-100 transition"><Plus size={16}/></button>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                        <Search size={32} className="mb-2 opacity-50"/>
                        <p className="text-xs">Aucun exercice trouvé pour "{searchTerm}" dans cette catégorie.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export const ExerciseModal = ({ exercise, exerciseId, category, onClose, onComplete, exerciseIndex, savedData }: any) => {
  const [imgError, setImgError] = useState(false);
  const [setsStatus, setSetsStatus] = useState<boolean[]>([]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeSetIndex, setActiveSetIndex] = useState<number|null>(null);
  const [weights, setWeights] = useState<string[]>([]);
  
  const isRun = category === 'run'; 
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (exercise && !isRun) {
        let setsCount = 1;
        if (typeof exercise.sets === 'number') {
            setsCount = exercise.sets;
        } else if (typeof exercise.sets === 'string') {
            const match = exercise.sets.match(/^(\d+)/);
            if (match) setsCount = parseInt(match[1]);
        }
        setSetsStatus(new Array(setsCount).fill(false));
        if (savedData && savedData.weights) {
            setWeights(savedData.weights);
        } else {
            setWeights(new Array(setsCount).fill(''));
        }
    }
  }, [exercise, isRun, savedData]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timer > 0) {
        interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);
    } else if (timer === 0 && isTimerRunning) {
        setIsTimerRunning(false);
        setActiveSetIndex(null);
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play failed", e));
        }
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const handleSkip = () => {
    setIsTimerRunning(false);
    setTimer(0);
    setActiveSetIndex(null);
  };

  const handleWeightChange = (index: number, val: string) => {
      const newWeights = [...weights];
      newWeights[index] = val;
      setWeights(newWeights);
  };

  const toggleSet = (index: number) => {
    const newStatus = [...setsStatus];
    const isChecking = !newStatus[index];
    newStatus[index] = isChecking;
    setSetsStatus(newStatus);
    if (isChecking) {
        if (index < setsStatus.length - 1) {
            const restSeconds = parseRestTime(exercise.rest);
            if (restSeconds > 0) {
                setTimer(restSeconds);
                setIsTimerRunning(true);
                setActiveSetIndex(index);
            }
        }
    } else {
        if (activeSetIndex === index) {
            setIsTimerRunning(false);
            setTimer(0);
            setActiveSetIndex(null);
        }
    }
  };

  const handleComplete = () => {
      if (isRun) {
          onComplete(exerciseId); 
      } else {
          const uniqueExerciseId = `${exerciseId}-ex-${exerciseIndex}`;
          onComplete(uniqueExerciseId, true, { weights }); 
      }
      onClose();
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!exercise) return null;

  const imageSrc = !isRun && (exercise.imageUrl && exercise.imageUrl !== "" && !imgError) 
    ? exercise.imageUrl 
    : `https://picsum.photos/seed/${encodeURIComponent(exercise.imageKeyword || 'gym')}/800/600`;
  const objectFitClass = "object-cover opacity-90";
  const allSetsDone = !isRun && setsStatus.length > 0 && setsStatus.every(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col relative">
        <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto"></audio>
        {isRun ? (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 border-b border-slate-100 dark:border-slate-700 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full transition hover:bg-slate-100 dark:hover:bg-slate-700"><X size={24}/></button>
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Footprints size={20}/></div>
                   <span className="text-xs font-bold uppercase text-indigo-500 tracking-wider">Course à Pied</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{exercise.name}</h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 font-medium"><Clock size={16}/> {exercise.sets} • {exercise.reps}</div>
            </div>
        ) : (
            <div className="h-56 bg-slate-100 relative overflow-hidden bg-white shrink-0 group">
                <img src={imageSrc} alt={exercise.name} className={`w-full h-full ${objectFitClass}`} onError={() => setImgError(true)}/>
                <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-md z-50 border border-white/20 shadow-lg"><X size={20}/></button>
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <h3 className="text-2xl font-black text-white/80 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{exercise.name}</h3>
                    <span className="text-white/60 text-xs font-bold uppercase tracking-wider mt-1 block drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {exercise.sets.toString().includes('bloc') || exercise.sets.toString().includes('temps') ? exercise.sets : `${exercise.sets} Séries`} x {exercise.reps}
                    </span>
                </div>
            </div>
        )}
        <div className="p-6 space-y-6 overflow-y-auto">
            {!isRun && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Activity size={16} className="text-indigo-500"/> Suivi de séance</h4>
                    {isTimerRunning && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                            <button onClick={() => setTimer(t => Math.max(0, t - 5))} className="bg-indigo-100 text-indigo-700 p-1 rounded-full hover:bg-indigo-200 transition"><Minus size={14}/></button>
                            <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-200"><Timer size={14}/> {formatTime(timer)}</div>
                            <button onClick={() => setTimer(t => t + 5)} className="bg-indigo-100 text-indigo-700 p-1 rounded-full hover:bg-indigo-200 transition"><Plus size={14}/></button>
                            <button onClick={handleSkip} className="bg-rose-100 text-rose-700 p-1 rounded-full hover:bg-rose-200 transition ml-1" title="Passer le repos"><SkipForward size={14}/></button>
                        </div>
                    )}
                </div>
                <div className="space-y-3">
                    {setsStatus.map((isDone, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isDone ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'}`}>
                            <div className="flex items-center gap-3"><span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isDone ? 'bg-green-200 text-green-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>{idx + 1}</span><span className={`text-sm font-medium ${isDone ? 'text-green-800 dark:text-green-400' : 'text-slate-600 dark:text-slate-300'}`}>{exercise.reps} reps</span></div>
                            <div className="flex items-center gap-2 mr-auto ml-4">
                                <input type="number" placeholder="kg" className="w-16 py-1 px-2 text-center bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-700 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" value={weights[idx] || ''} onChange={(e) => handleWeightChange(idx, e.target.value)} onClick={(e) => e.stopPropagation()} />
                                <span className="text-[10px] text-slate-400 font-bold">KG</span>
                            </div>
                            <button onClick={() => toggleSet(idx)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDone ? 'bg-green-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>{isDone ? <Check size={18}/> : <Square size={18} className="fill-white dark:fill-slate-800"/>}</button>
                        </div>
                    ))}
                </div>
            </div>
            )}
            <div className="flex gap-4">
                <div className="flex-1 bg-white dark:bg-slate-700 p-3 rounded-2xl border border-slate-100 dark:border-slate-600 text-center shadow-sm"><div className="text-xs text-slate-400 font-bold uppercase">Repos</div><div className="text-lg font-black text-slate-700 dark:text-white">{exercise.rest}</div></div>
                <div className="flex-1 bg-rose-50 dark:bg-rose-900/30 p-3 rounded-2xl border border-rose-100 dark:border-rose-800 text-center shadow-sm"><div className="text-xs text-rose-400 font-bold uppercase">Intensité</div><div className="text-lg font-black text-rose-600 dark:text-rose-400">RPE {exercise.rpe}</div></div>
            </div>
            <div>
                <div className="flex items-center gap-2 mb-2"><div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><Brain size={18}/></div><h4 className="font-bold text-slate-800 dark:text-white">Consigne Technique</h4></div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-100 dark:border-slate-600">{exercise.instructions}</p>
            </div>
            <div>
                 <div className="flex items-center gap-2 mb-2"><div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><Target size={18}/></div><h4 className="font-bold text-slate-800 dark:text-white">Objectif Physiologique</h4></div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{exercise.note}</p>
            </div>
            {(isRun || allSetsDone) && (
                <button onClick={handleComplete} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200 mt-2 animate-in slide-in-from-bottom-2 fade-in">{isRun ? "Terminer la séance" : "Valider l'exercice"}</button>
            )}
        </div>
      </div>
    </div>
  );
};

export const SessionHistoryDetail = ({ session, exercisesLog, onClose }: any) => {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Détails Séance</div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">{session.type}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition"><X size={20} className="dark:text-white"/></button>
                </div>
                
                <div className="overflow-y-auto p-4 space-y-6">
                    <div className="bg-slate-900 rounded-2xl p-4 relative overflow-hidden shadow-inner">
                        <div className="absolute top-3 left-4 text-white/50 text-xs font-bold uppercase">Impact Musculaire</div>
                        <MuscleHeatmap type={session.type} />
                        <div className="flex justify-center gap-4 text-[10px] text-white/70 font-bold uppercase mt-2">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Principal</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Secondaire</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2"><Dumbbell size={16}/> Performance</h4>
                        {session.exercises && session.exercises.map((ex: any, idx: number) => {
                            const log = exercisesLog[`${session.id}-ex-${idx}`];
                            const weights = log?.weights?.filter((w: any) => w) || [];
                            
                            return (
                                <div key={idx} className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-sm text-slate-800 dark:text-white">{ex.name}</span>
                                        <span className="text-[10px] bg-white dark:bg-slate-600 px-2 py-1 rounded border border-slate-200 dark:border-slate-500 text-slate-500 dark:text-slate-300">{ex.sets} x {ex.reps}</span>
                                    </div>
                                    {weights.length > 0 ? (
                                        <div className="flex gap-2 flex-wrap">
                                            {weights.map((w: string, i: number) => (
                                                <span key={i} className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded shadow-sm">{w}kg</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-400 italic">Poids non enregistrés</span>
                                    )}
                                </div>
                            );

                        })}
                        {(!session.exercises || session.exercises.length === 0) && (
                            <div className="text-center text-xs text-slate-400 italic py-4">Détails des exercices non disponibles pour ce type de séance.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
