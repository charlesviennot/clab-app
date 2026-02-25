
import React, { useState, useEffect, useRef } from 'react';
import { Zap, Dumbbell, Activity, Flame, Clock, X, Smartphone, Share, Pause, Play, StopCircle, Navigation, MapPin, Ruler, Save, Download, Upload, Copy, Check, Briefcase, Armchair, Hammer, Trash2, FileJson, TrendingDown, TrendingUp, Volume2, VolumeX, Calculator, Disc, Calendar, ArrowRight, Sun, Moon, Coffee, CheckCircle, Trophy, HeartPulse, Cloud, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react';
import { formatStopwatch, getMuscleActivation, calculateHaversineDistance, calculateDailyCalories, playBeep, getXpLevel, getRandomMotivation, vibrate } from '../utils/helpers';
import { DataManagementModal, OneRMModal, PlateCalculatorModal, HeartRateModal } from './Modals';

export const RpeBadge = ({ level }: { level: number }) => {
    let color = "bg-emerald-100 text-emerald-700";
    if(level >= 5) color = "bg-amber-100 text-amber-700";
    if(level >= 8) color = "bg-rose-100 text-rose-700";
    return <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${color} border border-white/20`}>RPE {level}/10</div>;
};

export const DailyBriefing = ({ plan, completedSessions }: any) => {
    const [todayDate, setTodayDate] = useState(new Date());
    const [weather, setWeather] = useState<any>(null);
    const [loadingWeather, setLoadingWeather] = useState(true);

    useEffect(() => {
        // Update date to handle midnight switch if app stays open
        const timer = setInterval(() => setTodayDate(new Date()), 60000);
        
        // Weather Fetching
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                    const data = await response.json();
                    if (data.current_weather) {
                        setWeather(data.current_weather);
                    }
                } catch (e) {
                    console.error("Weather fetch failed", e);
                } finally {
                    setLoadingWeather(false);
                }
            }, () => setLoadingWeather(false));
        } else {
            setLoadingWeather(false);
        }

        return () => clearInterval(timer);
    }, []);

    const getWeatherIcon = (code: number) => {
        if (code === 0) return { icon: <Sun size={14} className="text-yellow-400"/>, text: "Ensoleillé" };
        if (code >= 1 && code <= 3) return { icon: <Cloud size={14} className="text-slate-200"/>, text: "Nuageux" };
        if (code >= 45 && code <= 48) return { icon: <Wind size={14} className="text-slate-300"/>, text: "Brume" };
        if (code >= 51 && code <= 67) return { icon: <CloudRain size={14} className="text-blue-300"/>, text: "Pluvieux" };
        if (code >= 71 && code <= 77) return { icon: <CloudSnow size={14} className="text-white"/>, text: "Neige" };
        if (code >= 80 && code <= 82) return { icon: <CloudRain size={14} className="text-blue-400"/>, text: "Averses" };
        if (code >= 95) return { icon: <CloudLightning size={14} className="text-yellow-300"/>, text: "Orage" };
        return { icon: <Sun size={14} className="text-yellow-400"/>, text: "Beau" };
    };

    // 1. Detect Day
    const jsDay = todayDate.getDay(); // 0=Sun, 1=Mon...
    const appDayIndex = (jsDay + 6) % 7; // 0=Mon, ... 6=Sun
    const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const todayName = dayNames[appDayIndex];

    // 2. Detect Active Week
    let activeWeek = plan.find((w: any) => !w.sessions.every((s: any) => completedSessions.has(s.id)));
    
    // Case: All weeks done
    if (!activeWeek && plan.length > 0) {
        return (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white mb-6 shadow-lg relative overflow-hidden animate-in slide-in-from-top-4">
                <div className="relative z-10 text-center">
                    <h3 className="text-2xl font-black mb-1">Programme Terminé ! 🎉</h3>
                    <p className="text-sm opacity-90">Vous êtes une machine. Reposez-vous.</p>
                </div>
            </div>
        );
    }
    
    if (!activeWeek) return null;

    const weekNumber = activeWeek.weekNumber;

    // 3. Find Today's Session in Active Week
    const todaySchedule = activeWeek.schedule[appDayIndex];
    const todaySessionIds = todaySchedule ? todaySchedule.sessionIds : [];
    const todaySessions = activeWeek.sessions.filter((s: any) => todaySessionIds.includes(s.id));
    
    const mainSession = todaySessions.length > 0 ? todaySessions[0] : null;
    const isRest = !mainSession;
    const isDone = mainSession && completedSessions.has(mainSession.id);

    // 4. Render
    if (isRest) {
        return (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden animate-in slide-in-from-top-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
                            <Calendar size={12}/> {todayName} • Semaine {weekNumber}
                        </div>
                        <h2 className="text-2xl font-black">Repos & Récupération</h2>
                        <p className="text-sm opacity-90 mt-1">Profitez-en pour bien manger et dormir.</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner border border-white/10">
                        <Coffee size={24} className="text-white"/>
                    </div>
                </div>
            </div>
        );
    }

    const isCardio = mainSession.category === 'run' || mainSession.category === 'hyrox';
    // Dynamic Gradient based on status and type
    const bgClass = isDone 
        ? "bg-gradient-to-r from-green-600 to-emerald-600" 
        : isCardio 
            ? "bg-gradient-to-br from-indigo-600 to-blue-500" 
            : "bg-gradient-to-br from-rose-600 to-orange-500";
            
    const icon = isDone 
        ? <CheckCircle size={24} className="text-white"/> 
        : isCardio 
            ? <Zap size={24} className="text-yellow-300"/> 
            : <Dumbbell size={24} className="text-white"/>;

    const weatherInfo = weather ? getWeatherIcon(weather.weathercode) : null;

    return (
        <div className={`${bgClass} rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden animate-in slide-in-from-top-4 transition-all duration-500`}>
            {/* Decorations */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
                            <Calendar size={12}/> {todayName} • Semaine {weekNumber}
                        </div>
                        <h2 className="text-2xl font-black leading-tight flex items-center gap-2">
                            {isDone ? "Séance Validée !" : mainSession.type}
                        </h2>
                        {!isDone && (
                            <p className="text-sm opacity-90 mt-1 flex items-center gap-1 font-medium">
                                <Clock size={12}/> {mainSession.duration} {mainSession.distance && `• ${mainSession.distance}`}
                            </p>
                        )}
                    </div>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner border border-white/10 shrink-0">
                        {icon}
                    </div>
                </div>

                {!isDone && (
                    <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/5 mb-4">
                        <p className="text-xs italic leading-relaxed text-white/90">"{getRandomMotivation()}"</p>
                    </div>
                )}

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        {loadingWeather ? (
                            <span className="text-[10px] font-bold opacity-70 animate-pulse">Chargement météo...</span>
                        ) : weather ? (
                            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/10 shadow-sm">
                                {weatherInfo?.icon}
                                <span className="text-xs font-bold">{Math.round(weather.temperature)}°C</span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold opacity-50">Météo non dispo</span>
                        )}
                    </div>
                    <button 
                        onClick={() => {
                            // Envoi d'un événement global pour que App.tsx l'intercepte
                            const event = new CustomEvent('open-session', { detail: { weekNumber, sessionId: mainSession.id } });
                            window.dispatchEvent(event);
                        }} 
                        className="bg-white text-indigo-900 px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-indigo-50 transition flex items-center gap-1 group active:scale-95"
                    >
                        {isDone ? "Revoir les stats" : "Voir la séance"} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AcwrGauge = ({ acute, chronic }: {acute: number, chronic: number}) => {
    const ratio = chronic > 0 ? acute / chronic : 0;
    const clampedRatio = Math.max(0.5, Math.min(2.0, ratio));
    const rotation = ((clampedRatio - 0.5) / 1.5) * 180 - 90;
    
    let zoneColor = "#10b981"; // Green (0.8 - 1.3)
    let label = "Zone Optimale";
    
    if (ratio < 0.8) { zoneColor = "#3b82f6"; label = "Sous-entraînement"; }
    else if (ratio > 1.3 && ratio <= 1.5) { zoneColor = "#f59e0b"; label = "Surcharge (Attention)"; }
    else if (ratio > 1.5) { zoneColor = "#ef4444"; label = "Risque Blessure"; }

    return (
        <div className="relative w-full h-32 flex flex-col items-center justify-end overflow-hidden">
            <div className="absolute bottom-0 w-48 h-24 bg-slate-100 dark:bg-slate-700 rounded-t-full overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-full" style={{background: `conic-gradient(from 180deg at 50% 100%, #3b82f6 0deg 36deg, #10b981 36deg 96deg, #f59e0b 96deg 120deg, #ef4444 120deg 180deg)`}}></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-white dark:bg-slate-800 rounded-t-full flex items-end justify-center pb-2">
                    <div className="text-center">
                        <div className="text-2xl font-black text-slate-800 dark:text-white">{ratio.toFixed(2)}</div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">ACWR Ratio</div>
                    </div>
                </div>
            </div>
            {/* Needle */}
            <div 
                className="absolute bottom-0 left-1/2 w-1 h-24 bg-slate-800 dark:bg-slate-200 origin-bottom rounded-full transition-all duration-1000 ease-out z-10"
                style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
            ></div>
            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 dark:bg-slate-200 rounded-full z-20"></div>
            
            <div className="mt-2 text-xs font-bold px-3 py-1 rounded-full text-white" style={{backgroundColor: zoneColor}}>
                {label}
            </div>
        </div>
    );
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
    const primaryColor = "#f43f5e"; 
    const secondaryColor = "#fb923c"; 
    const inactiveColor = "#e2e8f0"; 

    return (
        <div className="flex justify-center p-4">
            <svg width="100" height="200" viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="15" r="10" fill={inactiveColor} />
                <path d="M35 30 H65 V60 H35 Z" fill={active.chest ? primaryColor : inactiveColor} rx="5" />
                <circle cx="25" cy="35" r="8" fill={active.shoulders ? primaryColor : inactiveColor} />
                <circle cx="75" cy="35" r="8" fill={active.shoulders ? primaryColor : inactiveColor} />
                <rect x="15" y="45" width="10" height="40" rx="5" fill={active.arms ? secondaryColor : inactiveColor} />
                <rect x="75" y="45" width="10" height="40" rx="5" fill={active.arms ? secondaryColor : inactiveColor} />
                <rect x="40" y="62" width="20" height="30" rx="2" fill={active.abs ? primaryColor : inactiveColor} />
                <rect x="35" y="95" width="12" height="50" rx="4" fill={active.legs ? primaryColor : inactiveColor} />
                <rect x="53" y="95" width="12" height="50" rx="4" fill={active.legs ? primaryColor : inactiveColor} />
                <rect x="37" y="150" width="8" height="35" rx="3" fill={active.legs ? secondaryColor : inactiveColor} />
                <rect x="55" y="150" width="8" height="35" rx="3" fill={active.legs ? secondaryColor : inactiveColor} />
                {active.cardio && <path d="M56 36 C56 36 58 32 62 32 C66 32 68 36 62 42 L56 46 L50 42 C44 36 46 32 50 32 C54 32 56 36 56 36 Z" fill={primaryColor} className="animate-pulse"/>}
            </svg>
        </div>
    );
};

export const LiveSessionTimer = ({ onFinish, timerRef, hapticEnabled }: { onFinish: (s: number) => void, timerRef?: React.MutableRefObject<number>, hapticEnabled?: boolean }) => {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);

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

    const toggleTimer = () => {
        if (!isActive && audioEnabled) {
            playBeep(800, 100); // Start beep
        }
        if(hapticEnabled) vibrate(50);
        setIsActive(!isActive);
    };

    const handleStop = () => {
        if(audioEnabled) playBeep(600, 300, 'square'); // Stop beep
        if(hapticEnabled) vibrate(100);
        setIsActive(false);
        onFinish(seconds); 
    };

    return (
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-inner mb-4 animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
                    <div className="text-4xl font-black font-mono tracking-widest">{formatStopwatch(seconds)}</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-3 rounded-full transition ${audioEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button onClick={toggleTimer} className={`p-3 rounded-full transition ${isActive ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                        {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                    </button>
                    <button onClick={handleStop} className="p-3 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition">
                        <StopCircle size={20} />
                    </button>
                </div>
            </div>
            {audioEnabled && isActive && <p className="text-[9px] text-indigo-400 mt-2 font-mono uppercase text-center flex items-center justify-center gap-1"><Volume2 size={10}/> Focus Audio Activé</p>}
        </div>
    );
};

export const RunTracker = ({ onFinish, targetDistance, hapticEnabled }: any) => {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [distance, setDistance] = useState(0);
    const [pace, setPace] = useState(0);
    const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
    const watchId = React.useRef<number | null>(null);
    const lastPosition = React.useRef<GeolocationPosition | null>(null);

    useEffect(() => {
        let interval: any = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);

            if (navigator.geolocation) {
                watchId.current = navigator.geolocation.watchPosition(
                    (position) => {
                        if (lastPosition.current) {
                            const dist = calculateHaversineDistance(
                                lastPosition.current.coords.latitude,
                                lastPosition.current.coords.longitude,
                                position.coords.latitude,
                                position.coords.longitude
                            );
                            if (dist > 0.002 && dist < 0.1) { 
                                setDistance(d => d + dist);
                            }
                        }
                        lastPosition.current = position;
                        setCurrentPosition(position);
                    },
                    (err) => console.error(err),
                    { enableHighAccuracy: true }
                );
            }
        } else {
            clearInterval(interval);
            if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        }
        return () => {
            clearInterval(interval);
            if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        };
    }, [isActive]);

    useEffect(() => {
        if (distance > 0 && seconds > 0) {
            const paceMinPerKm = (seconds / 60) / distance;
            setPace(paceMinPerKm);
        }
    }, [distance, seconds]);

    const handleStop = () => {
        if(hapticEnabled) vibrate(100);
        setIsActive(false);
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        onFinish(seconds, distance * 1000); 
    };

    const formatPaceTracker = (val: number) => {
        if (!val || val === Infinity) return "-'--";
        const min = Math.floor(val);
        const sec = Math.round((val - min) * 60);
        return `${min}'${sec.toString().padStart(2, '0')}"`;
    };

    return (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl mb-4 relative overflow-hidden animate-in fade-in slide-in-from-top-4">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Navigation size={100} className="text-indigo-500"/></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                            <MapPin size={12} className="animate-bounce"/> GPS Actif
                        </div>
                        <div className="text-5xl font-black font-mono tracking-tight">{formatStopwatch(seconds)}</div>
                    </div>
                    {isActive ? <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div> : <div className="w-3 h-3 bg-slate-500 rounded-full"></div>}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">Distance</div>
                        <div className="text-2xl font-black">{distance.toFixed(2)} <span className="text-sm font-medium text-slate-400">km</span></div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">Allure Moy.</div>
                        <div className="text-2xl font-black">{formatPaceTracker(pace)} <span className="text-sm font-medium text-slate-400">/km</span></div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => { setIsActive(!isActive); if(hapticEnabled) vibrate(50); }} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition active:scale-95 ${isActive ? 'bg-yellow-500 text-yellow-900 shadow-lg shadow-yellow-500/20' : 'bg-green-500 text-white shadow-lg shadow-green-500/20'}`}>
                        {isActive ? <><Pause size={20}/> Pause</> : <><Play size={20}/> Reprendre</>}
                    </button>
                    <button onClick={handleStop} className="px-6 py-4 bg-slate-700 text-white rounded-xl font-bold hover:bg-rose-600 transition hover:shadow-lg hover:shadow-rose-500/20 active:scale-95">
                        <StopCircle size={24}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const InteractiveInterference = () => { const [scenario, setScenario] = useState('far'); return ( <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4"> <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg"> <button onClick={() => setScenario('close')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${scenario === 'close' ? 'bg-white dark:bg-slate-600 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Séances Rapprochées (&lt;6h)</button> <button onClick={() => setScenario('far')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${scenario === 'far' ? 'bg-white dark:bg-slate-600 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Séances Espacées (&gt;24h)</button> </div> <div className="relative h-48 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center p-4"> <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div> <div className="relative z-10 w-full flex justify-between items-center"> <div className={`flex flex-col items-center transition-all duration-700 ${scenario === 'close' ? 'translate-x-8 scale-110' : 'translate-x-0'}`}> <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/50 mb-2 animate-pulse"><Zap size={20} /></div> <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Cardio (AMPk)</div> {scenario === 'far' && <div className="text-[9px] text-green-400 mt-1 animate-in fade-in slide-in-from-bottom-2">Active ✅</div>} </div> {scenario === 'close' && (<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-in zoom-in duration-300"><div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/50"><X size={24} className="text-white"/></div><div className="bg-rose-600 text-white text-[9px] font-bold px-2 py-1 rounded mt-2">INTERFÉRENCE</div></div>)} <div className={`flex flex-col items-center transition-all duration-700 ${scenario === 'close' ? '-translate-x-8 scale-90 opacity-50' : 'translate-x-0'}`}> <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/50 mb-2 animate-pulse"><Dumbbell size={20} /></div> <div className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Muscle (mTOR)</div> {scenario === 'far' && <div className="text-[9px] text-green-400 mt-1 animate-in fade-in slide-in-from-bottom-2">Active ✅</div>} </div> </div> </div> <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600">{scenario === 'close' ? "⚠️ Le signal 'Cardio' bloque la construction musculaire. Vos gains en force sont compromis." : "✅ Les deux signaux ont le temps de s'exprimer. Vous progressez en endurance ET en muscle."}</p> </div> ); };
export const StatCard = ({ label, value, unit, icon: Icon, color }: any) => ( <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"> <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p><div className="text-2xl font-black text-slate-800 dark:text-white flex items-baseline gap-1">{value} <span className="text-xs font-medium text-slate-400">{unit}</span></div></div> <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}><Icon size={20} /></div> </div> );
export const PolarizationChart = ({ low, high }: {low: number, high: number}) => { const total = low + high || 1; const lowPercent = Math.round((low / total) * 100); const highPercent = Math.round((high / total) * 100); return ( <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"> <div className="flex justify-between items-end mb-4"><h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Activity size={18} className="text-indigo-500"/> Polarisation (Prévisionnelle)</h4><span className="text-xs font-medium text-slate-400">Cible: 80/20</span></div> <div className="flex h-6 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 relative"> <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 relative group" style={{ width: `${lowPercent}%` }}><span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">Endurance</span></div> <div className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-1000 relative group" style={{ width: `${highPercent}%` }}><span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">Intensité</span></div> <div className="absolute top-0 bottom-0 w-0.5 bg-white dark:bg-slate-800 z-10" style={{left: '80%'}}></div> <div className="absolute -bottom-1 left-[80%] -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-slate-800 dark:border-b-white"></div> </div> <div className="flex justify-between mt-2 text-xs font-bold"><div className="text-emerald-600">{lowPercent}% <span className="text-[10px] font-normal text-slate-400">Volume</span></div><div className="text-rose-600">{highPercent}% <span className="text-[10px] font-normal text-slate-400">Intensité</span></div></div> </div> ); };
export const WeeklyVolumeChart = ({ plannedData, realizedData }: {plannedData: number[], realizedData: number[]}) => { const [selectedWeek, setSelectedWeek] = useState<number | null>(null); if (!plannedData || plannedData.length === 0) return <div className="text-xs text-slate-400 italic text-center p-4">Générez votre plan pour voir les données.</div>; const max = Math.max(...plannedData, 1); return ( <div className="space-y-4"> <div className="flex justify-end gap-3 text-[10px] font-bold uppercase text-slate-400 mb-2"><div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-200 border border-slate-300 rounded-sm"></div> Prévu</div><div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-500 rounded-sm"></div> Réalisé</div></div> <div className="flex items-end justify-between h-32 gap-1 mt-2 px-2 relative"> <div className="absolute inset-0 flex flex-col justify-between px-2 pointer-events-none opacity-20 z-0"><div className="w-full h-px bg-slate-400 border-dashed border-t"></div><div className="w-full h-px bg-slate-400 border-dashed border-t"></div><div className="w-full h-px bg-slate-400 border-dashed border-t"></div></div> {plannedData.map((val, i) => { const planVal = val || 0; const realVal = realizedData[i] || 0; return ( <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer relative h-full justify-end z-10" onClick={() => setSelectedWeek(i === selectedWeek ? null : i)}> <div className="w-full relative flex items-end justify-center h-full rounded-t-sm"> <div className={`w-full absolute bottom-0 border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 transition-all duration-500 rounded-t-sm z-0 ${planVal === 0 ? 'h-1' : ''}`} style={{ height: `${planVal > 0 ? (planVal / max) * 100 : 1}%` }}></div> <div className={`w-full absolute bottom-0 transition-all duration-700 rounded-t-sm z-10 ${selectedWeek === i ? 'bg-indigo-600' : 'bg-indigo-400 hover:bg-indigo-50'}`} style={{ height: `${planVal > 0 ? (realVal / max) * 100 : 0}%` }}></div> </div> <span className={`text-[9px] font-bold z-20 ${selectedWeek === i ? 'text-indigo-600 scale-125' : 'text-slate-400'}`}>S{i + 1}</span> </div> )})} </div> {selectedWeek !== null && ( <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-200 animate-in slide-in-from-top-2 shadow-sm"> <div className="flex justify-between items-center mb-1"><span className="font-bold flex items-center gap-1"><Clock size={12}/> Semaine {selectedWeek + 1}</span><span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded shadow-sm text-[10px] font-black border border-indigo-100 dark:border-slate-600">{realizedData[selectedWeek] || 0} / {plannedData[selectedWeek] || 0} min</span></div> <div className="text-slate-600 dark:text-slate-300 italic">{(realizedData[selectedWeek] || 0) >= (plannedData[selectedWeek] || 1) ? "🎉 Objectif de volume atteint ! Bravo." : "L'objectif est la barre grise. Continuez vos efforts !"}</div> </div> )} </div> ); };
export const BanisterChart = ({ duration }: {duration: number}) => { if (!duration) return <div className="text-xs text-slate-400 italic text-center p-4">En attente de données...</div>; const weeks = Array.from({length: duration + 2}, (_, i) => i); const data = weeks.map(w => { const ramp = w / duration; const fitness = 20 + (ramp * 60); const fatigue = w >= duration ? 15 : 10 + (ramp * 70) + (Math.sin(w)*10); const form = fitness - fatigue + 30; return { w, fitness, fatigue, form }; }); return ( <div className="w-full h-48 flex items-end gap-1 mt-6 relative bg-white/50 dark:bg-slate-800/50 rounded-xl p-2 border border-slate-100 dark:border-slate-700 overflow-hidden"> <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-10 pointer-events-none"><div className="w-full h-px bg-slate-900 dark:bg-white"></div><div className="w-full h-px bg-slate-900 dark:bg-white"></div><div className="w-full h-px bg-slate-900 dark:bg-white"></div></div> {data.map((d, i) => ( <div key={i} className="flex-1 flex flex-col justify-end h-full relative group"> <div className="w-2 h-2 bg-green-500 rounded-full absolute left-1/2 -translate-x-1/2 transition-all duration-500 z-20 shadow-sm shadow-green-200" style={{ bottom: `${Math.min(d.form, 95)}%` }}></div> <div className="w-1 bg-indigo-400/40 absolute left-1/2 -translate-x-1/2 bottom-0 rounded-t-full" style={{ height: `${Math.min(d.fitness, 95)}%` }}></div> <div className="w-1 bg-rose-400/40 absolute left-1/2 -translate-x-1/2 bottom-0 -translate-x-[2px] rounded-t-full" style={{ height: `${Math.min(d.fatigue, 95)}%` }}></div> </div> ))} <div className="absolute top-2 left-2 flex flex-wrap gap-3 text-[9px] font-bold bg-white/80 dark:bg-slate-900/80 p-1 rounded backdrop-blur-sm z-30 border border-slate-100 dark:border-slate-700 shadow-sm"> <span className="text-green-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Forme</span> <span className="text-indigo-400 flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-indigo-300"></div> Fitness</span> <span className="text-rose-400 flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-rose-300"></div> Fatigue</span> </div> </div> ); };
export const TrimpChart = ({ plannedData, realizedData }: {plannedData: number[], realizedData: number[]}) => { const [selectedPoint, setSelectedPoint] = useState<number | null>(null); if (!plannedData || plannedData.length === 0) return <div className="text-xs text-slate-400 italic text-center p-4">En attente de données...</div>; const trimpData = plannedData.map((val, i) => { const intensityFactor = (i % 4 === 0) ? 0.7 : (i % 4 === 1) ? 0.9 : 0.8; return Math.round(val * intensityFactor); }); const realizedTrimpData = realizedData.map((val, i) => { const intensityFactor = (i % 4 === 0) ? 0.7 : (i % 4 === 1) ? 0.9 : 0.8; return Math.round(val * intensityFactor); }); const maxTrimp = Math.max(...trimpData, 1); return ( <div className="space-y-4"> <div className="flex justify-end gap-3 text-[10px] font-bold uppercase text-slate-400 mb-2"><div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-200 border border-slate-300 rounded-sm"></div> Cible</div><div className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded-sm"></div> Fait</div></div> <div className="flex items-end justify-between h-32 gap-1 mt-4 px-2 relative"> <div className="absolute inset-0 flex flex-col justify-between px-2 pointer-events-none opacity-10"><div className="w-full h-px bg-purple-900 dark:bg-purple-300 border-dashed border-t"></div><div className="w-full h-px bg-purple-900 dark:bg-purple-300 border-dashed border-t"></div><div className="w-full h-px bg-purple-900 dark:bg-purple-300 border-dashed border-t"></div></div> {trimpData.map((trimp, i) => { const realizedTrimp = realizedTrimpData[i] || 0; return ( <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer relative h-full justify-end z-10" onClick={() => setSelectedPoint(i === selectedPoint ? null : i)}> <div className="w-full relative flex items-end justify-center h-full rounded-t-sm"> <div className="w-full absolute bottom-0 bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 opacity-60 rounded-t-sm z-0" style={{ height: `${(trimp / maxTrimp) * 80 + 10}%` }}></div> <div className={`w-full absolute bottom-0 transition-all duration-1000 z-10 rounded-t-sm ${selectedPoint === i ? 'bg-purple-600' : 'bg-gradient-to-t from-purple-300 to-purple-500'}`} style={{ height: `${(realizedTrimp / maxTrimp) * 80 + 10}%` }}></div> </div> <span className={`text-[9px] font-mono z-20 ${selectedPoint === i ? 'text-purple-600 font-bold scale-125' : 'text-slate-400'}`}>S{i + 1}</span> </div> )})} </div> {selectedPoint !== null && ( <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-xl border border-purple-100 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-200 animate-in slide-in-from-top-2 flex items-start gap-2 shadow-sm"> <Flame size={16} className="shrink-0 mt-0.5 text-purple-600"/> <div> <span className="font-bold block mb-1">Charge Semaine {selectedPoint + 1}</span> <div className="flex gap-4 mb-1 text-[10px]"><span className="text-slate-500 dark:text-slate-400">Prévu: {trimpData[selectedPoint]}</span><span className="font-black bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-800">Fait: {realizedTrimpData[selectedPoint] || 0}</span></div> <div className="text-slate-600 dark:text-slate-300 italic">{realizedTrimpData[selectedPoint] > trimpData[selectedPoint] ? "Attention, charge plus élevée que prévu." : "Charge maîtrisée."}</div> </div> </div> )} </div> ); };
export const InstallGuide = ({ onClose }: {onClose: () => void}) => ( <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300"> <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden text-center p-8 relative animate-in zoom-in-95 duration-300"> <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"><X size={24}/></button> <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600"><Smartphone size={32} /></div> <h3 className="text-2xl font-black text-slate-800 mb-2">Installer l'App 📱</h3> <p className="text-sm text-slate-500 mb-6 leading-relaxed">Pour une meilleure expérience, ajoutez C-Lab Performance à votre écran d'accueil. C'est gratuit et sans téléchargement !</p> <div className="space-y-4 text-left bg-slate-50 p-4 rounded-xl border border-slate-100"> <div className="flex items-center gap-3"><span className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white rounded-full text-xs font-bold">1</span><span className="text-sm text-slate-700">Appuyez sur le bouton <strong>Partager</strong> <Share size={14} className="inline ml-1"/> dans Safari.</span></div> <div className="flex items-center gap-3"><span className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white rounded-full text-xs font-bold">2</span><span className="text-sm text-slate-700">Faites défiler vers le bas.</span></div> <div className="flex items-center gap-3"><span className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white rounded-full text-xs font-bold">3</span><span className="text-sm text-slate-700">Sélectionnez <strong>"Sur l'écran d'accueil"</strong>.</span></div> </div> <button onClick={onClose} className="mt-6 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">C'est compris !</button> </div> </div> );

export const ProfileView = ({ userData, setUserData, stats, darkMode, setDarkMode, setShowInstallGuide, stravaData, setStravaData }: any) => {
    const [showDataModal, setShowDataModal] = useState(false);
    const [showOneRMModal, setShowOneRMModal] = useState(false);
    const [showPlateModal, setShowPlateModal] = useState(false);
    const [showHeartRateModal, setShowHeartRateModal] = useState(false);

    const handleConnectStrava = async () => {
        try {
            const response = await fetch('/api/auth/strava/url');
            const { url } = await response.json();
            
            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;

            const authWindow = window.open(
                url,
                'Strava Auth',
                `width=${width},height=${height},top=${top},left=${left}`
            );

            const handleMessage = (event: MessageEvent) => {
                if (event.data?.type === 'STRAVA_AUTH_SUCCESS') {
                    const { accessToken, athlete, expiresAt } = event.data.payload;
                    setStravaData({
                        accessToken,
                        athlete,
                        expiresAt,
                        lastSync: new Date().toISOString(),
                        activities: []
                    });
                    window.removeEventListener('message', handleMessage);
                }
            };

            window.addEventListener('message', handleMessage);
        } catch (error) {
            console.error("Erreur connexion Strava", error);
            alert("Erreur lors de la connexion à Strava.");
        }
    };

    const handleSyncStrava = async () => {
        if (!stravaData?.accessToken) return;
        
        try {
            const response = await fetch('/api/strava/activities', {
                headers: {
                    'Authorization': `Bearer ${stravaData.accessToken}`
                }
            });
            
            if (response.ok) {
                const activities = await response.json();
                setStravaData({
                    ...stravaData,
                    lastSync: new Date().toISOString(),
                    activities
                });
                alert(`${activities.length} activités synchronisées !`);
            } else {
                alert("Erreur lors de la synchronisation. Reconnectez-vous.");
            }
        } catch (error) {
            console.error("Erreur sync Strava", error);
            alert("Erreur réseau lors de la synchronisation.");
        }
    };

    // Default PR structure if not present
    const defaultPRs = {
        squat: { val: '', date: '' },
        bench: { val: '', date: '' },
        deadlift: { val: '', date: '' },
        run5k: { val: '', date: '' },
        run10k: { val: '', date: '' }
    };

    const prs = userData.personalRecords || defaultPRs;

    const updatePR = (key: string, val: string) => {
        const newPRs = { ...prs, [key]: { val, date: new Date().toISOString().split('T')[0] } };
        setUserData({ ...userData, personalRecords: newPRs });
    };
    
    // Calculate live metabolic data
    const metabolism = calculateDailyCalories(userData);

    const goals = [
        {id: 'cut', label: 'Sèche / Perte', icon: TrendingDown, color: 'text-emerald-600 bg-emerald-50 border-emerald-200'},
        {id: 'maintain', label: 'Maintien', icon: Activity, color: 'text-indigo-600 bg-indigo-50 border-indigo-200'},
        {id: 'bulk', label: 'Prise de Masse', icon: TrendingUp, color: 'text-rose-600 bg-rose-50 border-rose-200'}
    ];

    // Gamification
    const xp = getXpLevel(parseFloat(stats?.totalKm || 0), stats?.sessionsDone || 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 pb-24">
             {showDataModal && <DataManagementModal onClose={() => setShowDataModal(false)} />}
             {showOneRMModal && <OneRMModal onClose={() => setShowOneRMModal(false)} />}
             {showPlateModal && <PlateCalculatorModal onClose={() => setShowPlateModal(false)} />}
             {showHeartRateModal && <HeartRateModal onClose={() => setShowHeartRateModal(false)} userData={userData} />}

             {/* GAMIFICATION HEADER */}
             <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 shadow-xl border border-white/10 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none -mr-10 -mt-10"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-3xl shadow-inner">
                            {xp.current.icon}
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Niveau C-Lab</div>
                            <h2 className="text-2xl font-black">{xp.current.name}</h2>
                            <div className="text-xs text-slate-400 font-medium">{xp.score} XP</div>
                        </div>
                    </div>
                    {/* Dark Mode Toggle */}
                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition backdrop-blur-md"
                    >
                        {darkMode ? <Sun size={20} className="text-yellow-300"/> : <Moon size={20} className="text-slate-300"/>}
                    </button>
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-2">
                        <span>Progression</span>
                        <span>{xp.next ? `${Math.round(xp.score)} / ${xp.next.limit}` : "MAX"}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000" style={{ width: `${xp.progress}%` }}></div>
                    </div>
                    {xp.next && <div className="text-right text-[9px] text-indigo-300 mt-1">Prochain rang : {xp.next.name}</div>}
                </div>
             </div>

             {/* HEADER EDITABLE */}
             <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                <div className="relative z-10 mb-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nom de l'athlète</label>
                    <input 
                        type="text" 
                        value={userData.name} 
                        onChange={(e) => setUserData({...userData, name: e.target.value})}
                        className="text-3xl font-black text-slate-800 dark:text-white bg-transparent border-b-2 border-transparent hover:border-slate-200 dark:hover:border-slate-600 focus:border-indigo-500 outline-none w-full transition-all placeholder:text-slate-300"
                        placeholder="Votre Nom"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600 focus-within:ring-2 ring-indigo-100 dark:ring-indigo-900 transition-all">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Poids (kg)</div>
                        <input type="number" value={userData.weight} onChange={(e) => setUserData({...userData, weight: parseFloat(e.target.value)})} className="w-full bg-transparent font-black text-xl text-slate-700 dark:text-white outline-none" />
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600 focus-within:ring-2 ring-indigo-100 dark:ring-indigo-900 transition-all">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Taille (cm)</div>
                        <input type="number" value={userData.height} onChange={(e) => setUserData({...userData, height: parseFloat(e.target.value)})} className="w-full bg-transparent font-black text-xl text-slate-700 dark:text-white outline-none" />
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600 focus-within:ring-2 ring-indigo-100 dark:ring-indigo-900 transition-all">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Âge</div>
                        <input type="number" value={userData.age} onChange={(e) => setUserData({...userData, age: parseFloat(e.target.value)})} className="w-full bg-transparent font-black text-xl text-slate-700 dark:text-white outline-none" />
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Genre</div>
                        <select value={userData.gender} onChange={(e) => setUserData({...userData, gender: e.target.value})} className="w-full bg-transparent font-bold text-sm text-slate-700 dark:text-white outline-none">
                            <option value="male">Homme</option>
                            <option value="female">Femme</option>
                        </select>
                     </div>
                </div>
            </div>

            {/* PR TRACKER */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/> Records Personnels (PR)</h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Squat</span>
                            <span className="text-[9px] text-slate-400">{prs.squat.date}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <input type="number" value={prs.squat.val} onChange={(e) => updatePR('squat', e.target.value)} className="w-full bg-transparent font-black text-xl text-slate-700 dark:text-white outline-none placeholder:text-slate-300" placeholder="0" />
                            <span className="text-xs font-bold text-slate-400">kg</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Bench</span>
                            <span className="text-[9px] text-slate-400">{prs.bench.date}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <input type="number" value={prs.bench.val} onChange={(e) => updatePR('bench', e.target.value)} className="w-full bg-transparent font-black text-xl text-slate-700 dark:text-white outline-none placeholder:text-slate-300" placeholder="0" />
                            <span className="text-xs font-bold text-slate-400">kg</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Deadlift</span>
                            <span className="text-[9px] text-slate-400">{prs.deadlift.date}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <input type="number" value={prs.deadlift.val} onChange={(e) => updatePR('deadlift', e.target.value)} className="w-full bg-transparent font-black text-xl text-slate-700 dark:text-white outline-none placeholder:text-slate-300" placeholder="0" />
                            <span className="text-xs font-bold text-slate-400">kg</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">5 km</span>
                            <span className="text-[9px] text-slate-400">{prs.run5k.date}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <input type="text" value={prs.run5k.val} onChange={(e) => updatePR('run5k', e.target.value)} className="w-full bg-transparent font-black text-xl text-slate-700 dark:text-white outline-none placeholder:text-slate-300" placeholder="mm:ss" />
                        </div>
                    </div>
                </div>
            </div>

            {/* TOOLS & UTILS */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Calculator size={18} className="text-indigo-600"/> Outils Performance</h4>
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => setShowHeartRateModal(true)}
                        className="py-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 group transition"
                    >
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-lg group-hover:scale-110 transition"><HeartPulse size={20}/></div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">Zones FC</span>
                    </button>
                    <button 
                        onClick={() => setShowOneRMModal(true)}
                        className="py-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 group transition"
                    >
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition"><Dumbbell size={20}/></div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">Calc 1RM</span>
                    </button>
                    <button 
                        onClick={() => setShowPlateModal(true)}
                        className="py-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 group transition"
                    >
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition"><Disc size={20}/></div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">Disques</span>
                    </button>
                </div>
            </div>

            {/* PREFERENCES */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Smartphone size={18} className="text-indigo-600"/> Préférences App</h4>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${userData.hapticEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                            <Volume2 size={20}/>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-700 dark:text-white">Retour Haptique</div>
                            <div className="text-[10px] text-slate-400">Vibrations lors des actions</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            const newState = !userData.hapticEnabled;
                            setUserData({...userData, hapticEnabled: newState});
                            if(newState) vibrate(50);
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative ${userData.hapticEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${userData.hapticEnabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>

            {/* STRAVA INTEGRATION */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Activity size={18} className="text-orange-600"/> Intégration Strava</h4>
                
                {!stravaData?.accessToken ? (
                    <div className="text-center">
                        <p className="text-xs text-slate-500 mb-4">Connectez votre compte Strava pour importer automatiquement vos activités et suivre votre progression.</p>
                        <button 
                            onClick={handleConnectStrava}
                            className="w-full py-3 bg-[#FC4C02] text-white font-bold rounded-xl hover:bg-[#E34402] transition shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                        >
                            Connecter avec Strava
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                    {stravaData.athlete?.firstname?.[0]}{stravaData.athlete?.lastname?.[0]}
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-white">Connecté en tant que {stravaData.athlete?.firstname}</div>
                                    <div className="text-[10px] text-slate-400">Dernière synchro : {stravaData.lastSync ? new Date(stravaData.lastSync).toLocaleDateString() : 'Jamais'}</div>
                                </div>
                            </div>
                            <button onClick={() => setStravaData(null)} className="text-xs text-rose-500 font-bold hover:underline">Déconnecter</button>
                        </div>

                        <button 
                            onClick={handleSyncStrava}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                        >
                            <Activity size={16}/> Synchroniser maintenant
                        </button>

                        {stravaData.activities && stravaData.activities.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <h5 className="text-xs font-bold text-slate-400 uppercase">Dernières Activités</h5>
                                {stravaData.activities.slice(0, 3).map((activity: any) => (
                                    <div key={activity.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                                        <div className="flex items-center gap-2">
                                            <div className="text-xl">{activity.type === 'Run' ? '🏃' : activity.type === 'Ride' ? '🚴' : '🏋️'}</div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-700 dark:text-white">{activity.name}</div>
                                                <div className="text-[10px] text-slate-400">{(activity.distance / 1000).toFixed(2)} km • {formatStopwatch(activity.moving_time)}</div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400">{new Date(activity.start_date).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* METABOLISM & LIFESTYLE */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Activity size={18} className="text-indigo-600"/> Métabolisme & Activité</h4>
                
                {/* NEAT SELECTOR */}
                <div className="mb-6">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Activité Quotidienne (Hors Sport)</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setUserData({...userData, dailyActivity: 'sedentary'})} className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${!userData.dailyActivity || userData.dailyActivity === 'sedentary' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-400'}`}>
                            <Armchair size={20}/>
                            <span className="text-[9px] font-bold">Assis</span>
                        </button>
                        <button onClick={() => setUserData({...userData, dailyActivity: 'active'})} className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${userData.dailyActivity === 'active' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-400'}`}>
                            <Briefcase size={20}/>
                            <span className="text-[9px] font-bold">Actif</span>
                        </button>
                        <button onClick={() => setUserData({...userData, dailyActivity: 'very_active'})} className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${userData.dailyActivity === 'very_active' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-400'}`}>
                            <Hammer size={20}/>
                            <span className="text-[9px] font-bold">Physique</span>
                        </button>
                    </div>
                </div>

                {/* TARGET CALORIES DISPLAY */}
                <div className="flex items-center gap-4 bg-slate-900 dark:bg-black rounded-2xl p-4 text-white relative overflow-hidden mb-6">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><Flame size={64}/></div>
                    <div className="relative z-10 flex-1">
                        <div className="text-xs font-bold text-indigo-300 uppercase mb-1">Cible Journalière</div>
                        <div className="text-3xl font-black">{metabolism.target} <span className="text-sm font-medium text-slate-400">kcal</span></div>
                        <div className="text-[10px] text-slate-400 mt-1">Maintien estimé à {metabolism.maintenance} kcal</div>
                    </div>
                    <div className={`text-right font-bold text-sm px-3 py-1 rounded-lg ${metabolism.adjustment < 0 ? 'bg-rose-500/20 text-rose-300' : metabolism.adjustment > 0 ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
                        {metabolism.adjustment > 0 ? '+' : ''}{metabolism.adjustment} kcal
                    </div>
                </div>

                {/* GOAL SELECTOR */}
                <div className="mb-6">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Objectif Nutritionnel</label>
                    <div className="grid grid-cols-3 gap-2">
                        {goals.map(g => (
                            <button 
                                key={g.id}
                                onClick={() => setUserData({...userData, nutritionGoal: g.id})}
                                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${userData.nutritionGoal === g.id ? `ring-2 ring-offset-1 ${g.color} border-transparent shadow-md dark:ring-offset-slate-800` : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-400 hover:bg-slate-50'}`}
                            >
                                <g.icon size={20} />
                                <span className="text-[10px] font-bold uppercase">{g.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* INTENSITY SLIDER */}
                {userData.nutritionGoal !== 'maintain' ? (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Vitesse d'objectif ({userData.deficitIntensity || 50}%)</label>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${userData.deficitIntensity < 30 ? 'bg-emerald-100 text-emerald-700' : userData.deficitIntensity > 70 ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                {userData.deficitIntensity < 30 ? 'Durable' : userData.deficitIntensity > 70 ? 'Agressif 🔥' : 'Modéré'}
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="1" 
                            className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            value={userData.deficitIntensity !== undefined ? userData.deficitIntensity : 50}
                            onChange={(e) => setUserData({...userData, deficitIntensity: parseInt(e.target.value)})}
                        />
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mt-2">
                            <span>Lent</span>
                            <span>Rapide</span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 p-3 rounded-xl text-center text-xs text-indigo-700 dark:text-indigo-300 italic">
                        En mode "Maintien", aucune modification calorique n'est appliquée. Sélectionnez "Sèche" ou "Masse" pour ajuster la vitesse.
                    </div>
                )}
            </div>

            {/* DATA MANAGEMENT */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Save size={18} className="text-indigo-600"/> Gestion des Données</h4>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => setShowInstallGuide(true)}
                        className="w-full py-3 bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-600 hover:border-indigo-200 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
                    >
                        <Smartphone size={16}/> Installer l'application sur iPhone
                    </button>
                    <button 
                        onClick={() => setShowDataModal(true)}
                        className="w-full py-3 bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-600 hover:border-indigo-200 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
                    >
                        <Smartphone size={16}/> Sauvegarder / Transférer mes données
                    </button>
                    
                    <button 
                        onClick={() => { if(confirm("Attention: Cette action effacera définitivement toutes vos progressions. Continuer ?")) { localStorage.clear(); window.location.reload(); } }}
                        className="w-full py-3 text-rose-400 hover:text-rose-600 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                        <Trash2 size={16}/> Réinitialiser l'application
                    </button>
                </div>
            </div>
        </div>
    );
};
