
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