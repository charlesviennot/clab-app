import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Award, Clock, ChevronDown, ChevronUp, AlertTriangle, ThumbsDown, 
  ArrowLeft, RotateCcw, Target, Calendar, Minus, Plus, Share, 
  Flame, Move, ArrowRightLeft, Undo2, Trash2, Check, CheckCircle, 
  Info, BarChart3, GraduationCap, ShieldCheck, Layers, FlaskConical,
  Coffee, Smartphone, Medal, Play, Download, Camera, Footprints,
  Sparkles, Dumbbell, History, Utensils, BookOpen, TrendingUp, Activity,
  Ruler, Square, Brain, Timer, Home, HeartPulse, Save, Upload, Navigation,
  UploadCloud, User
} from 'lucide-react';
import { LOGO_URL, DONATION_URL } from './constants';
import { RUN_PROTOCOLS, STRENGTH_PROTOCOLS } from './data/protocols';
import { calcDist, formatPace, formatGoalTime, formatStopwatch, getMuscleActivation, getTimeConstraints, getPaceForWeek } from './utils/helpers';
import { getRecommendedSchedule, downloadShareImage, downloadTCX } from './utils/logic';
import { RpeBadge, WorkoutViz, LiveSessionTimer, InteractiveInterference, PolarizationChart, WeeklyVolumeChart, BanisterChart, TrimpChart, InstallGuide, ProfileView, StatCard } from './components/Visuals';
import { ExerciseCatalog, ExerciseModal, SessionHistoryDetail, RunTracker } from './components/Modals';
import { NutritionView } from './components/Nutrition';
// Icon helper import fix
import { ListPlus } from 'lucide-react';

export default function App() {
  const defaultUserData = { name: "User", weight: 75, height: 175, age: 30, gender: 'male', goalTime: 50, targetDistance: '10k', currentEstimatedTime: null, runDaysPerWeek: 3, strengthDaysPerWeek: 2, hyroxSessionsPerWeek: 3, extraRunSessions: 0, extraStrengthSessions: 0, strengthFocus: 'hypertrophy', durationWeeks: 10, progressionStart: 15, difficultyFactor: 1.0, raceDate: null, nutritionGoal: 'maintain' };
  const loadState = (key: string, defaultValue: any) => {
    if (typeof window === 'undefined') return defaultValue;
    try { const saved = localStorage.getItem('clab_storage'); if (saved) { const parsed = JSON.parse(saved); if (key === 'userData') return { ...defaultValue, ...(parsed[key] || {}) }; if (key === 'completedSessions') return new Set(parsed.completedSessions || []); if (key === 'completedExercises') return new Set(parsed.completedExercises || []); return parsed[key] !== undefined ? parsed[key] : defaultValue; } } catch (e) { console.error(e); } return defaultValue;
  };

  useEffect(() => { const updateIcons = () => { let appleLink: any = document.querySelector("link[rel~='apple-touch-icon']"); if (!appleLink) { appleLink = document.createElement('link'); appleLink.rel = 'apple-touch-icon'; document.head.appendChild(appleLink); } appleLink.href = LOGO_URL; let favLink: any = document.querySelector("link[rel~='icon']"); if (!favLink) { favLink = document.createElement('link'); favLink.rel = 'icon'; document.head.appendChild(favLink); } favLink.href = LOGO_URL; }; updateIcons(); }, []);
  
  const [step, setStep] = useState<string>(() => loadState('step', 'input'));
  const [activeTab, setActiveTab] = useState<string>(() => loadState('activeTab', 'profile'));
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [userData, setUserData] = useState<any>(() => loadState('userData', defaultUserData));
  const [plan, setPlan] = useState<any[]>(() => loadState('plan', []));
  const [expandedWeek, setExpandedWeek] = useState<number | null>(() => loadState('expandedWeek', 1));
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(() => loadState('completedSessions', new Set()));
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(() => loadState('completedExercises', new Set()));
  const [exercisesLog, setExercisesLog] = useState<any>(() => loadState('exercisesLog', {}));
  const [nutritionLog, setNutritionLog] = useState<any>(() => loadState('nutritionLog', {})); 
  const [calculationMode, setCalculationMode] = useState('weeks'); 

  useEffect(() => { const dataToSave = { step, activeTab, userData, plan, expandedWeek, completedSessions: Array.from(completedSessions), completedExercises: Array.from(completedExercises), exercisesLog, nutritionLog }; localStorage.setItem('clab_storage', JSON.stringify(dataToSave)); }, [step, activeTab, userData, plan, expandedWeek, completedSessions, completedExercises, exercisesLog, nutritionLog]);

  const [modalExercise, setModalExercise] = useState<any>(null); 
  const [filteredSessionIds, setFilteredSessionIds] = useState<string[] | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<any>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [swapSelection, setSwapSelection] = useState<any>(null);
  const [exerciseSwapSelection, setExerciseSwapSelection] = useState<any>(null);
  const [catalogSessionId, setCatalogSessionId] = useState<string | null>(null);
  const [activeTimerSessionId, setActiveTimerSessionId] = useState<string | null>(null); 
  const [lastCompletedData, setLastCompletedData] = useState<any>(null); 
  const [selectedHistorySession, setSelectedHistorySession] = useState<any>(null);
  const [showRunTracker, setShowRunTracker] = useState<string | null>(null);
  const currentTimerRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDistanceSelect = (dist: string) => { 
      let defaultTime = 50; 
      let defaultDuration = 10; 
      if (dist === '5k') { defaultTime = 25; defaultDuration = 8; } 
      if (dist === '10k') { defaultTime = 50; defaultDuration = 10; } 
      if (dist === '21k') { defaultTime = 105; defaultDuration = 12; } 
      if (dist === '42k') { defaultTime = 240; defaultDuration = 16; } 
      if (dist === 'hyrox') { defaultTime = 90; defaultDuration = 10; } 
      
      setUserData({ 
          ...userData, 
          targetDistance: dist, 
          goalTime: defaultTime, 
          durationWeeks: defaultDuration, 
          raceDate: null,
          currentEstimatedTime: null
      }); 
      setCalculationMode('weeks'); 
  };

  const handleTimeChange = (delta: number, isGoal = true) => { 
      const constraints = getTimeConstraints(userData.targetDistance);
      const step = ['5k', '10k', 'hyrox'].includes(userData.targetDistance) ? 0.5 : 1; 
      
      if (isGoal) {
          const newTime = Math.max(constraints.min, Math.min(constraints.max, userData.goalTime + (delta * step)));
          setUserData({...userData, goalTime: newTime});
      } else {
          const baseTime = userData.currentEstimatedTime || (userData.goalTime * 1.15);
          const newTime = Math.max(constraints.min, baseTime + (delta * step));
          setUserData({...userData, currentEstimatedTime: newTime});
      }
  };

  const toggleCurrentTimeEstimate = () => {
      if (userData.currentEstimatedTime) {
          setUserData({...userData, currentEstimatedTime: null});
      } else {
          setUserData({...userData, currentEstimatedTime: Math.round(userData.goalTime * 1.15)});
      }
  };

  const timeConstraints = getTimeConstraints(userData.targetDistance);
  
  const handleSwapRequest = (weekIdx: number, dayIdx: number) => { if (swapSelection && swapSelection.weekIdx === weekIdx && swapSelection.dayIdx === dayIdx) { setSwapSelection(null); return; } if (!swapSelection) { setSwapSelection({ weekIdx, dayIdx }); return; } if (swapSelection.weekIdx === weekIdx) { handleSwap(weekIdx, swapSelection.dayIdx, dayIdx); setSwapSelection(null); } else { setSwapSelection({ weekIdx, dayIdx }); } };
  const handleSwap = (weekIdx: number, sourceDayIdx: number, targetDayIdx: number) => { const newPlan = plan.map(w => { if (w.weekNumber !== weekIdx) return w; const newSchedule = [...w.schedule]; const source = newSchedule[sourceDayIdx]; const target = newSchedule[targetDayIdx]; const tempActivity = source.activity; const tempFocus = source.focus; const tempSessionIds = source.sessionIds; source.activity = target.activity; source.focus = target.focus; source.sessionIds = target.sessionIds; target.activity = tempActivity; target.focus = tempFocus; target.sessionIds = tempSessionIds; return { ...w, schedule: newSchedule }; }); setPlan(newPlan); };
  
  const handleExerciseSwapRequest = (weekIdx: number, sessionId: string, exIdx: number) => { if (exerciseSwapSelection && exerciseSwapSelection.sessionId === sessionId && exerciseSwapSelection.exIdx === exIdx) { setExerciseSwapSelection(null); return; } if (exerciseSwapSelection) { if (exerciseSwapSelection.sessionId !== sessionId) { setExerciseSwapSelection({ weekIdx, sessionId, exIdx }); } else { handleExerciseSwap(weekIdx, sessionId, exerciseSwapSelection.exIdx, exIdx); setExerciseSwapSelection(null); } } else { setExerciseSwapSelection({ weekIdx, sessionId, exIdx }); } };
  const handleExerciseSwap = (weekIdx: number, sessionId: string, idx1: number, idx2: number) => { const newPlan = plan.map(week => { if (week.weekNumber !== weekIdx) return week; const newSessions = week.sessions.map((session: any) => { if (session.id !== sessionId) return session; const newExercises = [...session.exercises]; [newExercises[idx1], newExercises[idx2]] = [newExercises[idx2], newExercises[idx1]]; return { ...session, exercises: newExercises }; }); return { ...week, sessions: newSessions }; }); setPlan(newPlan); const id1 = `${sessionId}-ex-${idx1}`; const id2 = `${sessionId}-ex-${idx2}`; const newCompleted = new Set(completedExercises); const has1 = newCompleted.has(id1); const has2 = newCompleted.has(id2); if (has1 && !has2) { newCompleted.delete(id1); newCompleted.add(id2); } else if (!has1 && has2) { newCompleted.delete(id2); newCompleted.add(id1); } setCompletedExercises(newCompleted); };
  
  const handleAddExercise = (exercise: any) => { if (!catalogSessionId) return; const newPlan = plan.map(week => ({ ...week, sessions: week.sessions.map((sess: any) => { if (sess.id === catalogSessionId) { return { ...sess, exercises: [...(sess.exercises || []), { ...exercise, sets: 3, reps: '10' }] }; } return sess; }) })); setPlan(newPlan); setCatalogSessionId(null); };
  const handleDeleteExercise = (weekIdx: number, sessionId: string, exIdx: number) => { const newPlan = plan.map(week => { if (week.weekNumber !== weekIdx) return week; const newSessions = week.sessions.map((session: any) => { if (session.id !== sessionId) return session; const newExercises = session.exercises.filter((_: any, i: number) => i !== exIdx); return { ...session, exercises: newExercises }; }); return { ...week, sessions: newSessions }; }); setPlan(newPlan); };
  
  const resetWeekOrder = (weekNumber: number) => { const newPlan = plan.map((week) => { if (week.weekNumber !== weekNumber) return week; const originalSessions = week.sessions; const defaultSchedule = getRecommendedSchedule(originalSessions, userData.targetDistance === 'hyrox'); return { ...week, schedule: defaultSchedule }; }); setPlan(newPlan); };
  const resetWeekProgress = (week: any) => { const newCompletedSessions = new Set(completedSessions); const newCompletedExercises = new Set(completedExercises); week.sessions.forEach((session: any) => { if (newCompletedSessions.has(session.id)) { newCompletedSessions.delete(session.id); } if (session.exercises) { session.exercises.forEach((_: any, idx: number) => { const exId = `${session.id}-ex-${idx}`; if (newCompletedExercises.has(exId)) { newCompletedExercises.delete(exId); } }); } }); setCompletedSessions(newCompletedSessions); setCompletedExercises(newCompletedExercises); };
  
  const stats = useMemo(() => { if (plan.length === 0) return null; let totalSessions = 0, completedCount = 0, totalKm = 0; const weeklyVolume = plan.map(() => 0); const plannedWeeklyVolume = plan.map(() => 0); let plannedIntensityBuckets = { low: 0, high: 0 }; plan.forEach((week, i) => { week.sessions.forEach((session: any) => { plannedWeeklyVolume[i] += session.durationMin; if (session.intensity === 'low') plannedIntensityBuckets.low += session.durationMin; else plannedIntensityBuckets.high += session.durationMin; totalSessions++; const isDone = completedSessions.has(session.id); if (isDone) { completedCount++; weeklyVolume[i] += session.durationMin; if (session.category === 'run' && session.distance) { const km = parseFloat(session.distance); if(!isNaN(km)) totalKm += km; } } }); }); return { progress: totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0, totalKm: totalKm.toFixed(1), sessionsDone: completedCount, totalSessions, intensityBuckets: plannedIntensityBuckets, weeklyVolume: plannedWeeklyVolume, realizedWeeklyVolume: weeklyVolume }; }, [plan, completedSessions]);
  
  const toggleSession = (id: string) => { const newSet = new Set(completedSessions); if (!newSet.has(id)) { newSet.add(id); setCompletedSessions(newSet); } };
  const handleTimerFinish = (sessionId: string, duration: number) => { toggleSession(sessionId); setActiveTimerSessionId(null); if(currentTimerRef) currentTimerRef.current = 0; let sessionData = null; for (const week of plan) { const s = week.sessions.find((sess: any) => sess.id === sessionId); if (s) { sessionData = s; break; } } if (sessionData) { setLastCompletedData({ session: sessionData, duration: duration, date: new Date() }); } };
  const unvalidateSession = (id: string) => { const newSet = new Set(completedSessions); if (newSet.has(id)) { newSet.delete(id); setCompletedSessions(newSet); } };
  const toggleExercise = (exerciseUniqueId: string) => { const newSet = new Set(completedExercises); if (newSet.has(exerciseUniqueId)) { newSet.delete(exerciseUniqueId); } else { newSet.add(exerciseUniqueId); } setCompletedExercises(newSet); };
  
  const handleSessionCompleteFromModal = (sessionId: string, isExercise = false, data: any = null) => { 
      if (isExercise) { 
          toggleExercise(sessionId); 
          if (data) { setExercisesLog((prev: any) => ({...prev, [sessionId]: data})); } 
      } else { 
          if (!completedSessions.has(sessionId)) { toggleSession(sessionId); }
          if (data && (data.customDuration || data.customDistance)) {
              let sessionData = null;
              for (const week of plan) { 
                  const s = week.sessions.find((sess: any) => sess.id === sessionId); 
                  if (s) { sessionData = s; break; } 
              }
              if (sessionData) {
                  if(data.routeData) {
                      setExercisesLog((prev: any) => ({...prev, [`${sessionId}_gps`]: data.routeData}));
                  }
                  const realSessionData = { ...sessionData };
                  if (data.customDistance) realSessionData.distance = data.customDistance;
                  
                  setLastCompletedData({ 
                      session: realSessionData, 
                      duration: data.customDuration || (sessionData.durationMin * 60), 
                      date: new Date(),
                      route: data.routeData 
                  });
              }
          }
      } 
  };

  const handleTrackerFinish = (duration: number, distance: number, route: any[]) => {
      if (showRunTracker) {
          const distStr = distance.toFixed(2) + " km";
          handleSessionCompleteFromModal(showRunTracker, false, { customDuration: duration, customDistance: distStr, routeData: route });
          setShowRunTracker(null);
      }
  };
  
  const adaptDifficulty = (weekNum: number, action: string) => { let message = ""; let type = 'neutral'; if (action === 'easier') { const newFactor = userData.difficultyFactor + 0.05; setUserData((prev: any) => ({ ...prev, difficultyFactor: newFactor })); message = "Plan adapté : Allures ralenties de 5% pour la suite (récupération)."; type = 'warning'; } else if (action === 'harder') { const newFactor = Math.max(0.8, userData.difficultyFactor - 0.05); setUserData((prev: any) => ({ ...prev, difficultyFactor: newFactor })); message = "Plan adapté : Allures accélérées de 5% pour la suite (performance) !"; type = 'success'; } else { message = "Semaine validée ! Maintien de la progression prévue."; type = 'success'; } setFeedbackMessage({ text: message, type }); if (weekNum < userData.durationWeeks) setExpandedWeek(weekNum + 1); else setExpandedWeek(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleDayClick = (daySessionIds: string[]) => { if (!daySessionIds || daySessionIds.length === 0) { setFilteredSessionIds(null); setExpandedSession(null); return; } if (filteredSessionIds && JSON.stringify(filteredSessionIds) === JSON.stringify(daySessionIds)) { setFilteredSessionIds(null); setExpandedSession(null); } else { setFilteredSessionIds(daySessionIds); if (daySessionIds.length > 0) { setExpandedSession(daySessionIds[0]); } } };
  
  const handleDateSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if(!dateStr) return;
    const targetDate = new Date(dateStr);
    targetDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.round(diffDays / 7);
    setUserData({
        ...userData,
        raceDate: dateStr,
        durationWeeks: Math.max(1, diffWeeks)
    });
  };

  const generatePlan = () => { 
    const newPlan = []; 
    const { durationWeeks: totalWeeks, targetDistance } = userData; 
    const adaptationWeeks = Math.ceil(totalWeeks * 0.3); 
    const taperWeeks = 2; 
    let hypertrophySessionIndex = 0; 
    let streetSessionIndex = 0; 
    let hyroxSessionIndex = 0;
    let homeSessionIndex = 0;
    let reinforcementSessionIndex = 0;
    let distanceKm = 10; 
    
    if (targetDistance === '5k') distanceKm = 5; 
    if (targetDistance === '21k') distanceKm = 21.1; 
    if (targetDistance === '42k') distanceKm = 42.195; 
    if (targetDistance === 'hyrox') distanceKm = 8; 
    
    for (let i = 1; i <= totalWeeks; i++) { 
        const isRaceWeek = i === totalWeeks; 
        const isTaper = i > totalWeeks - taperWeeks; 
        const isAdaptation = i <= adaptationWeeks; 
        
        const paces = getPaceForWeek(i, totalWeeks, userData.goalTime, userData.progressionStart, userData.difficultyFactor, distanceKm, userData.currentEstimatedTime); 
        
        let sessions = []; 
        let focus = isRaceWeek ? "OBJECTIF" : isTaper ? "AFFÛTAGE" : isAdaptation ? "ADAPTATION" : "DÉVELOPPEMENT"; 
        let volumeLabel = isAdaptation ? "Volume bas" : isTaper ? "Récupération" : "Charge haute"; 
        const isTechWeek = i % 2 !== 0; 
        
        if (targetDistance === 'hyrox') { 
            focus = isRaceWeek ? "HYROX RACE" : focus; 
            const totalRunSessions = userData.extraRunSessions !== undefined ? userData.extraRunSessions : 1; 
            if (totalRunSessions > 0) { sessions.push({ id: `w${i}-run-eng`, day: "RUN ENGINE", category: 'run', type: "Running Intervals", structure: 'interval', intensity: 'high', duration: "45 min", durationMin: 45, distance: "8 km", paceTarget: paces.interval, paceGap: paces.gap, rpe: 8, description: "Travail de VMA pour supporter les transitions.", scienceNote: "VO2max Running.", planningAdvice: "Essentiel pour le temps global.", exercises: RUN_PROTOCOLS.interval_short }); } 
            for(let r=1; r < totalRunSessions; r++) { sessions.push({ id: `w${i}-bonus-r${r}`, day: `RUN ENDURANCE ${r}`, category: 'run', type: "Endurance Fondamentale", structure: 'steady', intensity: 'low', duration: "45 min", durationMin: 45, distance: calcDist(45, paces.valEasy), paceTarget: paces.easyRange, paceGap: paces.gap, rpe: 3, description: "Footing souple pour augmenter le volume aérobie.", scienceNote: "Capillarisation.", planningAdvice: "À placer un jour de repos ou en bi-quotidien.", exercises: RUN_PROTOCOLS.steady }); } 
            const splitNames = ["Hyrox Sleds & Force", "Hyrox Functional Capacité", "Hyrox Erg & Power", "Hyrox Compromised Legs", "Hyrox Full Race Sim"]; 
            const splitExos = [STRENGTH_PROTOCOLS.hyrox.sleds_strength, STRENGTH_PROTOCOLS.hyrox.functional_endurance, STRENGTH_PROTOCOLS.hyrox.ergs_power, STRENGTH_PROTOCOLS.hyrox.legs_compromised, STRENGTH_PROTOCOLS.hyrox.full_race_sim]; 
            const hyroxCount = userData.hyroxSessionsPerWeek || 3; 
            for(let h=0; h < hyroxCount; h++) { const currentSplitIndex = (hyroxSessionIndex + h) % 5; sessions.push({ id: `w${i}-hyrox-${h}`, day: `HYROX ${h+1}`, category: 'hyrox', type: splitNames[currentSplitIndex], structure: 'pyramid', intensity: 'high', duration: "60-90 min", durationMin: 75, paceTarget: "N/A", paceGap: 0, rpe: 9, description: `Entraînement spécifique ${splitNames[currentSplitIndex]}.`, scienceNote: "Endurance de force.", planningAdvice: "Simulez les conditions de course.", exercises: splitExos[currentSplitIndex], tags: ['legs'] }); } 
            hyroxSessionIndex += hyroxCount; 
            const extraStrengthCount = userData.extraStrengthSessions || 0; 
            for(let s=0; s < extraStrengthCount; s++) { sessions.push({ id: `w${i}-bonus-s${s}`, day: `BONUS MUSCU ${s+1}`, category: 'strength', type: "Force Max", structure: 'pyramid', intensity: 'high', duration: "60 min", durationMin: 60, paceTarget: "N/A", paceGap: 0, rpe: 8, description: "Renforcement pur pour soutenir la charge Hyrox.", scienceNote: "Recrutement unités motrices.", planningAdvice: "Loin des séances intenses.", exercises: STRENGTH_PROTOCOLS.force.full }); } 
        } else { 
            sessions.push({ id: `w${i}-r1`, day: "RUN 1", category: 'run', type: isTechWeek ? "Endurance + Lignes Droites" : "Endurance Fondamentale", structure: 'steady', intensity: 'low', duration: "45 min", durationMin: 45, distance: calcDist(45, paces.valEasy), paceTarget: paces.easyRange, paceGap: paces.gap, rpe: 3, description: isTechWeek ? "40' cool + 5x80m progressif (lignes droites) pour la foulée." : "Aisance respiratoire stricte. Capacité à parler.", scienceNote: "Zone 1/2 : Densité mitochondriale.", planningAdvice: "Idéal après une journée de repos ou de muscu haut du corps.", exercises: RUN_PROTOCOLS.steady }); 
            
            if (userData.runDaysPerWeek >= 2) { 
                let sessionType = ""; 
                let sessionExo: any[] = []; 
                if (targetDistance === '5k') { sessionType = "VMA Courte"; sessionExo = RUN_PROTOCOLS.interval_short; } 
                else if (targetDistance === '10k') { const cycle = i % 4; if (cycle === 1) { sessionType = "VMA Courte"; sessionExo = RUN_PROTOCOLS.interval_short; } else if (cycle === 2) { sessionType = "Seuil Anaérobie"; sessionExo = RUN_PROTOCOLS.threshold; } else if (cycle === 3) { sessionType = "Côtes / Force"; sessionExo = RUN_PROTOCOLS.hills; } else { sessionType = "VMA Longue"; sessionExo = RUN_PROTOCOLS.interval_long; } } 
                else if (targetDistance === '21k') { sessionType = "Seuil Long"; sessionExo = RUN_PROTOCOLS.threshold; } 
                else { sessionType = (i%2===0) ? "Allure Marathon" : "Seuil"; sessionExo = (i%2===0) ? RUN_PROTOCOLS.long_run : RUN_PROTOCOLS.threshold; } 
                sessions.push({ id: `w${i}-r2`, day: "RUN 2", category: 'run', type: sessionType, structure: 'interval', intensity: 'high', duration: "60 min", durationMin: 60, distance: "Varié", paceTarget: paces.interval, paceGap: paces.gap, rpe: 8, description: `Séance clé pour ${targetDistance}.`, scienceNote: "Développement moteur.", planningAdvice: "Fraîcheur requise.", exercises: sessionExo }); 
            } 
            
            if (userData.runDaysPerWeek >= 3) { 
                let longRunDuration = 60; 
                let longRunType = "Sortie Longue"; 
                if (targetDistance === '21k') { longRunDuration = 80 + (i * 5); if (longRunDuration > 130) longRunDuration = 90; } 
                if (targetDistance === '42k') { if (i % 3 === 0) { longRunDuration = 90; longRunType = "Sortie Longue (Récup)"; } else { longRunDuration = 100 + (i * 10); if (longRunDuration > 180) longRunDuration = 150; } } 
                if (isTaper) longRunDuration = longRunDuration * 0.6; 
                sessions.push({ id: `w${i}-r3`, day: "RUN 3", category: 'run', type: longRunType, structure: 'steady', intensity: 'low', duration: `${longRunDuration} min`, durationMin: longRunDuration, distance: calcDist(longRunDuration, paces.valEasy), paceTarget: paces.easyRange, paceGap: paces.gap, rpe: 4, description: "Volume indispensable. Hydratation test.", scienceNote: "Endurance fondamentale.", planningAdvice: "Le weekend.", exercises: RUN_PROTOCOLS.long_run }); 
            }
            
            if (userData.runDaysPerWeek >= 4) {
                 sessions.push({ 
                     id: `w${i}-r4`, 
                     day: "RUN 4", 
                     category: 'run', 
                     type: "Récupération Active", 
                     structure: 'steady', 
                     intensity: 'low', 
                     duration: "30 min", 
                     durationMin: 30, 
                     distance: calcDist(30, paces.valEasy), 
                     paceTarget: paces.easyRange, 
                     paceGap: paces.gap, 
                     rpe: 2, 
                     description: "Footing très lent pour assimiler le travail.", 
                     scienceNote: "Flux sanguin.", 
                     planningAdvice: "Le lendemain de la sortie longue ou de la VMA.", 
                     exercises: RUN_PROTOCOLS.recovery 
                 });
            }
            
            const strengthCount = isTaper ? Math.max(0, userData.strengthDaysPerWeek - 2) : userData.strengthDaysPerWeek; 
            for(let s=1; s<=strengthCount; s++) { 
                let gymType = ""; let exercises: any[] = []; let gymAdvice = ""; let gymTags: string[] = []; 
                if (userData.strengthFocus === 'force') { if (strengthCount === 2) { if(s===1) { gymType = "Jambes (Force)"; exercises = STRENGTH_PROTOCOLS.force.legs; gymTags=['legs']; gymAdvice = "⚠️ Évitez la veille du Run 2."; } else { gymType = "Haut du Corps"; exercises = STRENGTH_PROTOCOLS.force.upper; gymAdvice = "Récupération active possible."; } } else { if(s===1) { gymType = "Jambes (Force)"; exercises = STRENGTH_PROTOCOLS.force.legs; gymTags=['legs']; } else { gymType = "Full Body"; exercises = STRENGTH_PROTOCOLS.force.full; } } } else if (userData.strengthFocus === 'street_workout') { const splitNames = ["Street Push", "Street Pull", "Street Legs", "Street Skills", "Street Full Body"]; const splitExos = [STRENGTH_PROTOCOLS.street_workout.push, STRENGTH_PROTOCOLS.street_workout.pull, STRENGTH_PROTOCOLS.street_workout.legs, STRENGTH_PROTOCOLS.street_workout.skills_core, STRENGTH_PROTOCOLS.street_workout.full_body]; const currentSplitIndex = streetSessionIndex % 5; gymType = splitNames[currentSplitIndex]; exercises = splitExos[currentSplitIndex]; if (currentSplitIndex === 2) gymTags = ['legs']; streetSessionIndex++; } else if (userData.strengthFocus === 'home_no_equipment') { const splitNames = ["Maison Push", "Maison Pull", "Maison Legs", "Maison Core", "Maison Full"]; const splitExos = [STRENGTH_PROTOCOLS.home_no_equipment.push_home, STRENGTH_PROTOCOLS.home_no_equipment.pull_home, STRENGTH_PROTOCOLS.home_no_equipment.legs_home, STRENGTH_PROTOCOLS.home_no_equipment.core_home, STRENGTH_PROTOCOLS.home_no_equipment.full_home]; const currentSplitIndex = homeSessionIndex % 5; gymType = splitNames[currentSplitIndex]; exercises = splitExos[currentSplitIndex]; if(currentSplitIndex === 2) gymTags=['legs']; homeSessionIndex++; } else if (userData.strengthFocus === 'reinforcement') { const splitNames = ["Posture & Dos", "Stabilité Jambes", "Core & Proprio", "Mobilité Flow", "Total Body PPG"]; const splitExos = [STRENGTH_PROTOCOLS.reinforcement.posture_upper, STRENGTH_PROTOCOLS.reinforcement.stability_lower, STRENGTH_PROTOCOLS.reinforcement.core_back, STRENGTH_PROTOCOLS.reinforcement.mobility_flow, STRENGTH_PROTOCOLS.reinforcement.total_body_tone]; const currentSplitIndex = reinforcementSessionIndex % 5; gymType = splitNames[currentSplitIndex]; exercises = splitExos[currentSplitIndex]; reinforcementSessionIndex++; } else { const splitNames = ["Push (Pecs/Épaules)", "Pull (Dos/Biceps/Abdos)", "Legs (Jambes)", "Épaules & Bras", "Dos & Pecs"]; const splitExos = [STRENGTH_PROTOCOLS.hypertrophy.push, STRENGTH_PROTOCOLS.hypertrophy.pull, STRENGTH_PROTOCOLS.hypertrophy.legs, STRENGTH_PROTOCOLS.hypertrophy.shoulders_arms, STRENGTH_PROTOCOLS.hypertrophy.chest_back]; const currentSplitIndex = hypertrophySessionIndex % 5; gymType = splitNames[currentSplitIndex]; exercises = splitExos[currentSplitIndex]; if (currentSplitIndex === 2) gymTags = ['legs']; hypertrophySessionIndex++; } 
                sessions.push({ id: `w${i}-s${s}`, day: `GYM ${s}`, category: 'strength', type: gymType, structure: 'pyramid', intensity: 'high', duration: "45-60 min", durationMin: 60, paceTarget: "N/A", paceGap: 0, rpe: 8, description: `Séance ${gymType}.`, scienceNote: "Renforcement.", planningAdvice: gymAdvice, exercises: exercises, tags: gymTags }); 
            } 
        } 
        const weeklySchedule = getRecommendedSchedule(sessions, targetDistance === 'hyrox'); 
        newPlan.push({ weekNumber: i, focus, volumeLabel, sessions, schedule: weeklySchedule }); 
    } 
    setPlan(newPlan); setStep('result'); 
  };
  const resetPlan = () => { localStorage.removeItem('clab_storage'); setCompletedSessions(new Set()); setCompletedExercises(new Set()); setUserData(defaultUserData); setStep('input'); setPlan([]); };

  const handleExportData = () => {
    const data = {
        userData,
        plan,
        completedSessions: Array.from(completedSessions),
        completedExercises: Array.from(completedExercises),
        exercisesLog,
        nutritionLog,
        step: 'result'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clab_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target?.result as string);
            if (data.userData) setUserData(data.userData);
            if (data.plan) setPlan(data.plan);
            if (data.completedSessions) setCompletedSessions(new Set(data.completedSessions));
            if (data.completedExercises) setCompletedExercises(new Set(data.completedExercises));
            if (data.exercisesLog) setExercisesLog(data.exercisesLog);
            if (data.nutritionLog) setNutritionLog(data.nutritionLog);
            if (data.step) setStep(data.step);
            
            // Save to local storage as well
            localStorage.setItem('clab_storage', JSON.stringify({
                userData: data.userData,
                plan: data.plan,
                completedSessions: data.completedSessions,
                completedExercises: data.completedExercises,
                exercisesLog: data.exercisesLog,
                nutritionLog: data.nutritionLog,
                step: data.step,
                activeTab: 'plan'
            }));
            
            setFeedbackMessage({ text: "Données restaurées avec succès !", type: 'success' });
            setTimeout(() => setFeedbackMessage(null), 3000);
        } catch (err) {
            console.error(err);
            alert("Fichier invalide.");
        }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center sm:py-10 text-slate-800 font-sans">
      <div className="w-full max-w-md sm:max-w-3xl bg-slate-50 min-h-screen sm:min-h-fit sm:rounded-3xl sm:shadow-2xl overflow-hidden flex flex-col relative">
        
      {step === 'input' && (
        <div className="bg-slate-900 relative overflow-hidden text-white pt-12 pb-24 rounded-b-[3rem] shadow-2xl">
             <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
            <div className="absolute -top-20 -right-20 bg-indigo-600 rounded-full w-64 h-64 blur-3xl opacity-30"></div>
            <div className="absolute top-20 -left-20 bg-rose-600 rounded-full w-64 h-64 blur-3xl opacity-20"></div>

            <div className="max-w-3xl mx-auto px-6 relative z-10 text-center">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <GraduationCap size={14} className="text-yellow-400"/> Ingénierie de la Performance
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                    C-Lab <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">Performance</span>
                </h1>
                <p className="text-slate-300 text-lg md:text-xl max-w-xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    La science de l'entraînement au service de votre objectif. <br/>
                    <span className="text-sm opacity-75">Optimisation de l'interférence • Planification Polarisée</span>
                </p>
                <div className="flex justify-center gap-8 mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest animate-in fade-in duration-1000 delay-300">
                    <div className="flex items-center gap-2"><ShieldCheck size={16}/> Scientifique</div>
                    <div className="flex items-center gap-2"><Layers size={16}/> Hybride</div>
                    <div className="flex items-center gap-2"><FlaskConical size={16}/> C-Lab</div>
                </div>
            </div>
        </div>
      )}

      {step === 'result' && (
        <div className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-lg sticky top-0 z-50">
            <div className="max-w-3xl mx-auto flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
                <button onClick={() => setStep('input')} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition" title="Retour Menu">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <FlaskConical size={12}/> C-Lab Performance
                    </div>
                    <h1 className="text-xl md:text-2xl font-black">Plan {userData.targetDistance === 'hyrox' ? 'HYROX' : 'Running'}</h1>
                    {userData.raceDate && <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Objectif le {new Date(userData.raceDate).toLocaleDateString()}</div>}
                </div>
            </div>
             <div className="flex w-full sm:w-auto bg-slate-800 rounded-lg p-1 overflow-x-auto">
                    <button onClick={() => setActiveTab('profile')} className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-xs font-bold transition text-center flex items-center justify-center gap-1 ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><User size={12}/> Profil</button>
                    <button onClick={() => setActiveTab('plan')} className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-xs font-bold transition text-center ${activeTab === 'plan' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Programme</button>
                    <button onClick={() => setActiveTab('stats')} className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-xs font-bold transition text-center ${activeTab === 'stats' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Science</button>
                    <button onClick={() => setActiveTab('nutrition')} className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-xs font-bold transition text-center flex items-center justify-center gap-1 ${activeTab === 'nutrition' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><Utensils size={12}/> Nutrition</button>
              </div>
            </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 mt-6 flex-1 w-full relative z-20 pb-20">
        
        {step === 'result' && (
            <a 
              href={DONATION_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="fixed bottom-6 right-6 z-[60] bg-[#FFDD00] text-black p-4 rounded-full shadow-2xl hover:scale-110 transition-transform animate-bounce group flex items-center justify-center border-4 border-white/50"
              title="Soutenir le projet"
            >
              <Coffee size={24} className="group-hover:rotate-12 transition-transform"/>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping"></div>
            </a>
        )}

        {showInstallGuide && <InstallGuide onClose={() => setShowInstallGuide(false)} />}

        {/* Global GPS Overlay */}
        {showRunTracker && (
            <div className="fixed inset-0 z-[100] bg-black">
                <RunTracker 
                    onFinish={handleTrackerFinish} 
                    onCancel={() => setShowRunTracker(null)} 
                />
            </div>
        )}

        {modalExercise && (
            <ExerciseModal 
                exercise={modalExercise.data} 
                exerciseId={modalExercise.id} 
                category={modalExercise.category} 
                exerciseIndex={modalExercise.index} 
                onClose={() => setModalExercise(null)} 
                onComplete={(uniqueId: string, isExercise: boolean, data: any) => handleSessionCompleteFromModal(uniqueId, isExercise, data)}
                savedData={exercisesLog[`${modalExercise.id}-ex-${modalExercise.index}`]} 
            />
        )}

        {selectedHistorySession && (
            <SessionHistoryDetail 
                session={selectedHistorySession} 
                exercisesLog={exercisesLog} 
                onClose={() => setSelectedHistorySession(null)} 
            />
        )}

        {lastCompletedData && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 animate-bounce">
                        <Award size={40} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-2">Séance Terminée !</h3>
                    <p className="text-slate-500 mb-6">Bravo, vous avez validé une étape clé de votre progression.</p>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <div className="text-xs font-bold text-slate-400 uppercase">Temps</div>
                            <div className="text-xl font-black text-slate-800">{formatStopwatch(lastCompletedData.duration)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs font-bold text-slate-400 uppercase">Calories (Est.)</div>
                            <div className="text-xl font-black text-slate-800">{Math.floor(lastCompletedData.duration / 60 * 10)}</div>
                        </div>
                        {lastCompletedData.session.distance && (
                            <div className="col-span-2 text-center mt-2 border-t border-slate-100 pt-2">
                                <div className="text-xs font-bold text-slate-400 uppercase">Distance Réalisée</div>
                                <div className="text-xl font-black text-indigo-600">{lastCompletedData.session.distance}</div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        <button 
                            onClick={() => {
                                downloadTCX(lastCompletedData.session, lastCompletedData.duration, lastCompletedData.date, exercisesLog, lastCompletedData.route);
                                setTimeout(() => {
                                    window.open('https://www.strava.com/upload/select', '_blank');
                                }, 1000);
                            }} 
                            className="w-full py-4 bg-[#fc4c02] text-white font-bold rounded-xl hover:bg-[#e34402] transition shadow-lg flex items-center justify-center gap-2"
                        >
                            <UploadCloud size={20}/> Publier sur Strava
                        </button>
                        <div className="text-[10px] text-slate-400 text-center -mt-2 mb-2">Le fichier .tcx sera téléchargé, importez-le sur la page Strava qui s'ouvrira.</div>

                        <button onClick={() => downloadShareImage(lastCompletedData.session, lastCompletedData.duration, lastCompletedData.date)} className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition shadow-lg flex items-center justify-center gap-2"><Camera size={20}/> Télécharger le Visuel (Image)</button>
                        <button onClick={() => setLastCompletedData(null)} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition">Fermer</button>
                    </div>
                </div>
            </div>
        )}

        {catalogSessionId && <ExerciseCatalog onClose={() => setCatalogSessionId(null)} onSelect={(ex: any) => handleAddExercise(ex)} />}

        {step === 'input' ? (
          <div className="-mt-16 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-10 space-y-8 animate-in slide-in-from-bottom-12 duration-500">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Award className="text-indigo-600"/> Objectif Principal
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['5k', '10k', '21k', '42k', 'hyrox'].map((type) => (
                    <button 
                        key={type}
                        onClick={() => handleDistanceSelect(type)}
                        className={`py-3 px-2 rounded-xl text-sm font-black transition-all ${userData.targetDistance === type 
                            ? type === 'hyrox' ? 'bg-yellow-400 text-yellow-900 shadow-lg scale-105 ring-2 ring-yellow-200' : 'bg-indigo-600 text-white shadow-lg scale-105 ring-2 ring-indigo-200' 
                            : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                    >
                        {type === 'hyrox' ? 'HYROX' : type.toUpperCase()}
                    </button>
                ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase">
                    {userData.targetDistance === 'hyrox' ? "Temps Cible Hyrox" : `Chrono ${userData.targetDistance.toUpperCase()}`}
                </label>
                <div className="bg-slate-50 p-2 rounded-xl border-2 border-transparent focus-within:border-indigo-100 transition space-y-3">
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleTimeChange(-1)} className="p-4 bg-white rounded-lg shadow-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition active:scale-95"><Minus size={20} /></button>
                        <div className="flex-1 text-center relative">
                            <div className="w-full bg-transparent text-center font-black text-3xl text-indigo-600 p-2">
                                {formatGoalTime(userData.goalTime)}
                            </div>
                            <Target className="absolute top-1/2 -translate-y-1/2 right-2 text-indigo-100 opacity-50 pointer-events-none" size={40} />
                        </div>
                        <button onClick={() => handleTimeChange(1)} className="p-4 bg-white rounded-lg shadow-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition active:scale-95"><Plus size={20} /></button>
                    </div>
                   
                    <div className="px-2 pb-1">
                        <input 
                            type="range" 
                            min={timeConstraints.min} 
                            max={timeConstraints.max} 
                            step={timeConstraints.step}
                            value={userData.goalTime}
                            onChange={(e) => setUserData({...userData, goalTime: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-bold uppercase">
                            <span>{formatGoalTime(timeConstraints.min)}</span>
                            <span className="text-indigo-400">Glisser pour ajuster</span>
                            <span>{formatGoalTime(timeConstraints.max)}</span>
                        </div>
                    </div>
                </div>
                {userData.targetDistance !== 'hyrox' && (
                    <p className="text-xs text-slate-400 text-center mt-2">Allure cible : {formatPace(userData.goalTime / (userData.targetDistance === '21k' ? 21.1 : userData.targetDistance === '42k' ? 42.195 : parseInt(userData.targetDistance)))}/km</p>
                )}
              </div>

              {/* SECTION ESTIMATION TEMPS ACTUEL */}
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase">Niveau Actuel (Optionnel)</label>
                    <button onClick={toggleCurrentTimeEstimate} className={`text-[10px] font-bold px-2 py-1 rounded transition flex items-center gap-1 ${userData.currentEstimatedTime ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                         {userData.currentEstimatedTime ? "Activé" : "Activer"}
                    </button>
                  </div>
                  
                  {userData.currentEstimatedTime ? (
                     <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100 transition animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleTimeChange(-1, false)} className="p-4 bg-white rounded-lg shadow-sm text-slate-400 hover:text-indigo-600 transition active:scale-95"><Minus size={20} /></button>
                            <div className="flex-1 text-center relative">
                                <div className="w-full bg-transparent text-center font-black text-2xl text-indigo-800 p-2">
                                    {formatGoalTime(userData.currentEstimatedTime)}
                                </div>
                                <span className="text-[9px] text-indigo-400 uppercase font-bold">Estimation {userData.targetDistance}</span>
                            </div>
                            <button onClick={() => handleTimeChange(1, false)} className="p-4 bg-white rounded-lg shadow-sm text-slate-400 hover:text-indigo-600 transition active:scale-95"><Plus size={20} /></button>
                        </div>
                        <p className="text-[10px] text-indigo-600 text-center mt-2 px-2">
                            Le plan débutera à cette allure et progressera vers votre objectif.
                        </p>
                     </div>
                  ) : (
                      <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center h-[124px]">
                          <p className="text-xs text-slate-400 mb-2">Vous ne connaissez pas votre niveau ?</p>
                          <p className="text-[10px] text-slate-300">Le plan commencera automatiquement avec une marge de sécurité de 15%.</p>
                      </div>
                  )}
              </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase">Échéance / Durée</label>
                    <button 
                        onClick={() => setCalculationMode(prev => prev === 'weeks' ? 'date' : 'weeks')}
                        className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-50 px-2 py-1 rounded transition flex items-center gap-1"
                    >
                        {calculationMode === 'weeks' ? 'Passer en Mode Date 📅' : 'Passer en Mode Semaines ⏱️'}
                    </button>
                </div>
                
                {calculationMode === 'weeks' ? (
                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border-2 border-transparent focus-within:border-slate-300 transition">
                        <button onClick={() => setUserData({...userData, durationWeeks: Math.max(4, userData.durationWeeks - 1), raceDate: null})} className="p-4 bg-white rounded-lg shadow-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95"><Minus size={20} /></button>
                        <div className="flex-1 text-center relative">
                            <input type="number" value={userData.durationWeeks} onChange={(e) => setUserData({...userData, durationWeeks: Number(e.target.value), raceDate: null})} className="w-full bg-transparent text-center font-black text-3xl text-slate-700 outline-none p-2"/>
                            <Clock className="absolute top-1/2 -translate-y-1/2 right-2 text-slate-200 opacity-50 pointer-events-none" size={40} />
                        </div>
                        <button onClick={() => setUserData({...userData, durationWeeks: userData.durationWeeks + 1, raceDate: null})} className="p-4 bg-white rounded-lg shadow-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95"><Plus size={20} /></button>
                    </div>
                ) : (
                    <div className="bg-slate-50 p-2 rounded-xl border-2 border-transparent focus-within:border-indigo-100 transition">
                         <div className="flex items-center bg-white rounded-lg shadow-sm">
                            <input 
                                type="date" 
                                value={userData.raceDate || ''}
                                onChange={handleDateSelection}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-transparent text-center font-black text-xl text-slate-700 outline-none p-4"
                            />
                         </div>
                         {calculationMode === 'date' && userData.durationWeeks < 4 && (
                            <div className="text-xs text-rose-500 font-bold mt-2 text-center animate-in fade-in">
                                ⚠️ La préparation est trop courte (Min. 4 semaines).
                            </div>
                         )}
                    </div>
                )}
                
                <p className="text-xs text-slate-400 text-center mt-2">
                    {calculationMode === 'date' && userData.raceDate ? `Objectif dans ${userData.durationWeeks} semaines` : `${userData.durationWeeks} semaines de progression`}
                </p>
              </div>

            {userData.targetDistance === 'hyrox' ? (
                <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 space-y-6">
                    <h3 className="font-bold text-yellow-800 flex items-center gap-2"><Medal size={18}/> Configuration Hyrox</h3>
                    <div className="space-y-3">
                         <label className="text-xs font-bold text-yellow-800 uppercase flex items-center gap-2">Séances HYROX (Mixte)</label>
                         <div className="flex gap-2">
                             {[2,3,4,5].map(n => (
                                 <button key={n} onClick={() => setUserData({...userData, hyroxSessionsPerWeek: n})} className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${userData.hyroxSessionsPerWeek === n ? 'bg-yellow-500 text-white shadow-lg' : 'bg-white border border-yellow-200 text-yellow-700'}`}>{n}</button>
                             ))}
                         </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <label className="text-xs font-bold text-indigo-800 uppercase">Séances Running</label>
                             <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-yellow-200">
                                 <button onClick={() => setUserData({...userData, extraRunSessions: Math.max(0, userData.extraRunSessions - 1)})} className="p-2 bg-indigo-100 rounded-lg text-indigo-700"><Minus size={14}/></button>
                                 <span className="flex-1 text-center font-bold text-indigo-900">{userData.extraRunSessions}</span>
                                 <button onClick={() => setUserData({...userData, extraRunSessions: Math.min(3, userData.extraRunSessions + 1)})} className="p-2 bg-indigo-100 rounded-lg text-indigo-700"><Plus size={14}/></button>
                             </div>
                         </div>
                         <div className="space-y-2">
                             <label className="text-xs font-bold text-rose-800 uppercase">Renfo Pur (+)</label>
                             <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-yellow-200">
                                 <button onClick={() => setUserData({...userData, extraStrengthSessions: Math.max(0, userData.extraStrengthSessions - 1)})} className="p-2 bg-rose-100 rounded-lg text-rose-700"><Minus size={14}/></button>
                                 <span className="flex-1 text-center font-bold text-rose-900">{userData.extraStrengthSessions}</span>
                                 <button onClick={() => setUserData({...userData, extraStrengthSessions: Math.min(3, userData.extraStrengthSessions + 1)})} className="p-2 bg-rose-100 rounded-lg text-rose-700"><Plus size={14}/></button>
                             </div>
                         </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-2"><Footprints size={14}/> Runs / Semaine</label>
                        <div className="flex gap-2">{[2,3,4].map(n => (<button key={n} onClick={() => setUserData({...userData, runDaysPerWeek: n})} className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${userData.runDaysPerWeek === n ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-400 hover:border-indigo-300'}`}>{n}</button>))}</div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-rose-400 uppercase flex items-center gap-2"><Dumbbell size={14}/> Muscu / Semaine</label>
                        <div className="flex gap-2 flex-wrap">{[0,1,2,3,4,5].map(n => (<button key={n} onClick={() => setUserData({...userData, strengthDaysPerWeek: n})} className={`flex-1 py-3 min-w-[30px] rounded-xl text-sm font-bold transition ${userData.strengthDaysPerWeek === n ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white border border-slate-200 text-slate-400 hover:border-rose-300'}`}>{n}</button>))}</div>
                    </div>
                </div>
            )}

            {userData.strengthDaysPerWeek > 0 && userData.targetDistance !== 'hyrox' && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Target size={14}/> Objectif Renforcement</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <button onClick={() => setUserData({...userData, strengthFocus: 'force'})} className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition ${userData.strengthFocus === 'force' ? 'bg-white shadow-md text-rose-600 border border-rose-100' : 'text-slate-400 hover:bg-white/50'}`}><span>Force & Power</span><span className="opacity-70">Lourd • 5 reps</span></button>
                        <button onClick={() => setUserData({...userData, strengthFocus: 'hypertrophy'})} className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition ${userData.strengthFocus === 'hypertrophy' ? 'bg-white shadow-md text-indigo-600 border border-indigo-100' : 'text-slate-400 hover:bg-white/50'}`}><span>Hypertrophie</span><span className="opacity-70">Volume • 10-12 reps</span></button>
                        <button onClick={() => setUserData({...userData, strengthFocus: 'street_workout'})} className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition ${userData.strengthFocus === 'street_workout' ? 'bg-white shadow-md text-amber-600 border border-amber-100' : 'text-slate-400 hover:bg-white/50'}`}><span>Street Workout</span><span className="opacity-70">Poids du corps</span></button>
                        <button onClick={() => setUserData({...userData, strengthFocus: 'home_no_equipment'})} className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition ${userData.strengthFocus === 'home_no_equipment' ? 'bg-white shadow-md text-emerald-600 border border-emerald-100' : 'text-slate-400 hover:bg-white/50'}`}><span>Maison (Sans Matériel)</span><span className="opacity-70">Renfo Simple</span></button>
                        <button onClick={() => setUserData({...userData, strengthFocus: 'reinforcement'})} className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition ${userData.strengthFocus === 'reinforcement' ? 'bg-white shadow-md text-blue-600 border border-blue-100' : 'text-slate-400 hover:bg-white/50'}`}><span>Renfo / PPG</span><span className="opacity-70">Santé / Posture</span></button>
                    </div>
                </div>
            )}

            <button onClick={generatePlan} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-rose-600 rounded-2xl text-white text-xl font-black shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                <Sparkles size={24}/> GÉNÉRER MON PROGRAMME
            </button>
            <div className="flex justify-center items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="hover:text-rose-500 transition flex items-center gap-1"><Trash2 size={12}/> Reset</button>
                <span>•</span>
                <button onClick={() => fileInputRef.current?.click()} className="hover:text-indigo-500 transition flex items-center gap-1"><Upload size={12}/> Restaurer</button>
                <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json"/>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in">
              {activeTab === 'profile' && <ProfileView userData={userData} setUserData={setUserData} stats={stats} />}
              
              {activeTab === 'plan' && (
                  <div className="space-y-6">
                      <div className="flex items-center justify-between px-2">
                        <div className="text-xs font-bold text-slate-400 uppercase">Semaines {plan.length} • Séances {stats?.totalSessions}</div>
                        <div className="flex gap-2">
                             <button onClick={() => setShowInstallGuide(true)} className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm text-xs font-bold flex items-center gap-1 hover:bg-indigo-50 transition"><Smartphone size={14}/> App</button>
                             <button onClick={handleExportData} className="p-2 bg-white text-slate-600 rounded-lg shadow-sm text-xs font-bold flex items-center gap-1 hover:bg-slate-50 transition"><Save size={14}/> Sauvegarder</button>
                        </div>
                      </div>

                      {feedbackMessage && (
                        <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-4 ${feedbackMessage.type === 'warning' ? 'bg-amber-100 text-amber-800' : feedbackMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}>
                            {feedbackMessage.type === 'warning' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>}
                            {feedbackMessage.text}
                        </div>
                      )}
                      
                      {plan.map((week, wIndex) => {
                          const isExpanded = expandedWeek === week.weekNumber;
                          const isPast = expandedWeek !== null && week.weekNumber < expandedWeek;
                          const isFuture = expandedWeek !== null && week.weekNumber > expandedWeek;
                          const completedInWeek = week.sessions.filter((s: any) => completedSessions.has(s.id)).length;
                          const totalInWeek = week.sessions.length;
                          const isFullyDone = completedInWeek === totalInWeek;

                          if (!isExpanded && !isPast && !isFullyDone && expandedWeek !== null) return null; 

                          return (
                            <div key={week.weekNumber} id={`week-${week.weekNumber}`} className={`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-2 ring-indigo-500 shadow-xl scale-[1.02] z-10' : 'opacity-80 hover:opacity-100'}`}>
                                <div 
                                    onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber)}
                                    className={`p-5 flex items-center justify-between cursor-pointer ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${isExpanded ? 'bg-white text-indigo-600' : isFullyDone ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {isFullyDone ? <Check size={20}/> : week.weekNumber}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold ${isExpanded ? 'text-white' : 'text-slate-800'}`}>Semaine {week.weekNumber}</h3>
                                            <div className={`text-xs font-medium uppercase tracking-wider flex items-center gap-2 ${isExpanded ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                <span>{week.focus}</span>
                                                <span>•</span>
                                                <span>{week.volumeLabel}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp size={20}/> : <div className="flex flex-col items-end"><span className="text-xs font-bold">{completedInWeek}/{totalInWeek}</span><div className="w-16 h-1 bg-slate-100 rounded-full mt-1"><div className="h-full bg-green-500 rounded-full" style={{width: `${(completedInWeek/totalInWeek)*100}%`}}></div></div></div>}
                                </div>

                                {isExpanded && (
                                    <div className="divide-y divide-slate-100 animate-in slide-in-from-top-2">
                                        <div className="bg-indigo-50 p-3 flex justify-between items-center text-xs font-bold text-indigo-800">
                                            <div className="flex gap-2">
                                                <button onClick={() => resetWeekOrder(week.weekNumber)} className="flex items-center gap-1 hover:text-indigo-600"><RotateCcw size={12}/> Réinitialiser l'ordre</button>
                                                <button onClick={() => resetWeekProgress(week)} className="flex items-center gap-1 hover:text-indigo-600"><Trash2 size={12}/> Reset progression</button>
                                            </div>
                                            <span>Glisser pour réorganiser (Bientôt)</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                                            {week.schedule.map((day: any, dIdx: number) => {
                                                const isRest = day.activity === 'Repos';
                                                const isSelected = filteredSessionIds === day.sessionIds;
                                                const isSwapSource = swapSelection && swapSelection.weekIdx === week.weekNumber && swapSelection.dayIdx === dIdx;
                                                
                                                return (
                                                    <button 
                                                        key={dIdx} 
                                                        onClick={() => {
                                                            if (swapSelection) handleSwapRequest(week.weekNumber, dIdx);
                                                            else handleDayClick(day.sessionIds);
                                                        }}
                                                        onContextMenu={(e) => { e.preventDefault(); handleSwapRequest(week.weekNumber, dIdx); }}
                                                        className={`py-3 flex flex-col items-center gap-1 transition relative ${isSelected ? 'bg-indigo-100' : ''} ${isSwapSource ? 'bg-amber-100 ring-2 ring-amber-400 z-20' : ''}`}
                                                    >
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{day.day.slice(0,3)}</span>
                                                        <div className={`w-2 h-2 rounded-full ${isRest ? 'bg-slate-300' : day.activity.includes("Run") ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>
                                                        {isSwapSource && <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[8px] px-1 rounded-full animate-bounce">MOVE</div>}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        <div className="p-4 space-y-4">
                                            {week.sessions.map((session: any) => {
                                                const isVisible = !filteredSessionIds || filteredSessionIds.includes(session.id);
                                                if (!isVisible) return null;

                                                const isCompleted = completedSessions.has(session.id);
                                                const isExpandedSession = expandedSession === session.id;
                                                const hasExercises = session.exercises && session.exercises.length > 0;
                                                const totalExercises = hasExercises ? session.exercises.length : 0;
                                                const completedExCount = hasExercises ? session.exercises.filter((_: any, idx: number) => completedExercises.has(`${session.id}-ex-${idx}`)).length : 0;
                                                const progress = hasExercises ? (completedExCount / totalExercises) * 100 : (isCompleted ? 100 : 0);
                                                
                                                return (
                                                    <div key={session.id} className={`border rounded-2xl transition-all duration-300 overflow-hidden ${isCompleted ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'}`}>
                                                        <div className="p-4 flex gap-4">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className={`p-3 rounded-2xl ${session.category === 'run' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                                                                    {session.category === 'run' ? <Footprints size={24}/> : <Dumbbell size={24}/>}
                                                                </div>
                                                                {session.intensity && <WorkoutViz structure={session.structure} intensity={session.intensity} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0" onClick={() => setExpandedSession(isExpandedSession ? null : session.id)}>
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className={`font-black text-lg ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{session.type}</h4>
                                                                            {isCompleted && <CheckCircle size={16} className="text-green-500"/>}
                                                                        </div>
                                                                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                                                                            <span className="flex items-center gap-1"><Clock size={12}/> {session.duration}</span>
                                                                            {session.distance && <span className="flex items-center gap-1"><Move size={12}/> {session.distance}</span>}
                                                                            {session.category === 'run' && session.paceTarget && <span className="flex items-center gap-1 text-indigo-600 font-bold"><Activity size={12}/> {session.paceTarget} /km</span>}
                                                                            <RpeBadge level={session.rpe} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-slate-300">
                                                                        {isExpandedSession ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Progress Bar */}
                                                                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                                                    <div className="h-full bg-green-500 transition-all duration-500" style={{width: `${progress}%`}}></div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isExpandedSession && (
                                                            <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-in slide-in-from-top-2">
                                                                {/* Description & Science */}
                                                                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                                        <h5 className="font-bold text-slate-700 text-xs uppercase mb-1 flex items-center gap-1"><Info size={12}/> Le But</h5>
                                                                        <p className="text-sm text-slate-600 leading-snug">{session.description}</p>
                                                                    </div>
                                                                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 shadow-sm">
                                                                         <h5 className="font-bold text-indigo-700 text-xs uppercase mb-1 flex items-center gap-1"><FlaskConical size={12}/> La Science</h5>
                                                                         <p className="text-sm text-indigo-800 leading-snug">{session.scienceNote}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Start Session Buttons */}
                                                                {!isCompleted && (
                                                                    <div className="flex gap-2 mb-6">
                                                                        {session.category === 'run' && (
                                                                            <button 
                                                                                onClick={() => setShowRunTracker(session.id)}
                                                                                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg"
                                                                            >
                                                                                <Navigation size={18}/> Démarrer GPS
                                                                            </button>
                                                                        )}
                                                                        <button 
                                                                            onClick={() => setActiveTimerSessionId(session.id)}
                                                                            className={`flex-1 py-3 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg ${session.category === 'run' ? 'bg-white text-slate-900 border border-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                                                        >
                                                                            {activeTimerSessionId === session.id ? <Clock className="animate-pulse" size={18}/> : <Play size={18}/>}
                                                                            {activeTimerSessionId === session.id ? "En cours..." : "Chrono Simple"}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                
                                                                {activeTimerSessionId === session.id && (
                                                                    <LiveSessionTimer onFinish={(duration) => handleTimerFinish(session.id, duration)} timerRef={currentTimerRef} />
                                                                )}

                                                                {/* Exercises List */}
                                                                {hasExercises ? (
                                                                    <div className="space-y-2">
                                                                         <div className="flex justify-between items-center mb-2">
                                                                            <h5 className="font-bold text-slate-800 text-sm uppercase flex items-center gap-2"><ListPlus size={14}/> Exercices</h5>
                                                                            <button onClick={() => setCatalogSessionId(session.id)} className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center gap-1"><Plus size={10}/> Ajouter</button>
                                                                         </div>
                                                                        {session.exercises.map((ex: any, exIdx: number) => {
                                                                            const uniqueExId = `${session.id}-ex-${exIdx}`;
                                                                            const isExCompleted = completedExercises.has(uniqueExId);
                                                                            const isSwapSource = exerciseSwapSelection && exerciseSwapSelection.sessionId === session.id && exerciseSwapSelection.exIdx === exIdx;

                                                                            return (
                                                                                <div 
                                                                                    key={exIdx} 
                                                                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all group ${isExCompleted ? 'bg-green-50 border-green-200 opacity-60' : 'bg-white border-slate-200 hover:border-indigo-300'} ${isSwapSource ? 'ring-2 ring-amber-400 bg-amber-50' : ''}`}
                                                                                    onContextMenu={(e) => { e.preventDefault(); handleExerciseSwapRequest(week.weekNumber, session.id, exIdx); }}
                                                                                >
                                                                                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setModalExercise({data: ex, id: session.id, category: session.category, index: exIdx})}>
                                                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${isExCompleted ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                                            {isExCompleted ? <Check size={16}/> : exIdx + 1}
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="font-bold text-slate-800 text-sm">{ex.name}</div>
                                                                                            <div className="text-xs text-slate-500 font-medium">{ex.sets} x {ex.reps} • RPE {ex.rpe}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        <button onClick={() => handleExerciseSwapRequest(week.weekNumber, session.id, exIdx)} className="p-2 bg-slate-50 text-slate-400 hover:text-amber-500 rounded-lg"><ArrowRightLeft size={14}/></button>
                                                                                        <button onClick={() => handleDeleteExercise(week.weekNumber, session.id, exIdx)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg"><Trash2 size={14}/></button>
                                                                                    </div>

                                                                                    <button 
                                                                                        onClick={() => {
                                                                                            setModalExercise({data: ex, id: session.id, category: session.category, index: exIdx});
                                                                                        }}
                                                                                        className={`ml-2 p-2 rounded-full ${isExCompleted ? 'text-green-600 bg-green-100' : 'text-slate-300 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600'}`}
                                                                                    >
                                                                                        <Play size={16} fill="currentColor"/>
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                     <div className="text-center py-4 text-slate-400 text-xs italic bg-white rounded-xl border border-dashed border-slate-200">
                                                                        Pas d'exercices détaillés pour cette séance.
                                                                     </div>
                                                                )}
                                                                
                                                                <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                                                                    <button 
                                                                        onClick={() => setSelectedHistorySession(session)} 
                                                                        className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                                                                    >
                                                                        <History size={14}/> Historique & Export
                                                                    </button>
                                                                    {isCompleted ? (
                                                                         <button onClick={() => unvalidateSession(session.id)} className="text-xs font-bold text-rose-400 hover:text-rose-600 underline">Annuler validation</button>
                                                                    ) : (
                                                                         <button onClick={() => handleSessionCompleteFromModal(session.id)} className="text-xs font-bold text-slate-400 hover:text-green-600">Marquer comme fait sans détails</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        <div className="bg-slate-50 p-4 border-t border-slate-100">
                                            <p className="text-center text-xs font-bold text-slate-500 mb-3">Comment avez-vous trouvé cette semaine ?</p>
                                            <div className="flex justify-center gap-4">
                                                <button onClick={() => adaptDifficulty(week.weekNumber, 'easier')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition shadow-sm flex items-center gap-2"><ThumbsDown size={14}/> Trop dur</button>
                                                <button onClick={() => adaptDifficulty(week.weekNumber, 'keep')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">Parfait, on continue !</button>
                                                <button onClick={() => adaptDifficulty(week.weekNumber, 'harder')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-sm flex items-center gap-2"><Flame size={14}/> Trop facile</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                          );
                      })}
                      
                      <div className="p-8 text-center text-slate-400">
                           <div className="w-16 h-1 bg-slate-200 rounded-full mx-auto mb-4"></div>
                           <p className="text-xs italic">La régularité bat l'intensité. Continuez.</p>
                      </div>
                  </div>
              )}
              
              {activeTab === 'stats' && (
                  <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Progression" value={stats?.progress} unit="%" icon={Award} color="bg-indigo-500" />
                        <StatCard label="Volume Total" value={stats?.totalKm} unit="km" icon={Ruler} color="bg-rose-500" />
                        <StatCard label="Séances" value={stats?.sessionsDone} unit={`/ ${stats?.totalSessions}`} icon={CheckCircle} color="bg-emerald-500" />
                        <StatCard label="Fitness" value={Math.round(20 + (stats?.progress || 0) * 0.5)} unit="pts" icon={Activity} color="bg-blue-500" />
                      </div>
                      
                      <InteractiveInterference />
                      <PolarizationChart low={stats?.intensityBuckets.low || 0} high={stats?.intensityBuckets.high || 0} />
                      
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                          <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-500"/> Charge & Fitness (Banister)</h4>
                          <BanisterChart duration={userData.durationWeeks} />
                          <p className="text-[10px] text-slate-400 mt-3 italic text-center">Modèle impulsionnel théorique basé sur la durée du plan.</p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                           <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Flame size={18} className="text-purple-500"/> Charge d'Entraînement (TRIMP)</h4>
                           <TrimpChart plannedData={stats?.weeklyVolume || []} realizedData={stats?.realizedWeeklyVolume || []} />
                      </div>
                  </div>
              )}

              {activeTab === 'nutrition' && (
                  <NutritionView 
                      userData={userData} 
                      setUserData={setUserData} 
                      nutritionLog={nutritionLog} 
                      setNutritionLog={setNutritionLog} 
                  />
              )}
          </div>
        )}
      </main>
      </div>
    </div>
  );
}