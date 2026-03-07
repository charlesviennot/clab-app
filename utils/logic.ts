import { formatStopwatch, getMuscleActivation, BODY_PATHS } from './helpers';

export const getRecommendedSchedule = (sessions: any[], isHyrox = false, targetDistance = '') => {
    const scheduleData = Array(7).fill(null).map((_, i) => ({
        dayName: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"][i],
        sessions: [] as any[],
        focus: ""
    }));

    if (isHyrox) {
        // --- LOGIQUE HYROX ---
        const hyroxSessions = sessions.filter(s => s.category === 'hyrox');
        const strengthSessions = sessions.filter(s => s.category === 'strength');
        const runSessions = sessions.filter(s => s.category === 'run');

        const hyroxDays = [1, 3, 5, 0, 2, 4, 6]; 
        hyroxSessions.forEach((s, i) => {
            const day = hyroxDays[i % 7];
            scheduleData[day].sessions.push(s);
            scheduleData[day].focus = "HYROX WOD";
        });

        const strengthDays = [0, 4, 2, 6, 1, 3, 5];
        let strIdx = 0;
        strengthDays.forEach(day => {
            if (strIdx < strengthSessions.length && scheduleData[day].sessions.length === 0) {
                scheduleData[day].sessions.push(strengthSessions[strIdx]);
                scheduleData[day].focus = "Renfo Pur";
                strIdx++;
            }
        });

        const runDays = [2, 6, 0, 4, 1, 3, 5];
        let runIdx = 0;
        runDays.forEach(day => {
            if (runIdx < runSessions.length) {
                if (scheduleData[day].sessions.length === 0) {
                    scheduleData[day].sessions.push(runSessions[runIdx]);
                    scheduleData[day].focus = "Endurance";
                    runIdx++;
                } 
                else if (scheduleData[day].sessions.length === 1 && scheduleData[day].sessions[0].category === 'strength') {
                    scheduleData[day].sessions.push(runSessions[runIdx]);
                    runIdx++;
                }
            }
        });

    } else if (['hypertrophy', 'health', 'weight_loss', 'hybrid_lifestyle'].includes(targetDistance)) {
        // --- LOGIQUE LIFESTYLE ---
        const strengthSessions = sessions.filter(s => s.category === 'strength');
        const runSessions = sessions.filter(s => s.category === 'run');

        // Distribution logic for any number of sessions
        const distributeSessions = (sSessions: any[], rSessions: any[]) => {
            let sIdx = 0;
            let rIdx = 0;

            // Try to spread strength sessions
            const sDays = [0, 2, 4, 1, 3, 5, 6];
            sDays.forEach(day => {
                if (sIdx < sSessions.length) {
                    scheduleData[day].sessions.push(sSessions[sIdx]);
                    scheduleData[day].focus = sSessions[sIdx].day;
                    sIdx++;
                }
            });

            // Try to spread run sessions, avoiding same day as strength if possible, or combining if necessary
            const rDays = [1, 3, 5, 0, 2, 4, 6];
            rDays.forEach(day => {
                if (rIdx < rSessions.length) {
                    scheduleData[day].sessions.push(rSessions[rIdx]);
                    if (!scheduleData[day].focus) {
                        scheduleData[day].focus = rSessions[rIdx].day;
                    } else {
                        scheduleData[day].focus += " + " + rSessions[rIdx].day;
                    }
                    rIdx++;
                }
            });

            // If there are still sessions left (e.g., > 7 total sessions of one type), distribute them evenly
            while (sIdx < sSessions.length) {
                const day = sIdx % 7;
                scheduleData[day].sessions.push(sSessions[sIdx]);
                scheduleData[day].focus += " + " + sSessions[sIdx].day;
                sIdx++;
            }
            while (rIdx < rSessions.length) {
                const day = rIdx % 7;
                scheduleData[day].sessions.push(rSessions[rIdx]);
                scheduleData[day].focus += " + " + rSessions[rIdx].day;
                rIdx++;
            }
        };

        distributeSessions(strengthSessions, runSessions);

    } else {
        // --- LOGIQUE RUNNING CLASSIQUE ---
        const runs = sessions.filter(s => s.category === 'run');
        const gyms = sessions.filter(s => s.category === 'strength');

        const longRun = runs.find(r => r.type.includes("Sortie Longue") || r.type.includes("Endurance"));
        if (longRun) {
            scheduleData[6].sessions.push(longRun);
            scheduleData[6].focus = "Volume";
        }

        const qualityRun = runs.find(r => (r.intensity === 'high' || r.intensity === 'medium') && r.id !== longRun?.id);
        if (qualityRun) {
            scheduleData[1].sessions.push(qualityRun);
            scheduleData[1].focus = "Intensité";
        }

        const heavySession = gyms.find(g => g.type.includes("Sled") || g.type.includes("Jambes") || g.type.includes("Legs"));
        const otherGyms = gyms.filter(g => g.id !== heavySession?.id);

        if (heavySession) {
            if (scheduleData[4].sessions.length === 0) {
                scheduleData[4].sessions.push(heavySession);
                scheduleData[4].focus = "Force";
            } else if (scheduleData[3].sessions.length === 0) {
                scheduleData[3].sessions.push(heavySession);
                scheduleData[3].focus = "Force";
            }
        }

        let gymIdx = 0;
        const fillOrder = [0, 2, 3, 5]; 
        
        fillOrder.forEach(dayIdx => {
            if (scheduleData[dayIdx].sessions.length === 0 && gymIdx < otherGyms.length) {
                scheduleData[dayIdx].sessions.push(otherGyms[gymIdx]);
                scheduleData[dayIdx].focus = "Renfo"; 
                gymIdx++;
            }
        });

        const easyRuns = runs.filter(r => r.id !== longRun?.id && r.id !== qualityRun?.id);
        let runIdx = 0;
        [3, 5, 0].forEach(dayIdx => {
            if (scheduleData[dayIdx].sessions.length === 0 && runIdx < easyRuns.length) {
                scheduleData[dayIdx].sessions.push(easyRuns[runIdx]);
                scheduleData[dayIdx].focus = "Endurance";
                runIdx++;
            }
        });
    }

    return scheduleData.map(d => ({
        day: d.dayName,
        activity: d.sessions.length > 0 ? d.sessions.map((s: any) => s.type).join(" + ") : "Repos",
        focus: d.focus || "",
        sessionIds: d.sessions.map((s: any) => s.id)
    }));
};

const shareOrDownloadFile = async (content: string, fileName: string, mimeType: string) => {
    try {
        const file = new File([content], fileName, { type: mimeType });
        if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: fileName,
                text: 'Importer la séance'
            });
            return;
        }
    } catch (error: any) {
        console.log('Share failed or cancelled', error);
        if (error.name === 'AbortError') {
            return; // User cancelled the share, don't fallback to download
        }
    }

    // Fallback to traditional download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const downloadTCX = (session: any, durationSeconds: number, date: Date, exercisesLog: any) => {
    const startTime = new Date(date).toISOString();
    const sport = session.category === 'run' ? 'Running' : 'Other';
    const distanceMeters = session.distance ? parseFloat(session.distance.toString().replace(/[^0-9.]/g, '')) * 1000 : 0;
    const calories = Math.floor(durationSeconds / 60 * 10);

    const tcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="${sport}">
      <Id>${startTime}</Id>
      <Lap StartTime="${startTime}">
        <TotalTimeSeconds>${durationSeconds}</TotalTimeSeconds>
        <DistanceMeters>${distanceMeters}</DistanceMeters>
        <Calories>${calories}</Calories>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;
    
    shareOrDownloadFile(tcx, `clab-session-${session.id}.tcx`, 'application/vnd.garmin.tcx+xml');
};

const parseWorkoutSteps = (exercises: any[]) => {
    const steps: any[] = [];
    exercises.forEach(ex => {
        let repeats = 1;
        let isInterval = false;
        
        if (typeof ex.sets === 'string' && ex.sets.includes('x')) {
            repeats = parseInt(ex.sets) || 1;
            isInterval = true;
        }
        
        if (isInterval) {
            const parts = (ex.reps || '').split('/');
            if (parts.length >= 2) {
                const onPart = parts[0];
                const offPart = parts[1];
                
                const parseDuration = (str: string) => {
                    if (str.includes('min')) return (parseFloat(str) || 1) * 60;
                    if (str.includes('s') || str.includes('sec')) return parseFloat(str) || 30;
                    return 60;
                };
                
                steps.push({
                    type: 'IntervalsT',
                    Repeat: repeats,
                    OnDuration: parseDuration(onPart),
                    OffDuration: parseDuration(offPart),
                    OnPower: 1.05,
                    OffPower: 0.5,
                    pace: 1
                });
            } else {
                steps.push({
                    type: 'SteadyState',
                    Duration: 60 * repeats,
                    Power: 0.85,
                    pace: 1
                });
            }
        } else {
            let duration = 600;
            if (typeof ex.sets === 'string') {
                if (ex.sets.includes('min')) duration = (parseFloat(ex.sets) || 10) * 60;
                else if (ex.sets.includes('km')) duration = (parseFloat(ex.sets) || 1) * 360;
            }
            
            let power = 0.75;
            if (ex.reps && typeof ex.reps === 'string') {
                if (ex.reps.includes('Z1')) power = 0.5;
                if (ex.reps.includes('Z2')) power = 0.65;
                if (ex.reps.includes('Z3')) power = 0.8;
                if (ex.reps.includes('Z4')) power = 0.95;
                if (ex.reps.includes('Z5')) power = 1.1;
                if (ex.reps.toLowerCase().includes('allure marathon')) power = 0.85;
                if (ex.reps.toLowerCase().includes('allure semi')) power = 0.90;
                if (ex.reps.toLowerCase().includes('allure 10k')) power = 1.0;
            }
            
            if (ex.name.toLowerCase().includes('échauffement') || ex.name.toLowerCase().includes('warmup')) {
                steps.push({ type: 'Warmup', Duration: duration, PowerLow: 0.5, PowerHigh: power, pace: 1 });
            } else if (ex.name.toLowerCase().includes('retour au calme') || ex.name.toLowerCase().includes('cooldown')) {
                steps.push({ type: 'Cooldown', Duration: duration, PowerLow: power, PowerHigh: 0.5, pace: 1 });
            } else {
                steps.push({ type: 'SteadyState', Duration: duration, Power: power, pace: 1 });
            }
        }
    });
    return steps;
};

export const downloadWorkoutZWO = (session: any) => {
    const steps = parseWorkoutSteps(session.exercises || []);
    let workoutXml = '';
    steps.forEach(step => {
        if (step.type === 'IntervalsT') {
            workoutXml += `        <IntervalsT Repeat="${step.Repeat}" OnDuration="${step.OnDuration}" OffDuration="${step.OffDuration}" OnPower="${step.OnPower}" OffPower="${step.OffPower}" pace="${step.pace}"/>\n`;
        } else if (step.type === 'Warmup' || step.type === 'Cooldown') {
            workoutXml += `        <${step.type} Duration="${step.Duration}" PowerLow="${step.PowerLow}" PowerHigh="${step.PowerHigh}" pace="${step.pace}"/>\n`;
        } else {
            workoutXml += `        <SteadyState Duration="${step.Duration}" Power="${step.Power}" pace="${step.pace}"/>\n`;
        }
    });

    const zwo = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
    <author>C-Lab Performance</author>
    <name>${session.name || session.type}</name>
    <description>${session.description || 'Séance de course à pied'}</description>
    <sportType>run</sportType>
    <workout>
${workoutXml}    </workout>
</workout_file>`;

    shareOrDownloadFile(zwo, `clab-workout-${session.id}.zwo`, 'application/xml');
};

export const downloadWorkoutTCX = (session: any) => {
    const steps = parseWorkoutSteps(session.exercises || []);
    let stepsXml = '';
    let stepId = 1;
    
    steps.forEach(step => {
        if (step.type === 'IntervalsT') {
            stepsXml += `
        <Step xsi:type="Repeat_t">
          <StepId>${stepId++}</StepId>
          <Repetitions>${step.Repeat}</Repetitions>
          <Child xsi:type="Step_t">
            <StepId>${stepId++}</StepId>
            <Name>Interval On</Name>
            <Duration xsi:type="Time_t">
              <Seconds>${step.OnDuration}</Seconds>
            </Duration>
            <Intensity>Active</Intensity>
            <Target xsi:type="None_t"/>
          </Child>
          <Child xsi:type="Step_t">
            <StepId>${stepId++}</StepId>
            <Name>Interval Off</Name>
            <Duration xsi:type="Time_t">
              <Seconds>${step.OffDuration}</Seconds>
            </Duration>
            <Intensity>Rest</Intensity>
            <Target xsi:type="None_t"/>
          </Child>
        </Step>`;
        } else {
            const intensity = step.type === 'Cooldown' ? 'Rest' : 'Active';
            stepsXml += `
        <Step xsi:type="Step_t">
          <StepId>${stepId++}</StepId>
          <Name>${step.type}</Name>
          <Duration xsi:type="Time_t">
            <Seconds>${step.Duration}</Seconds>
          </Duration>
          <Intensity>${intensity}</Intensity>
          <Target xsi:type="None_t"/>
        </Step>`;
        }
    });

    const tcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase 
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Workouts>
    <Workout Sport="Running">
      <Name>${(session.name || session.type).substring(0, 15)}</Name>
${stepsXml}
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

    shareOrDownloadFile(tcx, `clab-workout-${session.id}.tcx`, 'application/vnd.garmin.tcx+xml');
};

import { getMuscleActivation } from './helpers';

export const downloadShareImage = async (session: any, durationSeconds: number, date: Date, exercisesLog?: any) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 9:16 aspect ratio for Instagram/TikTok Stories
    canvas.width = 1080;
    canvas.height = 1920;

    // --- 1. Background ---
    const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGradient.addColorStop(0, '#0f172a'); // slate-900
    bgGradient.addColorStop(0.5, '#020617'); // slate-950
    bgGradient.addColorStop(1, '#000000'); // black
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Glowing Orbs for depth
    const drawOrb = (x: number, y: number, r: number, color1: string, color2: string) => {
        const orb = ctx.createRadialGradient(x, y, 0, x, y, r);
        orb.addColorStop(0, color1);
        orb.addColorStop(1, color2);
        ctx.fillStyle = orb;
        ctx.fillRect(0, 0, 1080, 1920);
    };
    drawOrb(200, 300, 800, 'rgba(79, 70, 229, 0.15)', 'rgba(2, 6, 23, 0)'); // Indigo top-left
    drawOrb(900, 1600, 900, 'rgba(225, 29, 72, 0.12)', 'rgba(2, 6, 23, 0)'); // Rose bottom-right

    // Subtle Grid Pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 1080; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1920); ctx.stroke(); }
    for (let i = 0; i < 1920; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke(); }

    // --- 2. Header ---
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('C-LAB PERFORMANCE', 80, 120);

    // Verified Badge
    ctx.fillStyle = '#10b981'; // emerald-500
    if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(80, 140, 180, 36, 18); ctx.fill();
    } else {
        ctx.fillRect(80, 140, 180, 36);
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓ SÉANCE VALIDÉE', 170, 164);

    // Date
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    const dateStr = new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    ctx.fillText(dateStr, 1000, 120);

    // --- 3. Title ---
    const title = session.name || session.type || 'SÉANCE';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 80px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    
    // Word wrap title if too long
    const words = title.toUpperCase().split(' ');
    let line = '';
    let y = 300;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 900 && n > 0) {
            ctx.fillText(line, 80, y);
            line = words[n] + ' ';
            y += 90;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 80, y);

    // --- 4. Calculate Stats ---
    let totalVolume = 0;
    let totalSets = 0;
    const exercisesList: any[] = [];

    if (session.exercises) {
        session.exercises.forEach((ex: any, i: number) => {
            const log = exercisesLog ? exercisesLog[`${session.id}-ex-${i}`] : null;
            let exMaxWeight = 0;
            let exSets = 0;
            if (log && log.sets && log.sets.length > 0) {
                log.sets.forEach((s: any) => {
                    totalSets += 1;
                    exSets += 1;
                    const w = parseFloat(s.weight) || 0;
                    if (w > exMaxWeight) exMaxWeight = w;
                    totalVolume += (parseInt(s.reps)||0) * w;
                });
                exercisesList.push({ name: ex.name, sets: exSets, maxWeight: exMaxWeight });
            } else {
                const sets = parseInt(ex.sets) || 0;
                const reps = parseInt(ex.reps) || 0;
                const weight = parseFloat(ex.weight) || 0;
                totalSets += sets;
                totalVolume += sets * reps * weight;
                exercisesList.push({ name: ex.name, sets: sets, maxWeight: weight });
            }
        });
    }

    // --- 5. Bento Box Layout ---
    const drawGlassPanel = (x: number, y: number, w: number, h: number) => {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.4)'; // slate-800/40
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        if (ctx.roundRect) {
            ctx.beginPath(); ctx.roundRect(x, y, w, h, 32); ctx.fill(); ctx.stroke();
        } else {
            ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        }
    };

    const startY = y + 80;

    // Panel 1: Time
    drawGlassPanel(80, startY, 440, 200);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TEMPS', 120, startY + 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 64px system-ui, -apple-system, sans-serif';
    const hTime = Math.floor(durationSeconds / 3600);
    const mTime = Math.floor((durationSeconds % 3600) / 60);
    ctx.fillText(hTime > 0 ? `${hTime}h ${mTime}m` : `${mTime} min`, 120, startY + 140);

    // Panel 2: Volume
    drawGlassPanel(560, startY, 440, 200);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('TONNAGE', 600, startY + 60);
    ctx.fillStyle = '#818cf8'; // indigo-400
    ctx.font = '900 64px system-ui, -apple-system, sans-serif';
    ctx.fillText(totalVolume > 0 ? `${totalVolume.toLocaleString()} kg` : '-', 600, startY + 140);

    // Panel 3: Muscle Heatmap
    drawGlassPanel(80, startY + 240, 440, 440);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('IMPACT MUSCULAIRE', 120, startY + 300);
    
    // Draw Heatmap inside Panel 3
    const active = getMuscleActivation(session.type);
    const primaryColor = "#f43f5e"; // rose-500
    const secondaryColor = "#fb923c"; // orange-400
    const inactiveColor = "#1e293b"; // slate-800

    ctx.save();
    ctx.translate(180, startY + 340); 
    ctx.scale(2.5, 2.5); 
    const drawPart = (color: string, isGlow: boolean, drawFn: () => void) => {
        ctx.fillStyle = color;
        if (isGlow) { ctx.shadowBlur = 10; ctx.shadowColor = color; } else { ctx.shadowBlur = 0; }
        ctx.beginPath(); drawFn(); ctx.fill();
    };
    drawPart(inactiveColor, false, () => { ctx.arc(50, 15, 10, 0, Math.PI*2); }); // Head
    drawPart(active.chest ? primaryColor : inactiveColor, active.chest, () => { ctx.moveTo(35, 30); ctx.lineTo(65, 30); ctx.lineTo(65, 60); ctx.lineTo(35, 60); }); // Chest
    drawPart(active.shoulders ? primaryColor : inactiveColor, active.shoulders, () => { ctx.arc(25, 35, 8, 0, Math.PI*2); ctx.arc(75, 35, 8, 0, Math.PI*2); }); // Shoulders
    drawPart(active.arms ? secondaryColor : inactiveColor, active.arms, () => { if (ctx.roundRect) { ctx.roundRect(15, 45, 10, 40, 5); ctx.roundRect(75, 45, 10, 40, 5); } else { ctx.rect(15, 45, 10, 40); ctx.rect(75, 45, 10, 40); } }); // Arms
    drawPart(active.abs ? primaryColor : inactiveColor, active.abs, () => { if (ctx.roundRect) ctx.roundRect(40, 62, 20, 30, 2); else ctx.rect(40, 62, 20, 30); }); // Abs
    drawPart(active.legs ? primaryColor : inactiveColor, active.legs, () => { if (ctx.roundRect) { ctx.roundRect(35, 95, 12, 50, 4); ctx.roundRect(53, 95, 12, 50, 4); } else { ctx.rect(35, 95, 12, 50); ctx.rect(53, 95, 12, 50); } }); // Thighs
    drawPart(active.legs ? secondaryColor : inactiveColor, active.legs, () => { if (ctx.roundRect) { ctx.roundRect(37, 150, 8, 35, 3); ctx.roundRect(55, 150, 8, 35, 3); } else { ctx.rect(37, 150, 8, 35); ctx.rect(55, 150, 8, 35); } }); // Calves
    ctx.restore();

    // Panel 4: Exercises List
    drawGlassPanel(560, startY + 240, 440, 440);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('EXERCICES', 600, startY + 300);

    let exY = startY + 360;
    const maxExToShow = 6;
    exercisesList.slice(0, maxExToShow).forEach((ex, idx) => {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        // Truncate name if too long
        let name = ex.name;
        if (name.length > 20) name = name.substring(0, 18) + '...';
        ctx.fillText(name, 600, exY);
        
        ctx.fillStyle = '#818cf8';
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${ex.sets}x • ${ex.maxWeight > 0 ? ex.maxWeight+'kg' : '-'}`, 960, exY);
        ctx.textAlign = 'left';
        
        exY += 55;
    });
    if (exercisesList.length > maxExToShow) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 20px system-ui, -apple-system, sans-serif';
        ctx.fillText(`+ ${exercisesList.length - maxExToShow} autres exercices...`, 600, exY);
    }

    // --- 6. Footer ---
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REJOINS L\'ÉLITE', 540, 1780);
    
    ctx.fillStyle = '#818cf8'; // indigo-400
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
    ctx.fillText('c-lab.app', 540, 1840);

    // Export and Share
    canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `clab-session-${session.id}.png`, { type: 'image/png' });
        
        // Try native share first (works on mobile for Strava/Instagram)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Séance C-Lab',
                    text: `Ma séance ${title} sur C-Lab Performance !`
                });
                return;
            } catch (err) {
                console.log("Share cancelled or failed", err);
            }
        }
        
        // Fallback to download
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(blob);
        link.click();
    }, 'image/png');
};