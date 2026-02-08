import React, { useState, useEffect } from 'react';
import { Zap, Dumbbell, Activity, Flame, Clock, X, Smartphone, Share, Pause, Play, StopCircle, User, Settings, Scale, Ruler, Calendar as CalIcon, TrendingUp, TrendingDown, Utensils } from 'lucide-react';
import { formatStopwatch, getMuscleActivation, BODY_PATHS } from '../utils/helpers';

export const RpeBadge = ({ level }: { level: number }) => {
    let color = "bg-emerald-100 text-emerald-700";
    if(level >= 5) color = "bg-amber-100 text-amber-700";
    if(level >= 8) color = "bg-rose-100 text-rose-700";
    return <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${color} border border-white/20`}>RPE {level}/10</div>;
};

export const WorkoutViz = ({ structure, intensity }: { structure: string; intensity: string }) => {
  let bars: number[] = [];
  const color = intensity === 'high' ? 'bg-rose-500' : intensity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
  if (structure === 'interval') bars = [20, 20, 20, 80, 20, 80, 20, 80, 20, 80, 20, 20, 20];
  else if (structure === 'threshold') bars = [20, 20, 30, 60, 60, 60, 60, 60, 30, 20, 20];
  else if (structure === 'steady') bars = [30, 30, 30, 30, 30, 30, 30, 30, 30, 30];
  else bars = [20, 40, 60, 80, 100, 80, 60, 40, 20];
  return (
    <div className="flex items-end gap-[2px] h-6 w-16 md:w-20 opacity-80">
      {bars.map((height, i) => (
        <div key={i} className={`flex-1 rounded-t-[1px] ${height > 40 ? color : 'bg-slate-200'}`} style={{ height: `${height}%` }}></div>
      ))}
    </div>
  );
};

export const MuscleHeatmap = ({ type, exercises }: { type: string, exercises?: any[] }) => {
    const active = getMuscleActivation(type);
    const primaryColor = "#f43f5e"; // Rose vif
    const secondaryColor = "#fb923c"; // Orange
    const inactiveColor = "#334155"; // Slate foncé (plus discret sur fond sombre)
    const strokeColor = "rgba(255,255,255,0.1)";

    return (
        <div className="flex justify-center p-4">
            <svg width="120" height="220" viewBox="0 0 82 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'}}>
                <path d={BODY_PATHS.head} fill={inactiveColor} stroke={strokeColor} strokeWidth="0.5"/>
                <path d={BODY_PATHS.neck} fill={inactiveColor} stroke={strokeColor} strokeWidth="0.5"/>
                <path d={BODY_PATHS.traps} fill={active.shoulders || active.back ? secondaryColor : inactiveColor} stroke={strokeColor} strokeWidth="0.5"/>
                <path d={BODY_PATHS.shoulders} fill={active.shoulders ? primaryColor : inactiveColor} stroke={strokeColor} strokeWidth="0.5"/>
                <path d={BODY_PATHS.chest} fill={active.chest ? primaryColor : inactiveColor} stroke={strokeColor} strokeWidth="0.5"/>
                <path d={BODY_PATHS.abs} fill={active.abs || active.cardio ? secondaryColor : inactiveColor} stroke={strokeColor} strokeWidth="0.5"/>
                <path d={BODY_PATHS.arms} fill={active.arms ? primaryColor : inactiveColor} stroke={strokeColor} strokeWidth="0.5"/>
                <path d={BODY_PATHS.forearms} fill={active.arms ? secondaryColor : inactiveColor} stroke={strokeColor} strokeWidth="0.5"/>
                <path d={BODY_PATHS.legs} fill={active.legs ? primaryColor : inactiveColor} stroke={strokeColor} strokeWidth="0.5"/>
                {active.cardio && (
                    <circle cx="41" cy="40" r="2" fill="#fbbf24" className="animate-ping" style={{opacity: 0.8}}/>
                )}
            </svg>
        </div>
    );
};

export const LiveSessionTimer = ({ onFinish, timerRef }: { onFinish: (s: number) => void, timerRef?: React.MutableRefObject<number> }) => {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        let interval: any = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds(s => {
                    const newValue = s + 1;
                    if(timerRef) timerRef.current = newValue;
                    return newValue;
                });
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, seconds, timerRef]);

    const handleStop = () => {
        setIsActive(false);
        onFinish(seconds); 
    };

    return (
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-inner mb-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
                    <div className="text-4xl font-black font-mono tracking-widest">{formatStopwatch(seconds)}</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsActive(!isActive)} className={`p-3 rounded-full transition ${isActive ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                        {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                    </button>
                    <button onClick={handleStop} className="p-3 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition">
                        <StopCircle size={20} />
                    </button>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase text-center">Enregistrement en cours...</p>
        </div>
    );
};

export const ProfileView = ({ userData, setUserData, stats }: any) => {
    const bmi = userData.weight && userData.height ? (userData.weight / ((userData.height / 100) ** 2)).toFixed(1) : null;
    let bmiLabel = "";
    let bmiColor = "";
    if (bmi) {
        const b = parseFloat(bmi);
        if (b < 18.5) { bmiLabel = "Maigreur"; bmiColor = "text-blue-500"; }
        else if (b < 25) { bmiLabel = "Normal"; bmiColor = "text-green-500"; }
        else if (b < 30) { bmiLabel = "Surpoids"; bmiColor = "text-orange-500"; }
        else { bmiLabel = "Obésité"; bmiColor = "text-red-500"; }
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-left-4">
            {/* Header / Identity */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shadow-inner shrink-0">
                    <User size={40} />
                </div>
                <div className="flex-1 z-10">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">PROFIL ATHLÈTE</div>
                    <input 
                        type="text" 
                        value={userData.name || "Athlète"} 
                        onChange={(e) => setUserData({...userData, name: e.target.value})}
                        className="text-2xl font-black text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none transition w-full"
                    />
                    <div className="flex gap-4 mt-2 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1"><Activity size={14} className="text-indigo-500"/> {stats?.sessionsDone || 0} Séances</span>
                        <span className="flex items-center gap-1"><Ruler size={14} className="text-rose-500"/> {stats?.totalKm || 0} km</span>
                    </div>
                </div>
            </div>

            {/* Biometrics Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Settings size={18} className="text-indigo-600"/> Biométrie</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Poids (kg)</label>
                        <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 focus-within:border-indigo-500 transition">
                            <Scale size={16} className="text-slate-400 mr-2"/>
                            <input type="number" value={userData.weight} onChange={(e) => setUserData({...userData, weight: parseFloat(e.target.value)})} className="w-full bg-transparent font-bold text-slate-700 outline-none"/>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Taille (cm)</label>
                        <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 focus-within:border-indigo-500 transition">
                            <Ruler size={16} className="text-slate-400 mr-2"/>
                            <input type="number" value={userData.height} onChange={(e) => setUserData({...userData, height: parseFloat(e.target.value)})} className="w-full bg-transparent font-bold text-slate-700 outline-none"/>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Âge</label>
                        <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 focus-within:border-indigo-500 transition">
                            <CalIcon size={16} className="text-slate-400 mr-2"/>
                            <input type="number" value={userData.age} onChange={(e) => setUserData({...userData, age: parseFloat(e.target.value)})} className="w-full bg-transparent font-bold text-slate-700 outline-none"/>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Genre</label>
                        <select value={userData.gender} onChange={(e) => setUserData({...userData, gender: e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 font-bold text-slate-700 outline-none text-sm appearance-none focus:border-indigo-500 transition">
                            <option value="male">Homme</option>
                            <option value="female">Femme</option>
                        </select>
                    </div>
                </div>
                {bmi && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100">
                        <span className="text-xs font-bold text-slate-500">IMC (Indice Masse Corporelle)</span>
                        <div className="text-right">
                            <span className="block font-black text-lg text-slate-800">{bmi}</span>
                            <span className={`text-[10px] font-bold uppercase ${bmiColor}`}>{bmiLabel}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Progression & Charts */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><TrendingUp size={18} className="text-indigo-600"/> Évolution</h3>
                
                <div className="flex items-center justify-center mb-8">
                     <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                            <circle 
                                cx="50" cy="50" r="45" fill="none" stroke="#4f46e5" strokeWidth="8" 
                                strokeDasharray="283" 
                                strokeDashoffset={283 - ((stats?.progress || 0) / 100 * 283)} 
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-slate-800">{stats?.progress || 0}%</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Plan</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Volume Hebdomadaire</h4>
                    <WeeklyVolumeChart plannedData={stats?.weeklyVolume || []} realizedData={stats?.realizedWeeklyVolume || []} />
                </div>
            </div>

            {/* Nutrition Goal Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Utensils size={18} className="text-indigo-600"/> Objectif Nutrition</h3>
                <div className="flex gap-2">
                    {[
                        {id: 'cut', label: 'Sèche', icon: TrendingDown, color: 'text-amber-500'},
                        {id: 'maintain', label: 'Maintien', icon: Activity, color: 'text-indigo-500'},
                        {id: 'bulk', label: 'Masse', icon: TrendingUp, color: 'text-rose-500'}
                    ].map(g => (
                        <button 
                            key={g.id}
                            onClick={() => setUserData({...userData, nutritionGoal: g.id})}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-2 transition border-2 ${userData.nutritionGoal === g.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                        >
                            <g.icon size={20} className={userData.nutritionGoal === g.id ? g.color : 'text-slate-300'}/>
                            {g.label}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-slate-400 mt-3 text-center leading-relaxed">
                    {userData.nutritionGoal === 'cut' ? "Déficit calorique léger (-400kcal) pour perdre du gras en maintenant le muscle." : 
                     userData.nutritionGoal === 'bulk' ? "Surplus calorique (+300kcal) pour maximiser la prise de muscle." : 
                     "Apport équilibré pour la performance et la stabilité du poids."}
                </p>
            </div>
        </div>
    );
};

export const InteractiveInterference = () => { const [scenario, setScenario] = useState('far'); return ( <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4"> <div className="flex gap-2 p-1 bg-slate-100 rounded-lg"> <button onClick={() => setScenario('close')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${scenario === 'close' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Séances Rapprochées (&lt;6h)</button> <button onClick={() => setScenario('far')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${scenario === 'far' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Séances Espacées (&gt;24h)</button> </div> <div className="relative h-48 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center p-4"> <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div> <div className="relative z-10 w-full flex justify-between items-center"> <div className={`flex flex-col items-center transition-all duration-700 ${scenario === 'close' ? 'translate-x-8 scale-110' : 'translate-x-0'}`}> <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/50 mb-2 animate-pulse"><Zap size={20} /></div> <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Cardio (AMPk)</div> {scenario === 'far' && <div className="text-[9px] text-green-400 mt-1 animate-in fade-in slide-in-from-bottom-2">Active ✅</div>} </div> {scenario === 'close' && (<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-in zoom-in duration-300"><div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/50"><X size={24} className="text-white"/></div><div className="bg-rose-600 text-white text-[9px] font-bold px-2 py-1 rounded mt-2">INTERFÉRENCE</div></div>)} <div className={`flex flex-col items-center transition-all duration-700 ${scenario === 'close' ? '-translate-x-8 scale-90 opacity-50' : 'translate-x-0'}`}> <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/50 mb-2 animate-pulse"><Dumbbell size={20} /></div> <div className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Muscle (mTOR)</div> {scenario === 'far' && <div className="text-[9px] text-green-400 mt-1 animate-in fade-in slide-in-from-bottom-2">Active ✅</div>} </div> </div> </div> <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{scenario === 'close' ? "⚠️ Le signal 'Cardio' bloque la construction musculaire. Vos gains en force sont compromis." : "✅ Les deux signaux ont le temps de s'exprimer. Vous progressez en endurance ET en muscle."}</p> </div> ); };
export const StatCard = ({ label, value, unit, icon: Icon, color }: any) => ( <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"> <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p><div className="text-2xl font-black text-slate-800 flex items-baseline gap-1">{value} <span className="text-xs font-medium text-slate-400">{unit}</span></div></div> <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}><Icon size={20} /></div> </div> );
export const PolarizationChart = ({ low, high }: {low: number, high: number}) => { const total = low + high || 1; const lowPercent = Math.round((low / total) * 100); const highPercent = Math.round((high / total) * 100); return ( <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"> <div className="flex justify-between items-end mb-4"><h4 className="font-bold text-slate-700 flex items-center gap-2"><Activity size={18} className="text-indigo-500"/> Polarisation (Prévisionnelle)</h4><span className="text-xs font-medium text-slate-400">Cible: 80/20</span></div> <div className="flex h-6 w-full rounded-full overflow-hidden bg-slate-100 relative"> <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 relative group" style={{ width: `${lowPercent}%` }}><span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">Endurance</span></div> <div className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-1000 relative group" style={{ width: `${highPercent}%` }}><span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">Intensité</span></div> <div className="absolute top-0 bottom-0 w-0.5 bg-white z-10" style={{left: '80%'}}></div> <div className="absolute -bottom-1 left-[80%] -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-slate-800"></div> </div> <div className="flex justify-between mt-2 text-xs font-bold"><div className="text-emerald-600">{lowPercent}% <span className="text-[10px] font-normal text-slate-400">Volume</span></div><div className="text-rose-600">{highPercent}% <span className="text-[10px] font-normal text-slate-400">Intensité</span></div></div> </div> ); };
export const WeeklyVolumeChart = ({ plannedData, realizedData }: {plannedData: number[], realizedData: number[]}) => { const [selectedWeek, setSelectedWeek] = useState<number | null>(null); if (!plannedData || plannedData.length === 0) return <div className="text-xs text-slate-400 italic text-center p-4">Générez votre plan pour voir les données.</div>; const max = Math.max(...plannedData, 1); return ( <div className="space-y-4"> <div className="flex justify-end gap-3 text-[10px] font-bold uppercase text-slate-400 mb-2"><div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-200 border border-slate-300 rounded-sm"></div> Prévu</div><div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-500 rounded-sm"></div> Réalisé</div></div> <div className="flex items-end justify-between h-32 gap-1 mt-2 px-2 relative"> <div className="absolute inset-0 flex flex-col justify-between px-2 pointer-events-none opacity-20 z-0"><div className="w-full h-px bg-slate-400 border-dashed border-t"></div><div className="w-full h-px bg-slate-400 border-dashed border-t"></div><div className="w-full h-px bg-slate-400 border-dashed border-t"></div></div> {plannedData.map((val, i) => { const planVal = val || 0; const realVal = realizedData[i] || 0; return ( <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer relative h-full justify-end z-10" onClick={() => setSelectedWeek(i === selectedWeek ? null : i)}> <div className="w-full relative flex items-end justify-center h-full rounded-t-sm"> <div className={`w-full absolute bottom-0 border-2 border-dashed border-slate-300 bg-slate-50 transition-all duration-500 rounded-t-sm z-0 ${planVal === 0 ? 'h-1' : ''}`} style={{ height: `${planVal > 0 ? (planVal / max) * 100 : 1}%` }}></div> <div className={`w-full absolute bottom-0 transition-all duration-700 rounded-t-sm z-10 ${selectedWeek === i ? 'bg-indigo-600' : 'bg-indigo-400 hover:bg-indigo-50'}`} style={{ height: `${planVal > 0 ? (realVal / max) * 100 : 0}%` }}></div> </div> <span className={`text-[9px] font-bold z-20 ${selectedWeek === i ? 'text-indigo-600 scale-125' : 'text-slate-400'}`}>S{i + 1}</span> </div> )})} </div> {selectedWeek !== null && ( <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-800 animate-in slide-in-from-top-2 shadow-sm"> <div className="flex justify-between items-center mb-1"><span className="font-bold flex items-center gap-1"><Clock size={12}/> Semaine {selectedWeek + 1}</span><span className="bg-white px-2 py-0.5 rounded shadow-sm text-[10px] font-black border border-indigo-100">{realizedData[selectedWeek] || 0} / {plannedData[selectedWeek] || 0} min</span></div> <div className="text-slate-600 italic">{(realizedData[selectedWeek] || 0) >= (plannedData[selectedWeek] || 1) ? "🎉 Objectif de volume atteint ! Bravo." : "L'objectif est la barre grise. Continuez vos efforts !"}</div> </div> )} </div> ); };
export const BanisterChart = ({ duration }: {duration: number}) => { if (!duration) return <div className="text-xs text-slate-400 italic text-center p-4">En attente de données...</div>; const weeks = Array.from({length: duration + 2}, (_, i) => i); const data = weeks.map(w => { const ramp = w / duration; const fitness = 20 + (ramp * 60); const fatigue = w >= duration ? 15 : 10 + (ramp * 70) + (Math.sin(w)*10); const form = fitness - fatigue + 30; return { w, fitness, fatigue, form }; }); return ( <div className="w-full h-48 flex items-end gap-1 mt-6 relative bg-white/50 rounded-xl p-2 border border-slate-100 overflow-hidden"> <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-10 pointer-events-none"><div className="w-full h-px bg-slate-900"></div><div className="w-full h-px bg-slate-900"></div><div className="w-full h-px bg-slate-900"></div></div> {data.map((d, i) => ( <div key={i} className="flex-1 flex flex-col justify-end h-full relative group"> <div className="w-2 h-2 bg-green-500 rounded-full absolute left-1/2 -translate-x-1/2 transition-all duration-500 z-20 shadow-sm shadow-green-200" style={{ bottom: `${Math.min(d.form, 95)}%` }}></div> <div className="w-1 bg-indigo-400/40 absolute left-1/2 -translate-x-1/2 bottom-0 rounded-t-full" style={{ height: `${Math.min(d.fitness, 95)}%` }}></div> <div className="w-1 bg-rose-400/40 absolute left-1/2 -translate-x-1/2 bottom-0 -translate-x-[2px] rounded-t-full" style={{ height: `${Math.min(d.fatigue, 95)}%` }}></div> </div> ))} <div className="absolute top-2 left-2 flex flex-wrap gap-3 text-[9px] font-bold bg-white/80 p-1 rounded backdrop-blur-sm z-30 border border-slate-100 shadow-sm"> <span className="text-green-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Forme</span> <span className="text-indigo-400 flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-indigo-300"></div> Fitness</span> <span className="text-rose-400 flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-rose-300"></div> Fatigue</span> </div> </div> ); };
export const TrimpChart = ({ plannedData, realizedData }: {plannedData: number[], realizedData: number[]}) => { const [selectedPoint, setSelectedPoint] = useState<number | null>(null); if (!plannedData || plannedData.length === 0) return <div className="text-xs text-slate-400 italic text-center p-4">En attente de données...</div>; const trimpData = plannedData.map((val, i) => { const intensityFactor = (i % 4 === 0) ? 0.7 : (i % 4 === 1) ? 0.9 : 0.8; return Math.round(val * intensityFactor); }); const realizedTrimpData = realizedData.map((val, i) => { const intensityFactor = (i % 4 === 0) ? 0.7 : (i % 4 === 1) ? 0.9 : 0.8; return Math.round(val * intensityFactor); }); const maxTrimp = Math.max(...trimpData, 1); return ( <div className="space-y-4"> <div className="flex justify-end gap-3 text-[10px] font-bold uppercase text-slate-400 mb-2"><div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-200 border border-slate-300 rounded-sm"></div> Cible</div><div className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded-sm"></div> Fait</div></div> <div className="flex items-end justify-between h-32 gap-1 mt-4 px-2 relative"> <div className="absolute inset-0 flex flex-col justify-between px-2 pointer-events-none opacity-10"><div className="w-full h-px bg-purple-900 border-dashed border-t"></div><div className="w-full h-px bg-purple-900 border-dashed border-t"></div><div className="w-full h-px bg-purple-900 border-dashed border-t"></div></div> {trimpData.map((trimp, i) => { const realizedTrimp = realizedTrimpData[i] || 0; return ( <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer relative h-full justify-end z-10" onClick={() => setSelectedPoint(i === selectedPoint ? null : i)}> <div className="w-full relative flex items-end justify-center h-full rounded-t-sm"> <div className="w-full absolute bottom-0 bg-slate-100 border-2 border-dashed border-slate-300 opacity-60 rounded-t-sm z-0" style={{ height: `${(trimp / maxTrimp) * 80 + 10}%` }}></div> <div className={`w-full absolute bottom-0 transition-all duration-1000 z-10 rounded-t-sm ${selectedPoint === i ? 'bg-purple-600' : 'bg-gradient-to-t from-purple-300 to-purple-500'}`} style={{ height: `${(realizedTrimp / maxTrimp) * 80 + 10}%` }}></div> </div> <span className={`text-[9px] font-mono z-20 ${selectedPoint === i ? 'text-purple-600 font-bold scale-125' : 'text-slate-400'}`}>S{i + 1}</span> </div> )})} </div> {selectedPoint !== null && ( <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-purple-800 animate-in slide-in-from-top-2 flex items-start gap-2 shadow-sm"> <Flame size={16} className="shrink-0 mt-0.5 text-purple-600"/> <div> <span className="font-bold block mb-1">Charge Semaine {selectedPoint + 1}</span> <div className="flex gap-4 mb-1 text-[10px]"><span className="text-slate-500">Prévu: {trimpData[selectedPoint]}</span><span className="font-black bg-white px-1.5 py-0.5 rounded border border-purple-100">Fait: {realizedTrimpData[selectedPoint] || 0}</span></div> <div className="text-slate-600 italic">{realizedTrimpData[selectedPoint] > trimpData[selectedPoint] ? "Attention, charge plus élevée que prévu." : "Charge maîtrisée."}</div> </div> </div> )} </div> ); };
export const InstallGuide = ({ onClose }: {onClose: () => void}) => ( <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300"> <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden text-center p-8 relative animate-in zoom-in-95 duration-300"> <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"><X size={24}/></button> <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600"><Smartphone size={32} /></div> <h3 className="text-2xl font-black text-slate-800 mb-2">Installer l'App 📱</h3> <p className="text-sm text-slate-500 mb-6 leading-relaxed">Pour une meilleure expérience, ajoutez C-Lab Performance à votre écran d'accueil. C'est gratuit et sans téléchargement !</p> <div className="space-y-4 text-left bg-slate-50 p-4 rounded-xl border border-slate-100"> <div className="flex items-center gap-3"><span className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white rounded-full text-xs font-bold">1</span><span className="text-sm text-slate-700">Appuyez sur le bouton <strong>Partager</strong> <Share size={14} className="inline ml-1"/> dans Safari.</span></div> <div className="flex items-center gap-3"><span className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white rounded-full text-xs font-bold">2</span><span className="text-sm text-slate-700">Faites défiler vers le bas.</span></div> <div className="flex items-center gap-3"><span className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white rounded-full text-xs font-bold">3</span><span className="text-sm text-slate-700">Sélectionnez <strong>"Sur l'écran d'accueil"</strong>.</span></div> </div> <button onClick={onClose} className="mt-6 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">C'est compris !</button> </div> </div> );