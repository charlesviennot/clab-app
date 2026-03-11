
import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Award, Clock, ChevronDown, ChevronUp, AlertTriangle, ThumbsDown, 
  ArrowLeft, ArrowRight, RotateCcw, Target, Calendar, Minus, Plus, Share, 
  Flame, Move, ArrowRightLeft, Undo2, Trash2, Check, CheckCircle, 
  Info, BarChart3, GraduationCap, ShieldCheck, Layers, FlaskConical,
  Coffee, Smartphone, Medal, Play, Download, Camera, Footprints,
  Sparkles, Dumbbell, History, Utensils, BookOpen, TrendingUp, Activity,
  Ruler, Square, Brain, Timer, Home, HeartPulse, MapPin, Navigation, User, Save, FileJson, Upload
} from 'lucide-react';
import { LOGO_URL, DONATION_URL } from './constants';
import { RUN_PROTOCOLS, STRENGTH_PROTOCOLS } from './data/protocols';
import { calcDist, formatPace, formatGoalTime, formatStopwatch, getTimeConstraints, getPaceForWeek, vibrate, checkAndRefreshStravaToken } from './utils/helpers';
import { getRecommendedSchedule, downloadShareImage, downloadTCX, downloadWorkoutZWO, downloadWorkoutTCX, downloadWorkoutJSON } from './utils/logic';
import { RpeBadge, WorkoutViz, LiveSessionTimer, InteractiveInterference, PolarizationChart, WeeklyVolumeChart, BanisterChart, TrimpChart, InstallGuide, RunTracker, ProfileView, StatCard, AcwrGauge, DailyBriefing } from './components/Visuals';
import { ExerciseCatalog, ExerciseModal, SessionHistoryDetail, DataManagementModal } from './components/Modals';
import { NutritionView } from './components/Nutrition';

export default function App() {
  const defaultUserData = { 
      name: "Athlète", 
      weight: 75, 
      height: 175, 
      age: 30, 
      gender: 'male', 
      goalTime: 50, 
      targetDistance: '10k', 
      currentEstimatedTime: null, 
      runDaysPerWeek: 3, 
      strengthDaysPerWeek: 2, 
      hyroxSessionsPerWeek: 3, 
      extraRunSessions: 0, 
      extraStrengthSessions: 0, 
      strengthFocus: 'hypertrophy', 
      durationWeeks: 10, 
      progressionStart: 15, 
      difficultyFactor: 1.0, 
      raceDate: null, 
      nutritionGoal: 'maintain',
      dailyActivity: 'sedentary', 
      deficitIntensity: 50, // Default 50%
      hapticEnabled: true, // Haptic Feedback
      heartRate: { max: 180, rest: 60 },
      vo2maxHistory: [],
      personalRecords: {
        squat: { val: '', date: '' },
        bench: { val: '', date: '' },
        deadlift: { val: '', date: '' },
        run5k: { val: '', date: '' },
        run10k: { val: '', date: '' }
      }
  };
  
  const loadState = (key: string, defaultValue: any) => {
    if (typeof window === 'undefined') return defaultValue;
    try { const saved = localStorage.getItem('clab_storage'); if (saved) { const parsed = JSON.parse(saved); if (key === 'userData') return { ...defaultValue, ...(parsed[key] || {}) }; if (key === 'completedSessions') return new Set(parsed.completedSessions || []); if (key === 'completedExercises') return new Set(parsed.completedExercises || []); return parsed[key] !== undefined ? parsed[key] : defaultValue; } } catch (e) { console.error(e); } return defaultValue;
  };

  useEffect(() => { const updateIcons = () => { let appleLink: any = document.querySelector("link[rel~='apple-touch-icon']"); if (!appleLink) { appleLink = document.createElement('link'); appleLink.rel = 'apple-touch-icon'; document.head.appendChild(appleLink); } appleLink.href = LOGO_URL; let favLink: any = document.querySelector("link[rel~='icon']"); if (!favLink) { favLink = document.createElement('link'); favLink.rel = 'icon'; document.head.appendChild(favLink); } favLink.href = LOGO_URL; }; updateIcons(); }, []);
  
  const [step, setStep] = useState<string>(() => loadState('step', 'input'));
  const [activeTab, setActiveTab] = useState<string>(() => loadState('activeTab', 'plan'));
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false); // Modal state
  const [userData, setUserData] = useState<any>(() => loadState('userData', defaultUserData));
  const [plan, setPlan] = useState<any[]>(() => loadState('plan', []));
  const [expandedWeek, setExpandedWeek] = useState<number | null>(() => loadState('expandedWeek', 1));
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => (new Date().getDay() + 6) % 7);
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(() => loadState('completedSessions', new Set()));
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(() => loadState('completedExercises', new Set()));
  const [exercisesLog, setExercisesLog] = useState<any>(() => loadState('exercisesLog', {}));
  const [nutritionLog, setNutritionLog] = useState<any>(() => loadState('nutritionLog', {})); 
  const [stravaData, setStravaData] = useState<any>(() => loadState('stravaData', null));
  const [calculationMode, setCalculationMode] = useState('weeks'); 
  const [darkMode, setDarkMode] = useState<boolean>(() => loadState('darkMode', false));
  const [showFoodSearch, setShowFoodSearch] = useState(false);

  // --- STRAVA CALLBACK HANDLING (SPA MODE) ---
  useEffect(() => {
    const handleStravaCallback = async () => {
      if (window.location.pathname === '/auth/callback') {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          alert(`Erreur Strava: ${error}`);
          window.close();
          return;
        }

        if (code) {
          try {
            // Call our new API endpoint
            const response = await fetch('/api/auth/exchange-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code })
            });

            if (response.ok) {
              const data = await response.json();
              // Send message to opener
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'STRAVA_AUTH_SUCCESS', 
                  payload: data 
                }, '*');
                window.close();
              } else {
                // Fallback if not in popup (should not happen with current flow)
                const activitiesResponse = await fetch('/api/strava/activities', {
                    headers: { 'Authorization': `Bearer ${data.accessToken}` }
                });
                const activities = activitiesResponse.ok ? await activitiesResponse.json() : [];

                setStravaData({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    athlete: data.athlete,
                    expiresAt: data.expiresAt,
                    lastSync: new Date().toISOString(),
                    activities: activities
                });
                window.history.replaceState({}, document.title, "/");
                alert(`Compte Strava connecté ! ${activities.length} activités récupérées.`);
              }
            } else {
              const errData = await response.json();
              alert(`Erreur d'échange de token: ${errData.details || 'Inconnue'}`);
              window.close();
            }
          } catch (e) {
            console.error(e);
            alert("Erreur réseau lors de la connexion Strava");
            window.close();
          }
        }
      }
    };

    handleStravaCallback();
  }, []);

  useEffect(() => { const dataToSave = { step, activeTab, userData, plan, expandedWeek, completedSessions: Array.from(completedSessions), completedExercises: Array.from(completedExercises), exercisesLog, nutritionLog, stravaData, darkMode }; localStorage.setItem('clab_storage', JSON.stringify(dataToSave)); }, [step, activeTab, userData, plan, expandedWeek, completedSessions, completedExercises, exercisesLog, nutritionLog, stravaData, darkMode]);

  const [modalExercise, setModalExercise] = useState<any>(null); 
  const [filteredSessionIds, setFilteredSessionIds] = useState<string[] | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<any>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [swapSelection, setSwapSelection] = useState<any>(null);
  const [exerciseSwapSelection, setExerciseSwapSelection] = useState<any>(null);
  const [catalogSessionId, setCatalogSessionId] = useState<string | null>(null);
  const [activeTimerSessionId, setActiveTimerSessionId] = useState<string | null>(null); 
  const [activeGPSId, setActiveGPSId] = useState<string | null>(null);
  const [lastCompletedData, setLastCompletedData] = useState<any>(null); 
  const [selectedHistorySession, setSelectedHistorySession] = useState<any>(null);
  const currentTimerRef = useRef(0);

  // --- NEW: Event Listener for Daily Briefing Navigation ---
  useEffect(() => {
    const handleOpenSession = (e: any) => {
        const { weekNumber, sessionId } = e.detail;
        setActiveTab('plan');
        setStep('result');
        setFilteredSessionIds(null);
        setExpandedWeek(weekNumber);
        // Timeout to allow render
        setTimeout(() => {
            setExpandedSession(sessionId);
            const el = document.getElementById(sessionId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
    };

    window.addEventListener('open-session', handleOpenSession);
    return () => window.removeEventListener('open-session', handleOpenSession);
  }, []);

  const handleDistanceSelect = (dist: string) => { 
      let defaultTime = 50; 
      let defaultDuration = 10; 
      if (dist === '5k') { defaultTime = 25; defaultDuration = 8; } 
      if (dist === '10k') { defaultTime = 50; defaultDuration = 10; } 
      if (dist === '21k') { defaultTime = 105; defaultDuration = 12; } 
      if (dist === '42k') { defaultTime = 240; defaultDuration = 16; } 
      if (dist === 'hyrox') { defaultTime = 90; defaultDuration = 10; } 
      if (dist === 'vo2max') { defaultTime = 50; defaultDuration = 8; } 
      if (dist === 'calories') { defaultTime = 50; defaultDuration = 8; } 
      
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
  
  const stats = useMemo(() => { 
      if (plan.length === 0) return null; 
      let totalSessions = 0, completedCount = 0, totalKm = 0; 
      const weeklyVolume = plan.map(() => 0); 
      const plannedWeeklyVolume = plan.map(() => 0); 
      let plannedIntensityBuckets = { low: 0, high: 0 }; 
      let currentWeekLoad = 0; // ACWR Acute
      let last4WeeksLoad = 0; // ACWR Chronic

      const currentWeekIdx = plan.findIndex(w => !w.sessions.every((s: any) => completedSessions.has(s.id)));
      const activeWeekIndex = currentWeekIdx === -1 ? plan.length - 1 : currentWeekIdx;

      plan.forEach((week, i) => { 
          week.sessions.forEach((session: any) => { 
              plannedWeeklyVolume[i] += session.durationMin; 
              if (session.intensity === 'low') plannedIntensityBuckets.low += session.durationMin; 
              else plannedIntensityBuckets.high += session.durationMin; 
              
              totalSessions++; 
              const isDone = completedSessions.has(session.id); 
              if (isDone) { 
                  completedCount++; 
                  weeklyVolume[i] += session.durationMin; 
                  if (session.category === 'run' && session.distance) { 
                      const km = parseFloat(session.distance); 
                      if(!isNaN(km)) totalKm += km; 
                  } 
              } 
          }); 
      }); 

      // ACWR Calc
      currentWeekLoad = weeklyVolume[activeWeekIndex] || 0;
      const startChronic = Math.max(0, activeWeekIndex - 4);
      let chronicSum = 0;
      for(let j=startChronic; j<activeWeekIndex; j++) {
          chronicSum += weeklyVolume[j];
      }
      const chronicAvg = chronicSum / Math.max(1, activeWeekIndex - startChronic);

      return { 
          progress: totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0, 
          totalKm: totalKm.toFixed(1), 
          sessionsDone: completedCount, 
          totalSessions, 
          intensityBuckets: plannedIntensityBuckets, 
          weeklyVolume: plannedWeeklyVolume, 
          realizedWeeklyVolume: weeklyVolume,
          acwr: { acute: currentWeekLoad, chronic: chronicAvg }
      }; 
  }, [plan, completedSessions]);
  
  const toggleSession = (id: string) => { 
      const newSet = new Set(completedSessions); 
      if (!newSet.has(id)) { 
          newSet.add(id); 
          setCompletedSessions(newSet); 
          if(userData.hapticEnabled) vibrate(50);
      } 
  };
  
  const handleTimerFinish = (sessionId: string, duration: number, dist?: number) => { 
      toggleSession(sessionId); 
      setActiveTimerSessionId(null); 
      setActiveGPSId(null);
      if(currentTimerRef) currentTimerRef.current = 0; 
      let sessionData = null; 
      for (const week of plan) { 
          const s = week.sessions.find((sess: any) => sess.id === sessionId); 
          if (s) { sessionData = s; break; } 
      } 
      if (sessionData) { 
          const completeData = { session: sessionData, duration: duration, date: new Date() };
          if(dist) (completeData.session as any).distance = (dist / 1000).toFixed(2) + " km";
          setLastCompletedData(completeData); 
          if(userData.hapticEnabled) vibrate([100, 50, 100]);
          
          // Trigger confetti
          confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#4f46e5', '#e11d48', '#10b981', '#f59e0b']
          });
      } 
  };

  const unvalidateSession = (id: string) => { const newSet = new Set(completedSessions); if (newSet.has(id)) { newSet.delete(id); setCompletedSessions(newSet); } };
  const toggleExercise = (exerciseUniqueId: string) => { const newSet = new Set(completedExercises); if (newSet.has(exerciseUniqueId)) { newSet.delete(exerciseUniqueId); } else { newSet.add(exerciseUniqueId); } setCompletedExercises(newSet); };
  const handleSessionCompleteFromModal = (sessionId: string, isExercise = false, data: any = null) => { if (isExercise) { toggleExercise(sessionId); if (data) { setExercisesLog((prev: any) => ({...prev, [sessionId]: data})); } } else { if (!completedSessions.has(sessionId)) { toggleSession(sessionId); } } };
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
        let volumeLabel = isAdaptation ? "VOLUME BAS" : isTaper ? "RÉCUPÉRATION" : "CHARGE HAUTE"; 
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
                else if (targetDistance === 'vo2max') { sessionType = (i%2===0) ? "VMA Courte" : "VMA Longue"; sessionExo = (i%2===0) ? RUN_PROTOCOLS.interval_short : RUN_PROTOCOLS.interval_long; }
                else if (targetDistance === 'calories') { sessionType = "Seuil Anaérobie"; sessionExo = RUN_PROTOCOLS.threshold; }
                else { sessionType = (i%2===0) ? "Allure Marathon" : "Seuil"; sessionExo = (i%2===0) ? RUN_PROTOCOLS.long_run : RUN_PROTOCOLS.threshold; } 
                sessions.push({ id: `w${i}-r2`, day: "RUN 2", category: 'run', type: sessionType, structure: 'interval', intensity: 'high', duration: "60 min", durationMin: 60, distance: "Varié", paceTarget: paces.interval, paceGap: paces.gap, rpe: 8, description: `Séance clé pour ${targetDistance}.`, scienceNote: "Développement moteur.", planningAdvice: "Fraîcheur requise.", exercises: sessionExo }); 
            } 
            
            if (userData.runDaysPerWeek >= 3) { 
                let longRunDuration = 60; 
                let longRunType = "Sortie Longue"; 
                if (targetDistance === '21k') { longRunDuration = 80 + (i * 5); if (longRunDuration > 130) longRunDuration = 90; } 
                if (targetDistance === '42k') { if (i % 3 === 0) { longRunDuration = 90; longRunType = "Sortie Longue (Récup)"; } else { longRunDuration = 100 + (i * 10); if (longRunDuration > 180) longRunDuration = 150; } } 
                if (targetDistance === 'vo2max') { longRunDuration = 60; longRunType = "Endurance Fondamentale"; }
                if (targetDistance === 'calories') { longRunDuration = 75 + (i * 5); if (longRunDuration > 120) longRunDuration = 120; longRunType = "Sortie Longue (Fat Burn)"; }
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

  return (
    <div className={darkMode ? 'dark' : ''}>
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex justify-center sm:py-10 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      <div className="w-full max-w-md sm:max-w-3xl bg-slate-50 dark:bg-slate-900 min-h-screen sm:min-h-fit sm:rounded-3xl sm:shadow-2xl overflow-hidden flex flex-col relative transition-colors duration-300">
        
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

      {step === 'result' && !showFoodSearch && (
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
             <div className="hidden sm:flex w-auto bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-md text-xs font-bold transition text-center flex items-center justify-center gap-2 ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><User size={14} className="shrink-0"/> Profil</button>
                    <button onClick={() => setActiveTab('plan')} className={`px-4 py-2 rounded-md text-xs font-bold transition text-center flex items-center justify-center gap-2 ${activeTab === 'plan' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Calendar size={14} className="shrink-0"/> Programme</button>
                    <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-md text-xs font-bold transition text-center flex items-center justify-center gap-2 ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><BarChart3 size={14} className="shrink-0"/> Science</button>
                    <button onClick={() => setActiveTab('nutrition')} className={`px-4 py-2 rounded-md text-xs font-bold transition text-center flex items-center justify-center gap-2 ${activeTab === 'nutrition' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Utensils size={14} className="shrink-0"/> Nutrition</button>
              </div>
            </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 mt-6 flex-1 w-full relative z-20 pb-28 sm:pb-12">
        
        {step === 'result' && (
            <a 
              href={DONATION_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="fixed bottom-24 sm:bottom-6 right-6 z-[60] bg-[#FFDD00] text-black p-4 rounded-full shadow-2xl hover:scale-110 transition-transform animate-bounce group flex items-center justify-center border-4 border-white/50"
              title="Soutenir le projet"
            >
              <Coffee size={24} className="group-hover:rotate-12 transition-transform"/>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping"></div>
            </a>
        )}

        {showInstallGuide && <InstallGuide onClose={() => setShowInstallGuide(false)} />}
        {showDataModal && <DataManagementModal onClose={() => setShowDataModal(false)} />}

        {modalExercise && (
            <ExerciseModal 
                exercise={modalExercise.data} 
                exerciseId={modalExercise.id} 
                category={modalExercise.category} 
                exerciseIndex={modalExercise.index} 
                onClose={() => setModalExercise(null)} 
                onComplete={(uniqueId: string, isExercise: boolean, data: any) => handleSessionCompleteFromModal(uniqueId, isExercise, data)}
                savedData={exercisesLog[`${modalExercise.id}-ex-${modalExercise.index}`]} 
                exercisesLog={exercisesLog}
            />
        )}

        {selectedHistorySession && (
            <SessionHistoryDetail 
                session={selectedHistorySession} 
                exercisesLog={exercisesLog} 
                onClose={() => setSelectedHistorySession(null)} 
            />
        )}

        {lastCompletedData && (() => {
            let totalTonnage = 0;
            if (lastCompletedData.session.exercises) {
                lastCompletedData.session.exercises.forEach((ex: any, idx: number) => {
                    const log = exercisesLog[`${lastCompletedData.session.id}-ex-${idx}`];
                    if (log && log.weights) {
                        log.weights.forEach((w: string, i: number) => {
                            const weight = parseFloat(w) || 0;
                            let reps = 0;
                            if (log.reps && log.reps[i]) {
                                reps = parseFloat(log.reps[i]) || 0;
                            } else {
                                if (typeof ex.reps === 'number') reps = ex.reps;
                                else if (typeof ex.reps === 'string') {
                                    const match = ex.reps.match(/(\d+)/);
                                    if (match) reps = parseInt(match[1]);
                                }
                            }
                            totalTonnage += weight * reps;
                        });
                    }
                });
            }

            return (
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
                            <div className="text-center col-span-2 border-t border-slate-200 pt-4 mt-2">
                                <div className="text-xs font-bold text-slate-400 uppercase">Distance</div>
                                <div className="text-xl font-black text-indigo-600">{lastCompletedData.session.distance}</div>
                            </div>
                        )}
                        {!lastCompletedData.session.distance && totalTonnage > 0 && (
                            <div className="text-center col-span-2 border-t border-slate-200 pt-4 mt-2">
                                <div className="text-xs font-bold text-slate-400 uppercase">Tonnage Total</div>
                                <div className="text-xl font-black text-indigo-600">{totalTonnage.toLocaleString()} kg</div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        {stravaData?.accessToken ? (
                            <button 
                                onClick={async () => {
                                    try {
                                        const validStravaData = await checkAndRefreshStravaToken(stravaData, setStravaData);
                                        const response = await fetch('/api/strava/upload', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${validStravaData.accessToken}`
                                            },
                                            body: JSON.stringify({
                                                name: lastCompletedData.session.name || lastCompletedData.session.type || "Séance C-Lab",
                                                type: "WeightTraining",
                                                start_date_local: new Date().toISOString(),
                                                elapsed_time: lastCompletedData.duration,
                                                description: `🔥 Séance validée sur C-Lab Performance\nL'application d'ingénierie sportive.\n\n📊 Détails de la séance :\n${lastCompletedData.session.exercises?.map((e:any, i:number) => {
                                                    const log = exercisesLog[`${lastCompletedData.session.id}-ex-${i}`];
                                                    if (log && log.weights && log.weights.length > 0) {
                                                        const bestWeight = Math.max(...log.weights.map((w:string)=>parseFloat(w)||0));
                                                        return `- ${e.name} : ${log.weights.length} séries (Max: ${bestWeight}kg)`;
                                                    }
                                                    return `- ${e.name} : ${e.sets}x${e.reps} @ ${e.weight || 0}kg`;
                                                }).join('\n') || ''}`
                                            })
                                        });

                                        if (response.ok) {
                                            alert("Séance envoyée sur Strava avec succès ! 🚀");
                                        } else {
                                            const err = await response.json();
                                            alert(`Erreur Strava : ${typeof err.details === 'object' ? JSON.stringify(err.details) : (err.details || err.error)}`);
                                        }
                                    } catch (e) {
                                        alert("Erreur réseau lors de l'envoi.");
                                    }
                                }}
                                className="w-full py-4 bg-[#FC4C02] text-white font-bold rounded-xl hover:bg-[#E34402] transition shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Upload size={20}/> Envoyer sur Strava
                            </button>
                        ) : (
                            <button onClick={() => downloadTCX(lastCompletedData.session, lastCompletedData.duration, lastCompletedData.date, exercisesLog)} className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition shadow-lg flex items-center justify-center gap-2 active:scale-95">
                                <Download size={20}/> Télécharger fichier Strava (.tcx)
                            </button>
                        )}
                        
                        <button onClick={() => downloadShareImage(lastCompletedData.session, lastCompletedData.duration, lastCompletedData.date, exercisesLog)} className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-2 active:scale-95"><Camera size={20}/> Partager en Image</button>
                        <button onClick={() => setLastCompletedData(null)} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition">Fermer</button>
                    </div>
                </div>
            </div>
            );
        })()}

        {catalogSessionId && <ExerciseCatalog onClose={() => setCatalogSessionId(null)} onSelect={(ex: any) => handleAddExercise(ex)} />}

        {step === 'input' ? (
          <div className="-mt-16 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-10 space-y-8 animate-in slide-in-from-bottom-12 duration-500">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Award className="text-indigo-600"/> Objectif Principal
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['5k', '10k', '21k', '42k', 'hyrox', 'vo2max', 'calories'].map((type) => (
                    <button 
                        key={type}
                        onClick={() => handleDistanceSelect(type)}
                        className={`py-3 px-2 rounded-xl text-sm font-black transition-all ${userData.targetDistance === type 
                            ? type === 'hyrox' ? 'bg-yellow-400 text-yellow-900 shadow-lg scale-105 ring-2 ring-yellow-200' 
                            : type === 'vo2max' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105 ring-2 ring-emerald-200'
                            : type === 'calories' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105 ring-2 ring-orange-200'
                            : 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-lg scale-105 ring-2 ring-indigo-200' 
                            : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                    >
                        {type === 'hyrox' ? 'HYROX' : type === 'vo2max' ? 'VO2 MAX' : type === 'calories' ? 'CALORIES' : type.toUpperCase()}
                    </button>
                ))}
            </div>
            
            {!['vo2max', 'calories'].includes(userData.targetDistance) && (
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
            )}

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
                            <input type="number" inputMode="decimal" pattern="[0-9]*" value={userData.durationWeeks} onChange={(e) => setUserData({...userData, durationWeeks: Number(e.target.value), raceDate: null})} className="w-full bg-transparent text-center font-black text-3xl text-slate-700 outline-none p-2"/>
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
                        <button onClick={() => setUserData({...userData, strengthFocus: 'hypertrophy'})} className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition ${userData.strengthFocus === 'hypertrophy' ? 'bg-white shadow-md text-indigo-600 border border-indigo-100' : 'text-slate-400 hover:bg-white/50'}`}><span>Hypertrophie</span><span className="opacity-70">Volume • 12 reps</span></button>
                        <button onClick={() => setUserData({...userData, strengthFocus: 'street_workout'})} className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition ${userData.strengthFocus === 'street_workout' ? 'bg-white shadow-md text-orange-600 border border-orange-100' : 'text-slate-400 hover:bg-white/50'}`}><span>Street Workout</span><span className="opacity-70">Poids du corps</span></button>
                        <button onClick={() => setUserData({...userData, strengthFocus: 'home_no_equipment'})} className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition ${userData.strengthFocus === 'home_no_equipment' ? 'bg-white shadow-md text-emerald-600 border border-emerald-100' : 'text-slate-400 hover:bg-white/50'}`}><Home size={14} className="mb-0.5"/><span>Maison (Élastiques + PDC)</span></button>
                        <button onClick={() => setUserData({...userData, strengthFocus: 'reinforcement'})} className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition ${userData.strengthFocus === 'reinforcement' ? 'bg-white shadow-md text-cyan-600 border border-cyan-100' : 'text-slate-400 hover:bg-white/50'}`}><HeartPulse size={14} className="mb-0.5"/><span>Renforcement / PPG</span></button>
                    </div>
                </div>
            )}

            <button 
                onClick={generatePlan} 
                disabled={calculationMode === 'date' && (userData.durationWeeks < 4 || userData.durationWeeks > 52)}
                className={`w-full py-5 text-white rounded-2xl font-bold text-lg shadow-xl transition transform active:scale-[0.98] flex items-center justify-center gap-3 ${calculationMode === 'date' && (userData.durationWeeks < 4 || userData.durationWeeks > 52) ? 'bg-slate-400 cursor-not-allowed opacity-75' : 'bg-gradient-to-r from-indigo-600 to-rose-600 hover:shadow-2xl hover:shadow-indigo-200 hover:scale-[1.02]'}`}
            >
                <Sparkles size={20} className={calculationMode === 'date' && (userData.durationWeeks < 4 || userData.durationWeeks > 52) ? 'text-slate-300' : 'text-yellow-400'}/>
                Générer mon Plan
            </button>
          </div>
        ) : activeTab === 'plan' ? (
          <div key="plan" className="space-y-4 animate-tab-enter">
           
            {activeTab === 'plan' && step === 'result' && (
                <>
                    {(() => {
                        const jsDay = new Date().getDay();
                const appDayIndex = (jsDay + 6) % 7;
                const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
                const todayName = dayNames[appDayIndex];
                
                let activeWeek = plan.find((w: any) => !w.sessions.every((s: any) => completedSessions.has(s.id)));
                if (!activeWeek && plan.length > 0) activeWeek = plan[plan.length - 1];
                if (!activeWeek) return null;

                const todaySchedule = activeWeek.schedule[appDayIndex];
                const todaySessionIds = todaySchedule ? todaySchedule.sessionIds : [];
                const todaySessions = activeWeek.sessions.filter((s: any) => todaySessionIds.includes(s.id));
                const mainSession = todaySessions.length > 0 ? todaySessions[0] : null;
                const isRest = !mainSession;
                const isDone = mainSession && completedSessions.has(mainSession.id);

                const isCardio = mainSession && (mainSession.category === 'run' || mainSession.category === 'hyrox');
                const bgClass = isDone 
                    ? "bg-gradient-to-r from-green-600 to-emerald-600" 
                    : isCardio 
                        ? "bg-gradient-to-br from-indigo-600 to-blue-500" 
                        : "bg-gradient-to-br from-rose-600 to-orange-500";

                return (
                    <div className={`${isRest ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : bgClass} rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden animate-in slide-in-from-top-4 transition-all duration-500`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
                                <Calendar size={12}/> {todayName} • Semaine {activeWeek.weekNumber}
                            </div>
                            {isRest ? (
                                <>
                                    <h2 className="text-2xl font-black">Repos & Récupération</h2>
                                    <p className="text-sm opacity-90 mt-1">Profitez-en pour bien manger et dormir.</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-black leading-tight flex items-center gap-2">
                                        {isDone ? "Séance Validée !" : mainSession.type}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-2 text-sm font-medium opacity-90">
                                        <div className="flex items-center gap-1"><Clock size={14}/> {mainSession.duration}</div>
                                        {mainSession.distance && <div className="flex items-center gap-1"><Ruler size={14}/> {mainSession.distance}</div>}
                                    </div>
                                    {!isDone && (
                                        <button 
                                            onClick={() => {
                                                setExpandedWeek(activeWeek.weekNumber);
                                                setSelectedDayIndex(appDayIndex);
                                                setExpandedSession(mainSession.id);
                                                setTimeout(() => {
                                                    document.getElementById(mainSession.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }, 100);
                                            }}
                                            className="mt-4 w-full py-3 bg-white text-slate-900 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg hover:bg-slate-50 transition active:scale-95"
                                        >
                                            <Play size={18} className="fill-slate-900"/> Démarrer la séance
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
            })()}
                    
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Votre Programme</div>
                            <div className="font-black text-slate-800 dark:text-white text-sm">SEMAINES {plan.length} • SÉANCES {stats?.totalSessions || 0}</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowDataModal(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-md hover:bg-indigo-700 transition flex items-center gap-1">
                                <Save size={12}/> Sauvegarder
                            </button>
                        </div>
                    </div>
                </>
            )}

            {userData.difficultyFactor > 1 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in">
                    <AlertTriangle className="text-amber-500 shrink-0" size={20}/>
                    <div>
                        <h4 className="font-bold text-amber-800 text-sm">Mode Adapté Activé</h4>
                        <p className="text-xs text-amber-700 mt-1">Le plan a été ralenti de {Math.round((userData.difficultyFactor - 1)*100)}% suite à votre feedback. Les allures sont plus douces pour favoriser la récupération.</p>
                    </div>
                </div>
            )}
           
            {feedbackMessage && (
                <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${feedbackMessage.type === 'warning' ? 'bg-amber-100 text-amber-800' : feedbackMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}`}>
                    {feedbackMessage.type === 'warning' ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>}
                    {feedbackMessage.text}
                </div>
            )}

            {activeTab === 'plan' && step === 'result' && (
             <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl mb-4 flex items-start gap-3 text-xs text-indigo-800 animate-in fade-in">
                <Move size={16} className="shrink-0 mt-0.5"/>
                <p>
                    <strong>Flexibilité :</strong> Vous pouvez réorganiser votre semaine en cliquant sur les flèches <ArrowRightLeft className="inline w-3 h-3"/> pour échanger deux jours. Même chose pour l'ordre des exercices dans une séance.
                </p>
             </div>
            )}

            {(() => {
                const currentWeek = plan.find((w: any) => w.weekNumber === expandedWeek) || plan[0];
                if (!currentWeek) return null;

                const weekSessions = currentWeek.sessions;
                const completedInWeek = weekSessions.filter((s: any) => completedSessions.has(s.id)).length;
                const weekProgress = Math.round((completedInWeek / weekSessions.length) * 100) || 0;
                const dayNamesShort = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

                const selectedDaySchedule = currentWeek.schedule[selectedDayIndex];
                const selectedSessionIds = selectedDaySchedule ? selectedDaySchedule.sessionIds : [];
                const sessionsToShow = currentWeek.sessions.filter((s: any) => selectedSessionIds.includes(s.id));
                const allSessionsCompleted = weekSessions.every((s: any) => completedSessions.has(s.id));

                return (
                    <div className="space-y-4">
                        {/* Week Navigator */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <button 
                                    onClick={() => {
                                        const prev = plan.find((w: any) => w.weekNumber === currentWeek.weekNumber - 1);
                                        if (prev) setExpandedWeek(prev.weekNumber);
                                    }}
                                    disabled={currentWeek.weekNumber === 1}
                                    className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition"
                                >
                                    <ArrowLeft size={20}/>
                                </button>
                                <div className="text-center">
                                    <h3 className="font-black text-slate-800 dark:text-white">Semaine {currentWeek.weekNumber}</h3>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentWeek.focus}</div>
                                </div>
                                <button 
                                    onClick={() => {
                                        const next = plan.find((w: any) => w.weekNumber === currentWeek.weekNumber + 1);
                                        if (next) setExpandedWeek(next.weekNumber);
                                    }}
                                    disabled={currentWeek.weekNumber === plan.length}
                                    className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition"
                                >
                                    <ArrowRight size={20}/>
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                    <span>Progression</span>
                                    <span>🔥 {completedInWeek}/{weekSessions.length} séances</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${weekProgress}%` }}></div>
                                </div>
                            </div>

                            {/* Days Row */}
                            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                {currentWeek.schedule.map((day: any, i: number) => {
                                    const isSelected = selectedDayIndex === i;
                                    const hasActivity = day.sessionIds.length > 0;
                                    const isDayCompleted = hasActivity && day.sessionIds.every((id: any) => completedSessions.has(id));
                                    
                                    let dotColor = "bg-transparent";
                                    if (hasActivity) {
                                        if (isDayCompleted) dotColor = "bg-green-500";
                                        else {
                                            const s = currentWeek.sessions.find((s:any) => s.id === day.sessionIds[0]);
                                            if (s) {
                                                if (s.intensity === 'high') dotColor = "bg-rose-500";
                                                else if (s.intensity === 'medium') dotColor = "bg-amber-500";
                                                else dotColor = "bg-blue-500";
                                            }
                                        }
                                    }

                                    return (
                                        <button 
                                            key={i}
                                            onClick={() => setSelectedDayIndex(i)}
                                            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                        >
                                            <span className={`text-xs sm:text-sm font-black uppercase ${isSelected ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{dayNamesShort[i]}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sessions for Selected Day */}
                        <div className="space-y-4">
                            {sessionsToShow.length === 0 ? (
                                <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
                                    <Coffee size={32} className="mx-auto text-slate-300 mb-3"/>
                                    <h4 className="font-bold text-slate-600 dark:text-slate-300">Jour de repos</h4>
                                    <p className="text-xs text-slate-400 mt-1">Récupération active ou repos total.</p>
                                </div>
                            ) : (
                                sessionsToShow.map((session: any) => {
                                    const isDone = completedSessions.has(session.id);
                                    const isExpandedSession = expandedSession === session.id;
                                    const completedCount = session.exercises ? session.exercises.filter((_: any, i: number) => completedExercises.has(`${session.id}-ex-${i}`)).length : 0;
                                    const isSessionFullyDone = session.exercises && completedCount === session.exercises.length;
                                    const sessionKey = session.id;

                                    let borderColor = "border-slate-100 dark:border-slate-700";
                                    let iconColor = "text-indigo-500";
                                    if (!isDone) {
                                        if (session.intensity === 'high') { borderColor = "border-rose-200 dark:border-rose-900/50"; iconColor = "text-rose-500"; }
                                        else if (session.intensity === 'medium') { borderColor = "border-amber-200 dark:border-amber-900/50"; iconColor = "text-amber-500"; }
                                        else { borderColor = "border-blue-200 dark:border-blue-900/50"; iconColor = "text-blue-500"; }
                                    }

                                    return (
                                        <div id={session.id} key={sessionKey} className={`rounded-xl border-2 transition-all duration-500 ease-out animate-in slide-in-from-bottom-2 fade-in duration-300 ${
                                            isDone 
                                                ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800 opacity-60' 
                                                : isExpandedSession 
                                                    ? `bg-white dark:bg-slate-800 shadow-2xl scale-[1.02] z-10 relative my-3 ${session.intensity === 'high' ? 'border-rose-500 ring-4 ring-rose-500/10' : session.intensity === 'medium' ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-blue-500 ring-4 ring-blue-500/10'}` 
                                                    : `bg-white dark:bg-slate-800 shadow-sm hover:shadow-md ${borderColor}`
                                        }`}>
                                             
                                            {isExpandedSession && !isDone && (
                                                <div className={`${session.intensity === 'high' ? 'bg-rose-600' : session.intensity === 'medium' ? 'bg-amber-500' : 'bg-blue-600'} text-white text-[10px] font-black uppercase tracking-widest py-1.5 flex items-center justify-center gap-2 rounded-t-lg animate-in slide-in-from-top-1 fade-in duration-300`}>
                                                    <Flame size={12} className="text-yellow-300 fill-yellow-300 animate-pulse"/>
                                                    GO ! MODE GUERRIER ACTIVÉ
                                                    <Flame size={12} className="text-yellow-300 fill-yellow-300 animate-pulse"/>
                                                </div>
                                            )}

                                            <div onClick={() => { if(session.exercises) { setExpandedSession(isExpandedSession ? null : session.id); } else { toggleSession(session.id); } }} className={`cursor-pointer relative ${isExpandedSession && !isDone ? 'p-4' : 'p-3'}`}>
                                                {isDone && (
                                                    <button onClick={(e) => { e.stopPropagation(); unvalidateSession(session.id); }} className="absolute top-2 right-2 text-green-600 hover:text-green-800 bg-white dark:bg-slate-700 p-1 rounded-full shadow-sm z-20" title="Annuler la validation"><Undo2 size={14} /></button>
                                                )}
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-2">
                                                    {isDone ? <CheckCircle size={16} className="text-green-500"/> : session.category === 'run' ? <Footprints size={16} className={iconColor}/> : <Dumbbell size={16} className={iconColor}/>}
                                                    <span className={`font-bold text-xs uppercase ${isDone ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-white'}`}>{session.type}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2"><RpeBadge level={session.rpe} /><WorkoutViz structure={session.structure} intensity={session.intensity}/></div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                            <div className="flex items-center gap-1"><Clock size={12}/> {session.duration}</div>
                                                            {session.category === 'run' && session.distance && (<div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 rounded"><Ruler size={12}/> {session.distance}</div>)}
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{session.description}</p>
                                                        {!isDone && session.planningAdvice && (<div className="flex items-start gap-1.5 mt-1 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg text-[10px] text-amber-800 dark:text-amber-200 border border-amber-100 dark:border-amber-800"><Info size={12} className="shrink-0 mt-0.5"/><span><strong>Conseil :</strong> {session.planningAdvice}</span></div>)}
                                                </div>
                                                {session.category === 'run' && session.paceGap > -1 && (<div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end items-baseline gap-1"><span className="text-[10px] text-slate-400 uppercase font-bold">Cible</span><span className="font-black text-slate-800 dark:text-white text-sm">{session.paceTarget}</span><span className="text-[9px] text-slate-400">min/km</span></div>)}
                                                {session.exercises && !isDone && (<div className="mt-2 text-center text-[10px] text-slate-400 font-medium">{session.category === 'run' ? "Cliquez pour voir la séance ▼" : "Cliquez pour le suivi série ▼"}</div>)}
                                            </div>
                                            {isExpandedSession && session.exercises && !isDone && (
                                                <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 p-3 rounded-b-lg animate-in slide-in-from-top-2">
                                                         
                                                        {/* RUNNING GPS / TIMER LOGIC */}
                                                        {session.category === 'run' && (
                                                            <div className="mb-4 space-y-2">
                                                                {activeTimerSessionId === session.id && !activeGPSId ? (
                                                                    <LiveSessionTimer 
                                                                        timerRef={currentTimerRef}
                                                                        onFinish={(duration) => handleTimerFinish(session.id, duration)} 
                                                                        hapticEnabled={userData.hapticEnabled}
                                                                    />
                                                                ) : activeGPSId === session.id ? (
                                                                    <RunTracker 
                                                                        onFinish={(duration, dist) => handleTimerFinish(session.id, duration, dist)} 
                                                                        targetDistance={session.distance}
                                                                        hapticEnabled={userData.hapticEnabled}
                                                                    />
                                                                ) : (
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => setActiveTimerSessionId(session.id)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-md transition-all active:scale-95">
                                                                                <Play size={16} className="fill-white"/> Chrono Simple
                                                                            </button>
                                                                            <button onClick={() => setActiveGPSId(session.id)} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-md transition-all active:scale-95">
                                                                                <MapPin size={16}/> Mode GPS
                                                                            </button>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => downloadWorkoutZWO(session)} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm transition-all active:scale-95">
                                                                                <Download size={14}/> Zwift (.zwo)
                                                                            </button>
                                                                            <button onClick={() => downloadWorkoutTCX(session)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm transition-all active:scale-95">
                                                                                <Download size={14}/> Garmin (.tcx)
                                                                            </button>
                                                                            <button onClick={() => downloadWorkoutJSON(session)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm transition-all active:scale-95">
                                                                                <Download size={14}/> WOD (.json)
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
        
                                                        {/* STRENGTH TIMER LOGIC */}
                                                        {session.category !== 'run' && (
                                                            activeTimerSessionId === session.id ? (
                                                                <LiveSessionTimer 
                                                                    timerRef={currentTimerRef}
                                                                    onFinish={(duration) => handleTimerFinish(session.id, duration)} 
                                                                    hapticEnabled={userData.hapticEnabled}
                                                                />
                                                            ) : (
                                                                <button onClick={() => setActiveTimerSessionId(session.id)} className="w-full mb-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-md transition-all active:scale-95">
                                                                    <Play size={16} className="fill-white"/> Démarrer le Chrono
                                                                </button>
                                                            )
                                                        )}
        
                                                        <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2">Protocole Scientifique (Cliquer pour info)</h4>
                                                        <div className="space-y-2">
                                                            {session.exercises.map((exo: any, idx: number) => {
                                                                const uniqueExerciseId = `${session.id}-ex-${idx}`;
                                                                const isChecked = completedExercises.has(uniqueExerciseId);
                                                                const isSwapSelected = exerciseSwapSelection && exerciseSwapSelection.sessionId === session.id && exerciseSwapSelection.exIdx === idx;
                                                                return (
                                                                    <div key={idx} className={`bg-white dark:bg-slate-800 p-2 rounded border transition-colors flex items-center gap-3 ${isChecked ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : isSwapSelected ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 animate-pulse' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-slate-700'} ${exerciseSwapSelection && !isSwapSelected ? 'cursor-pointer hover:bg-slate-100' : ''}`} onClick={() => { if (exerciseSwapSelection) handleExerciseSwapRequest(currentWeek.weekNumber, session.id, idx); }}>
                                                                            <div onClick={(e) => { e.stopPropagation(); handleExerciseSwapRequest(currentWeek.weekNumber, session.id, idx); }} className={`p-1 rounded-md transition-colors cursor-pointer ${isSwapSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`} title="Déplacer cet exercice">
                                                                                <ArrowRight size={14} />
                                                                            </div>
                                                                            <div onClick={(e) => { e.stopPropagation(); handleDeleteExercise(currentWeek.weekNumber, session.id, idx); }} className="p-1 rounded-md transition-colors cursor-pointer bg-slate-100 dark:bg-slate-700 text-slate-300 hover:text-rose-500 hover:bg-rose-50" title="Supprimer cet exercice">
                                                                                <Trash2 size={14} />
                                                                            </div>
                                                                            {session.category !== 'run' && (
                                                                            <div onClick={(e) => { e.stopPropagation(); toggleExercise(uniqueExerciseId); }} className="cursor-pointer">
                                                                                {isChecked ? <Check size={20} className="text-green-500" /> : <Square size={20} className="text-slate-300 hover:text-indigo-400" />}
                                                                            </div>
                                                                            )}
                                                                            <div className="flex-1 flex justify-between items-center cursor-help" onClick={() => setModalExercise({data: exo, id: session.id, category: session.category, index: idx})}>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Info size={14} className="text-slate-300"/>
                                                                                    <div className={isChecked ? 'opacity-50' : ''}>
                                                                                        <div className="font-bold text-xs text-slate-800 dark:text-white">{exo.name}</div>
                                                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{exo.sets.toString().includes('min') || exo.sets.toString().includes('bloc') ? exo.sets : `${exo.sets} séries`} • {exo.reps.includes('reps') ? exo.reps : `${exo.reps}`} {exo.rest !== '-' ? `• R: ${exo.rest}` : ''}</div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isChecked ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>RPE {exo.rpe}</div>
                                                                            </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <button onClick={() => setCatalogSessionId(session.id)} className="w-full mt-2 py-2 border border-dashed border-indigo-200 text-indigo-500 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:border-indigo-300 transition flex items-center justify-center gap-1">
                                                            <Plus size={14}/> Ajouter un exercice
                                                        </button>
        
                                                        { (session.category === 'run' || isSessionFullyDone) && (
                                                            <button 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation();
                                                                    if (activeTimerSessionId === session.id) {
                                                                        handleTimerFinish(session.id, currentTimerRef.current);
                                                                    } else {
                                                                        const theoreticalTime = (typeof session.durationMin === 'number' ? session.durationMin : 45) * 60;
                                                                        handleTimerFinish(session.id, theoreticalTime);
                                                                    }
                                                                }} 
                                                                className="mt-3 w-full py-2 bg-green-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1 animate-in fade-in slide-in-from-bottom-2 hover:bg-green-600 transition"
                                                            >
                                                                <CheckCircle size={12} /> {session.category === 'run' ? "Terminer la séance" : "Valider toute la séance"}
                                                            </button>
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        
                        {allSessionsCompleted && (
                            <div className="p-4 border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/30 rounded-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 text-green-800 dark:text-green-300 text-sm font-bold"><Award size={18}/> Semaine Terminée ! Bilan ?</div>
                                <div className="flex gap-2">
                                    <button onClick={() => adaptDifficulty(currentWeek.weekNumber, 'easier')} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white dark:bg-slate-700 border border-green-200 dark:border-green-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition"><ThumbsDown size={14}/> Trop dur</button>
                                    <button onClick={() => adaptDifficulty(currentWeek.weekNumber, 'keep')} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 border border-green-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-green-700 transition"><CheckCircle size={14}/> Parfait</button>
                                    <button onClick={() => adaptDifficulty(currentWeek.weekNumber, 'harder')} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white dark:bg-slate-700 border border-green-200 dark:border-green-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition"><Flame size={14}/> Trop facile</button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
          </div>
        ) : activeTab === 'nutrition' ? (
             <div key="nutrition" className="animate-tab-enter">
                 <NutritionView userData={userData} setUserData={setUserData} nutritionLog={nutritionLog} setNutritionLog={setNutritionLog} showFoodSearch={showFoodSearch} setShowFoodSearch={setShowFoodSearch} setShowDataModal={setShowDataModal} />
             </div>
        ) : activeTab === 'profile' ? (
             <div key="profile" className="animate-tab-enter">
                 <ProfileView userData={userData} setUserData={setUserData} stats={stats} darkMode={darkMode} setDarkMode={setDarkMode} setShowInstallGuide={setShowInstallGuide} stravaData={stravaData} setStravaData={setStravaData} />
             </div>
        ) : (
          <div key="stats" className="space-y-6 animate-tab-enter">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6"><BarChart3 className="text-indigo-600"/> Votre Progression</h3>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"><div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats ? stats.progress : 0}%</div><div className="text-[10px] font-bold text-slate-400 uppercase">Programme</div></div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"><div className="text-2xl font-black text-slate-800 dark:text-white">{stats ? stats.totalKm : 0}</div><div className="text-[10px] font-bold text-slate-400 uppercase">Km Courus</div></div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"><div className="text-2xl font-black text-slate-800 dark:text-white">{stats ? stats.sessionsDone : 0}</div><div className="text-[10px] font-bold text-slate-400 uppercase">Séances</div></div>
              </div>
              <div className="space-y-8">
                <div><h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Respect du modèle Polarisé (80/20)</h4><PolarizationChart low={stats?.intensityBuckets.low || 0} high={stats?.intensityBuckets.high || 0} /></div>
                <div><h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Volume Hebdomadaire (Minutes)</h4><WeeklyVolumeChart plannedData={stats?.weeklyVolume || []} realizedData={stats?.realizedWeeklyVolume || []} /></div>
              </div>
            </div>

            {/* NEW ACWR DASHBOARD */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                <div className="flex items-start gap-3 mb-4">
                    <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-500"><Activity size={20}/></div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Ratio de Charge (ACWR)</h3>
                        <p className="text-xs text-slate-400 mt-1">Prévention des blessures (Aiguë / Chronique).</p>
                    </div>
                </div>
                <div className="flex justify-center mb-4">
                    <AcwrGauge acute={stats?.acwr?.acute || 0} chronic={stats?.acwr?.chronic || 0} />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600 text-center">
                    Le ratio compare votre charge de la semaine actuelle à votre moyenne des 4 dernières semaines. Visez la zone verte (0.8 - 1.3) pour progresser sans vous blesser.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4"><History className="text-indigo-600"/> Historique & Analyse</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {plan.flatMap((week: any) => week.sessions).filter((s: any) => completedSessions.has(s.id)).length > 0 ? (
                        plan.flatMap((week: any) => week.sessions).filter((s: any) => completedSessions.has(s.id)).map((s: any) => (
                            <div key={s.id} onClick={() => setSelectedHistorySession(s)} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 hover:border-indigo-200 cursor-pointer transition">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xs"><CheckCircle size={14}/></div>
                                    <div>
                                        <div className="font-bold text-xs text-slate-700 dark:text-white">{s.type}</div>
                                        <div className="text-[10px] text-slate-400">{s.day} • {s.duration}</div>
                                    </div>
                                </div>
                                <ArrowLeft size={14} className="rotate-180 text-slate-300"/>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-xs text-slate-400 italic py-4">Aucune séance terminée pour le moment.</div>
                    )}
                </div>
            </div>
           
            <button 
                onClick={() => setShowInstallGuide(true)}
                className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-slate-700 transition"
            >
                <Smartphone size={20}/> 📱 Installer sur iPhone
            </button>

            <div className="bg-slate-900 text-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10"><FlaskConical size={80}/></div>
               <div className="relative z-10">
                   <h3 className="text-lg font-bold flex items-center gap-2 mb-2"><GraduationCap size={20} className="text-yellow-400"/> Philosophie C-Lab</h3>
                   <p className="text-xs text-slate-300 leading-relaxed mb-4">
                       Ce programme repose sur l'<strong>entraînement polarisé</strong> (80% volume facile / 20% intensité élevée) et la gestion de l'<strong>interférence</strong> (séparation cardio/muscu) pour maximiser les adaptations physiologiques.
                   </p>
                   <div className="flex gap-4">
                       <InteractiveInterference />
                   </div>
                   <div className="mt-4 pt-4 border-t border-white/10 text-[10px] text-slate-400 flex justify-between">
                       <span>v2.1.0 • Built with Science</span>
                       <button onClick={resetPlan} className="hover:text-white transition flex items-center gap-1"><Trash2 size={10}/> Reset App</button>
                   </div>
               </div>
            </div>
          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation */}
      {step === 'result' && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex justify-around items-center h-16 px-2">
                <button 
                    onClick={() => setActiveTab('profile')} 
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors active:scale-95 ${activeTab === 'profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <User size={20} className={activeTab === 'profile' ? 'fill-indigo-100 dark:fill-indigo-900/50' : ''} />
                    <span className="text-[10px] font-bold">Profil</span>
                </button>
                <button 
                    onClick={() => setActiveTab('plan')} 
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors active:scale-95 ${activeTab === 'plan' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <Calendar size={20} className={activeTab === 'plan' ? 'fill-indigo-100 dark:fill-indigo-900/50' : ''} />
                    <span className="text-[10px] font-bold">Plan</span>
                </button>
                <button 
                    onClick={() => setActiveTab('stats')} 
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors active:scale-95 ${activeTab === 'stats' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <BarChart3 size={20} className={activeTab === 'stats' ? 'fill-indigo-100 dark:fill-indigo-900/50' : ''} />
                    <span className="text-[10px] font-bold">Science</span>
                </button>
                <button 
                    onClick={() => setActiveTab('nutrition')} 
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors active:scale-95 ${activeTab === 'nutrition' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <Utensils size={20} className={activeTab === 'nutrition' ? 'fill-indigo-100 dark:fill-indigo-900/50' : ''} />
                    <span className="text-[10px] font-bold">Nutri</span>
                </button>
            </div>
        </div>
      )}

      </div>
    </div>
    </div>
  );
}
