
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
    if (typeLower.includes('push') || typeLower.includes('force') || typeLower.includes('pecs') || typeLower.includes('upper')) { active.chest = true; active.shoulders = true; active.arms = true; }
    if (typeLower.includes('pull') || typeLower.includes('dos') || typeLower.includes('back')) { active.back = true; active.arms = true; }
    if (typeLower.includes('legs') || typeLower.includes('jambes') || typeLower.includes('squat') || typeLower.includes('sled')) { active.legs = true; }
    if (typeLower.includes('core') || typeLower.includes('abdos') || typeLower.includes('skills')) { active.abs = true; }
    if (typeLower.includes('hyrox') || typeLower.includes('full')) { active.legs = true; active.cardio = true; active.shoulders = true; }
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
    // goalTime est en minutes
    const racePace = goalTime / distanceKm;
    
    // Si l'utilisateur a fourni un temps actuel, on l'utilise pour définir le point de départ exact
    // Sinon on utilise le startPercent par défaut (ex: 15% plus lent)
    let startFactor = 1 + (startPercent / 100);
    
    if (currentEstimatedTime && currentEstimatedTime > goalTime) {
        const currentPace = currentEstimatedTime / distanceKm;
        startFactor = currentPace / racePace;
    }

    const progressRatio = (week - 1) / Math.max(1, totalWeeks - 1);
    
    // Interpolation linéaire entre le StartFactor (niveau actuel) et 1.0 (objectif)
    const currentFactor = startFactor - (progressRatio * (startFactor - 1.0));
    
    // On applique le facteur de difficulté global (ajustement utilisateur en cours de plan)
    // difficultyFactor : 1.0 = normal, 1.05 = plus facile (plus lent), 0.95 = plus dur
    const adjustedFactor = currentFactor * difficultyFactor;

    const currentRacePace = racePace * adjustedFactor;
    
    let easyRatio = 1.35; 
    let thresholdRatio = 1.08;
    let intervalRatio = 0.90;

    // Adaptation physio selon la distance
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

// Formule de Haversine pour calculer la distance entre deux coords GPS
export const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Rayon de la terre en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d; // Distance en km
};
