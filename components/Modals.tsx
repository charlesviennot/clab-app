import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, ListPlus, Search, Dumbbell, Plus, Clock, Footprints, 
  Minus, SkipForward, Check, Square, Activity, Timer, 
  Brain, Target, CheckCircle, Download, Camera
} from 'lucide-react';
import { STRENGTH_PROTOCOLS, RUN_PROTOCOLS } from '../data/protocols';
import { parseRestTime, getMuscleActivation, formatStopwatch } from '../utils/helpers';
import { MuscleHeatmap } from './Visuals';
import { downloadShareImage, downloadTCX } from '../utils/logic';

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
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 bg-slate-50 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition"><X size={24}/></button>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><ListPlus className="text-indigo-600"/> Catalogue d'Exercices</h3>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input type="text" placeholder="Rechercher un exercice..." className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition font-bold text-slate-700 placeholder:font-normal" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
            <div className="w-1/3 bg-slate-50 border-r border-slate-100 overflow-y-auto p-2 space-y-1">
                {Object.keys(categories).map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-between group ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-white hover:text-indigo-600'}`}>
                        {cat}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeCategory === cat ? 'bg-indigo-500 text-indigo-100' : 'bg-slate-200 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>{uniqueExercises(categories[cat]).length}</span>
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {currentList.length > 0 ? (
                    currentList.map((ex, idx) => (
                        <div key={idx} onClick={() => onSelect(ex)} className="p-3 border border-slate-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition cursor-pointer group flex items-start gap-3">
                            <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                                {ex.imageUrl ? <img src={ex.imageUrl} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-slate-400"><Dumbbell size={16}/></div>}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">{ex.name}</h4>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{ex.instructions}</p>
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
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col relative">
        <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto"></audio>
        {isRun ? (
            <div className="bg-slate-50 p-6 border-b border-slate-100 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full transition hover:bg-slate-100"><X size={24}/></button>
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Footprints size={20}/></div>
                   <span className="text-xs font-bold uppercase text-indigo-500 tracking-wider">Course à Pied</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 leading-tight">{exercise.name}</h3>
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
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Activity size={16} className="text-indigo-500"/> Suivi de séance</h4>
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
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isDone ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center gap-3"><span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isDone ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</span><span className={`text-sm font-medium ${isDone ? 'text-green-800' : 'text-slate-600'}`}>{exercise.reps} reps</span></div>
                            <div className="flex items-center gap-2 mr-auto ml-4">
                                <input type="number" placeholder="kg" className="w-16 py-1 px-2 text-center bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" value={weights[idx] || ''} onChange={(e) => handleWeightChange(idx, e.target.value)} onClick={(e) => e.stopPropagation()} />
                                <span className="text-[10px] text-slate-400 font-bold">KG</span>
                            </div>
                            <button onClick={() => toggleSet(idx)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDone ? 'bg-green-500 text-white shadow-sm' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}>{isDone ? <Check size={18}/> : <Square size={18} className="fill-white"/>}</button>
                        </div>
                    ))}
                </div>
            </div>
            )}
            <div className="flex gap-4">
                <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm"><div className="text-xs text-slate-400 font-bold uppercase">Repos</div><div className="text-lg font-black text-slate-700">{exercise.rest}</div></div>
                <div className="flex-1 bg-rose-50 p-3 rounded-2xl border border-rose-100 text-center shadow-sm"><div className="text-xs text-rose-400 font-bold uppercase">Intensité</div><div className="text-lg font-black text-rose-600">RPE {exercise.rpe}</div></div>
            </div>
            <div>
                <div className="flex items-center gap-2 mb-2"><div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><Brain size={18}/></div><h4 className="font-bold text-slate-800">Consigne Technique</h4></div>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{exercise.instructions}</p>
            </div>
            <div>
                 <div className="flex items-center gap-2 mb-2"><div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><Target size={18}/></div><h4 className="font-bold text-slate-800">Objectif Physiologique</h4></div>
                <p className="text-xs font-medium text-slate-500">{exercise.note}</p>
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
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Détails Séance</div>
                        <h3 className="text-xl font-black text-slate-800">{session.type}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300 transition"><X size={20}/></button>
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
                        <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2"><Dumbbell size={16}/> Performance</h4>
                        {session.exercises && session.exercises.map((ex: any, idx: number) => {
                            const log = exercisesLog[`${session.id}-ex-${idx}`];
                            const weights = log?.weights?.filter((w: any) => w) || [];
                            
                            return (
                                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-sm text-slate-800">{ex.name}</span>
                                        <span className="text-[10px] bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">{ex.sets} x {ex.reps}</span>
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