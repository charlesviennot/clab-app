
export const parseRestTime = (restStr: string | number): number => {
    if (!restStr || restStr === '-' || restStr === '0') return 0;
    if (typeof restStr === 'string' && restStr.includes('min')) {
        const minutes = parseInt(restStr.replace(/\D/g, ''));
        return isNaN(minutes) ? 60 : minutes * 60;
    }
    if (typeof restStr === 'string' && restStr.includes('s')) {
         const seconds = parseInt(restStr.replace(/\D/g, ''));
         return isNaN(seconds) ? 30 : seconds;
    }
    const val = typeof restStr === 'string' ? parseInt(restStr) : restStr;
    if (!isNaN(val)) {
        return val > 10 ? val : val * 60;
    }
    return 60; 
};

export const formatPace = (val: number): string => {
    if (!val || val === Infinity || isNaN(val)) return "-:--";
    const min = Math.floor(val);
    const sec = Math.round((val - min) * 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

export const formatGoalTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    const s = Math.round((minutes - Math.floor(minutes)) * 60);
    
    if (h > 0) {
        return `${h}h ${m.toString().padStart(2, '0')}${s > 0 ? ':' + s.toString().padStart(2, '0') : ''}`;
    }
    return `${m}m ${s > 0 ? s.toString().padStart(2, '0') : ''}`;
};

export const calcDist = (minutes: number, pacePerKm: number): string => {
    if (!pacePerKm || pacePerKm <= 0) return "N/A";
    return (minutes / pacePerKm).toFixed(1) + " km";
};

export const formatStopwatch = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const getMuscleActivation = (type: string) => {
    const active = { chest: false, back: false, shoulders: false, arms: false, abs: false, legs: false, cardio: false };
    const typeLower = type ? type.toLowerCase() : "";
    if (typeLower.includes('run') || typeLower.includes('cardio') || typeLower.includes('endurance') || typeLower.includes('vma') || typeLower.includes('seuil')) { active.legs = true; active.cardio = true; }
    if (typeLower.includes('push') || typeLower.includes('force') || typeLower.includes('pecs') || typeLower.includes('upper') || typeLower.includes('pompes') || typeLower.includes('dips')) { active.chest = true; active.shoulders = true; active.arms = true; }
    if (typeLower.includes('pull') || typeLower.includes('dos') || typeLower.includes('back') || typeLower.includes('tractions') || typeLower.includes('row')) { active.back = true; active.arms = true; }
    if (typeLower.includes('legs') || typeLower.includes('jambes') || typeLower.includes('squat') || typeLower.includes('sled') || typeLower.includes('fentes')) { active.legs = true; }
    if (typeLower.includes('core') || typeLower.includes('abdos') || typeLower.includes('skills') || typeLower.includes('gainage')) { active.abs = true; }
    if (typeLower.includes('hyrox') || typeLower.includes('full') || typeLower.includes('burpees')) { active.legs = true; active.cardio = true; active.shoulders = true; active.abs = true; }
    return active;
};

export const getTimeConstraints = (distance: string) => {
    switch(distance) {
        case '5k': return { min: 15, max: 50, step: 0.5 };
        case '10k': return { min: 25, max: 90, step: 1 };
        case '21k': return { min: 70, max: 160, step: 1 };
        case '42k': return { min: 160, max: 330, step: 1 }; // 2h40 -> 5h30
        case 'hyrox': return { min: 50, max: 130, step: 1 };
        default: return { min: 15, max: 240, step: 1 };
    }
};

export const getPaceForWeek = (week: number, totalWeeks: number, goalTime: number, startPercent: number, difficultyFactor: number, distanceKm: number, currentEstimatedTime: number | null = null) => {
    const racePace = goalTime / distanceKm;
    let startFactor = 1 + (startPercent / 100);
    
    if (currentEstimatedTime && currentEstimatedTime > goalTime) {
        const currentPace = currentEstimatedTime / distanceKm;
        startFactor = currentPace / racePace;
    }

    const progressRatio = (week - 1) / Math.max(1, totalWeeks - 1);
    const currentFactor = startFactor - (progressRatio * (startFactor - 1.0));
    const adjustedFactor = currentFactor * difficultyFactor;
    const currentRacePace = racePace * adjustedFactor;
    
    let easyRatio = 1.35; 
    let thresholdRatio = 1.08;
    let intervalRatio = 0.90;

    if (distanceKm === 5) {
        easyRatio = 1.45; 
        thresholdRatio = 1.15; 
        intervalRatio = 0.95; 
    } else if (distanceKm === 21.1) {
        easyRatio = 1.25;
        thresholdRatio = 1.02; 
        intervalRatio = 0.90;
    } else if (distanceKm > 40) { 
        easyRatio = 1.20; 
        thresholdRatio = 0.96; 
        intervalRatio = 0.88; 
    }

    const valEasy = currentRacePace * easyRatio;
    const valThreshold = currentRacePace * thresholdRatio;
    const valInterval = currentRacePace * intervalRatio;

    const easyLow = formatPace(valEasy);
    const easyHigh = formatPace(valEasy + 0.5);

    return {
      gap: Math.round((currentFactor - 1) * 100),
      race: formatPace(currentRacePace),
      threshold: formatPace(valThreshold),
      interval: formatPace(valInterval),
      easy: formatPace(valEasy),
      easyRange: `${easyLow} - ${easyHigh}`,
      valEasy, valThreshold, valInterval, valRace: currentRacePace
    };
};

export const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d; 
};

// --- NOUVEAU : Chemins SVG Réalistes pour le Corps ---
export const BODY_PATHS = {
    head: "M50 15 C50 10 46 5 41 5 C36 5 32 10 32 15 C32 20 36 25 41 25 C46 25 50 20 50 15 Z",
    neck: "M38 24 L44 24 L44 28 L38 28 Z",
    traps: "M32 28 Q 41 24 50 28 L 54 32 L 28 32 Z", // Trapèzes
    shoulders: "M28 32 C 20 32 18 40 18 45 C 18 50 22 52 26 48 L 28 32 M54 32 C 62 32 64 40 64 45 C 64 50 60 52 56 48 L 54 32", // Deltoïdes
    chest: "M30 32 L52 32 L50 50 C50 55 32 55 32 50 L30 32 M32 50 Q 41 55 50 50", // Pectoraux
    arms: "M18 45 C 15 55 15 65 18 70 C 22 70 24 60 26 48 M64 45 C 67 55 67 65 64 70 C 60 70 58 60 56 48", // Bras (Biceps/Triceps)
    forearms: "M18 70 L 16 90 L 20 90 L 22 70 M64 70 L 66 90 L 62 90 L 60 70",
    abs: "M32 50 L50 50 L48 75 L34 75 Z", // Abdominaux
    legs: "M34 75 L30 115 L40 115 L42 75 M48 75 L52 115 L42 115 L40 75 M30 115 L32 150 L38 150 L40 115 M52 115 L50 150 L44 150 L42 115", // Cuisses et Mollets
    back: "M30 32 L52 32 L54 55 L28 55 Z" // Lats (pour la vue arrière simplifiée ou mix)
};

export const calculateDailyCalories = (userData: any) => {
    if (!userData.weight || !userData.height || !userData.age || !userData.gender) {
        return {
            bmr: 1600,
            maintenance: 2000,
            target: 2000,
            adjustment: 0
        };
    }
        
    let bmr = 0;
    // Mifflin-St Jeor Equation
    if (userData.gender === 'male') {
        bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age + 5;
    } else {
        bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age - 161;
    }
    
    // Activity Factor (NEAT + EAT)
    let activityMultiplier = 1.2; // Sedentary default
    if (userData.dailyActivity === 'light') activityMultiplier = 1.375; // Standing job
    if (userData.dailyActivity === 'active') activityMultiplier = 1.55; // Physical job
    if (userData.dailyActivity === 'very_active') activityMultiplier = 1.725; // Construction/Athlete

    const totalSessions = (userData.runDaysPerWeek || 0) + (userData.strengthDaysPerWeek || 0) + (userData.hyroxSessionsPerWeek || 0);
    if (totalSessions >= 4) activityMultiplier += 0.1;
    if (totalSessions >= 6) activityMultiplier += 0.1; // Bonus for high volume

    const maintenance = Math.round(bmr * activityMultiplier);
    
    // Intensity Adjustment (Aggressiveness)
    // deficitIntensity: 0 to 100 (Percentage)
    let adjustment = 0;
    const intensity = userData.deficitIntensity !== undefined ? userData.deficitIntensity : 50; // Default 50%

    if (userData.nutritionGoal === 'cut') {
        // Range: -200 kcal (0%) to -1000 kcal (100%)
        const minDeficit = -200;
        const maxDeficit = -1000;
        adjustment = Math.round(minDeficit + (intensity / 100) * (maxDeficit - minDeficit));
    } else if (userData.nutritionGoal === 'bulk') {
        // Range: +200 kcal (0%) to +800 kcal (100%)
        const minSurplus = 200;
        const maxSurplus = 800;
        adjustment = Math.round(minSurplus + (intensity / 100) * (maxSurplus - minSurplus));
    }

    return {
        bmr: Math.round(bmr),
        maintenance: maintenance,
        target: maintenance + adjustment,
        adjustment: adjustment
    };
};

export const calculate1RM = (weight: number, reps: number) => {
    // Epley Formula
    if (reps === 1) return weight;
    return Math.round(weight * (1 + (reps / 30)));
};

export const vibrate = (pattern: number | number[] = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export const playBeep = (freq: number = 800, duration: number = 100, type: OscillatorType = 'sine') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    
    // Smooth fade out to avoid clicking
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + (duration/1000));
    
    setTimeout(() => {
        osc.stop();
        ctx.close();
    }, duration);
};

export const getXpLevel = (totalKm: number, sessionsCount: number) => {
    // Score arbitraire : 1km = 5 pts, 1 session = 20 pts
    const score = (totalKm * 5) + (sessionsCount * 20);
    
    const levels = [
        { name: "Novice", limit: 0, color: "text-slate-500", icon: "🌱" },
        { name: "Initié", limit: 200, color: "text-emerald-500", icon: "🌿" },
        { name: "Athlète", limit: 600, color: "text-indigo-500", icon: "🏃" },
        { name: "Élite", limit: 1500, color: "text-rose-500", icon: "🔥" },
        { name: "Machine", limit: 3000, color: "text-amber-500", icon: "🤖" },
        { name: "Légende", limit: 6000, color: "text-purple-500", icon: "👑" }
    ];

    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = 0; i < levels.length; i++) {
        if (score >= levels[i].limit) {
            currentLevel = levels[i];
            nextLevel = levels[i + 1] || { 
                name: "Maître", 
                limit: Math.floor(score * 1.5), 
                color: "text-slate-400", 
                icon: "🏆" 
            }; 
        }
    }

    const progress = Math.min(100, Math.round(((score - currentLevel.limit) / (nextLevel.limit - currentLevel.limit)) * 100));

    return {
        current: currentLevel,
        next: nextLevel,
        score,
        progress
    };
};

export const calculatePlates = (targetWeight: number, barWeight = 20) => {
    if (targetWeight <= barWeight) return [];
    
    const weightPerSide = (targetWeight - barWeight) / 2;
    const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
    const result = [];
    let remaining = weightPerSide;

    for (let p of plates) {
        while (remaining >= p) {
            result.push(p);
            remaining -= p;
        }
    }
    return result;
};

export const calculateHeartRateZones = (maxHr: number, restHr: number) => {
    const reserve = maxHr - restHr;
    if (reserve <= 0) return [];

    const zones = [
        { id: 1, name: "Récupération", minPct: 0.50, maxPct: 0.60, color: "bg-gray-400", desc: "Échauffement, retour au calme." },
        { id: 2, name: "Endurance Fondamentale", minPct: 0.60, maxPct: 0.70, color: "bg-green-500", desc: "Aisance respiratoire totale. Base aérobie." },
        { id: 3, name: "Tempo / Aérobie", minPct: 0.70, maxPct: 0.80, color: "bg-blue-500", desc: "Rythme soutenu. Conversation difficile." },
        { id: 4, name: "Seuil Anaérobie", minPct: 0.80, maxPct: 0.90, color: "bg-orange-500", desc: "Effort intense. Souffle court." },
        { id: 5, name: "Puissance Max (VO2max)", minPct: 0.90, maxPct: 1.00, color: "bg-red-600", desc: "Effort maximal. Sprint final." }
    ];

    return zones.map(z => ({
        ...z,
        minBpm: Math.round(restHr + (reserve * z.minPct)),
        maxBpm: Math.round(restHr + (reserve * z.maxPct))
    }));
};

export const getRandomMotivation = () => {
    const quotes = [
        "La douleur est temporaire, l'abandon est définitif.",
        "Votre seul rival, c'est vous-même hier.",
        "La discipline bat la motivation.",
        "Chaque rep compte. Ne trichez pas.",
        "Le succès est la somme de petits efforts répétés.",
        "C'est dans l'inconfort que vous grandissez.",
        "Respirez. Concentrez-vous. Exécutez.",
        "Un entraînement médiocre vaut mieux que zéro entraînement.",
        "Soyez plus fort que vos excuses."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
};

export const getNutrientTiming = () => {
    const now = new Date();
    const h = now.getHours();
    
    if (h >= 5 && h < 10) return { label: "Fenêtre Matinale", advice: "Hydratation massive (500ml). Si séance < 1h, entraînement à jeun possible. Sinon, glucides rapides (banane).", icon: "🌅" };
    if (h >= 10 && h < 14) return { label: "Fenêtre Méridienne", advice: "Repas complet 2-3h avant le sport. Visez Protéines + Glucides complexes. Évitez trop de graisses avant l'effort.", icon: "☀️" };
    if (h >= 14 && h < 18) return { label: "Fenêtre Après-midi", advice: "Le meilleur moment pour la performance physique. Caféine ok (max 16h). Snack léger 1h avant (fruit/barre).", icon: "🚀" };
    if (h >= 18 && h < 22) return { label: "Fenêtre Soirée", advice: "Évitez la caféine. Après séance : Repas riche en protéines pour la réparation nocturne. Magnésium recommandé.", icon: "🌙" };
    return { label: "Fenêtre Nocturne", advice: "Le sommeil est votre meilleur anabolisant. Évitez les écrans bleus. Hydratation légère.", icon: "✨" };
};
