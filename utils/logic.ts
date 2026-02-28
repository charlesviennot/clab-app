import { formatStopwatch, getMuscleActivation, BODY_PATHS } from './helpers';

export const getRecommendedSchedule = (sessions: any[], isHyrox = false) => {
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
    
    const blob = new Blob([tcx], { type: 'application/vnd.garmin.tcx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clab-session-${session.id}.tcx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

import { getMuscleActivation } from './helpers';

export const downloadShareImage = async (session: any, durationSeconds: number, date: Date) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 4:5 aspect ratio for Instagram/Strava
    canvas.width = 1080;
    canvas.height = 1350;

    // Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, '#0f172a'); // slate-900
    gradient.addColorStop(1, '#020617'); // slate-950
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1350);

    // Grid pattern for technical look
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 1080; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1350); ctx.stroke();
    }
    for (let i = 0; i < 1350; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke();
    }

    // Header
    ctx.fillStyle = '#818cf8'; // indigo-400
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('C-LAB PERFORMANCE', 80, 100);

    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }), 1000, 100);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    const title = session.name || session.type || 'Séance de Musculation';
    ctx.fillText(title.toUpperCase(), 540, 220);

    // Calculate Stats
    let totalVolume = 0;
    let totalSets = 0;
    if (session.exercises) {
        session.exercises.forEach((ex: any) => {
            const sets = parseInt(ex.sets) || 0;
            const reps = parseInt(ex.reps) || 0;
            const weight = parseFloat(ex.weight) || 0;
            totalSets += sets;
            totalVolume += sets * reps * weight;
        });
    }

    // Stats Row
    const drawStat = (label: string, value: string, x: number) => {
        ctx.fillStyle = '#475569'; // slate-600
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label.toUpperCase(), x, 320);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 56px sans-serif';
        ctx.fillText(value, x, 390);
    };

    const h = Math.floor(durationSeconds / 3600);
    const m = Math.floor((durationSeconds % 3600) / 60);
    const timeStr = h > 0 ? `${h}h ${m}m` : `${m} min`;

    drawStat('Temps', timeStr, 270);
    drawStat('Volume', totalVolume > 0 ? `${totalVolume} kg` : '-', 540);
    drawStat('Séries', totalSets > 0 ? `${totalSets}` : '-', 810);

    // Draw Muscle Heatmap
    const active = getMuscleActivation(session.type);
    const primaryColor = "#f43f5e"; // rose-500
    const secondaryColor = "#fb923c"; // orange-400
    const inactiveColor = "#1e293b"; // slate-800

    ctx.save();
    ctx.translate(540 - 250, 480); // Center the body
    ctx.scale(5, 5); // Scale up 5x (100x200 -> 500x1000)

    // Helper to draw with glow
    const drawPart = (color: string, isGlow: boolean, drawFn: () => void) => {
        ctx.fillStyle = color;
        if (isGlow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
        } else {
            ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        drawFn();
        ctx.fill();
    };

    // Head
    drawPart(inactiveColor, false, () => { ctx.arc(50, 15, 10, 0, Math.PI*2); });
    
    // Chest
    drawPart(active.chest ? primaryColor : inactiveColor, active.chest, () => {
        ctx.moveTo(35, 30); ctx.lineTo(65, 30); ctx.lineTo(65, 60); ctx.lineTo(35, 60);
    });
    
    // Shoulders
    drawPart(active.shoulders ? primaryColor : inactiveColor, active.shoulders, () => {
        ctx.arc(25, 35, 8, 0, Math.PI*2);
        ctx.arc(75, 35, 8, 0, Math.PI*2);
    });
    
    // Arms
    drawPart(active.arms ? secondaryColor : inactiveColor, active.arms, () => {
        if (ctx.roundRect) {
            ctx.roundRect(15, 45, 10, 40, 5);
            ctx.roundRect(75, 45, 10, 40, 5);
        } else {
            ctx.rect(15, 45, 10, 40); ctx.rect(75, 45, 10, 40);
        }
    });
    
    // Abs
    drawPart(active.abs ? primaryColor : inactiveColor, active.abs, () => {
        if (ctx.roundRect) ctx.roundRect(40, 62, 20, 30, 2);
        else ctx.rect(40, 62, 20, 30);
    });
    
    // Legs (Thighs)
    drawPart(active.legs ? primaryColor : inactiveColor, active.legs, () => {
        if (ctx.roundRect) {
            ctx.roundRect(35, 95, 12, 50, 4);
            ctx.roundRect(53, 95, 12, 50, 4);
        } else {
            ctx.rect(35, 95, 12, 50); ctx.rect(53, 95, 12, 50);
        }
    });
    
    // Calves
    drawPart(active.legs ? secondaryColor : inactiveColor, active.legs, () => {
        if (ctx.roundRect) {
            ctx.roundRect(37, 150, 8, 35, 3);
            ctx.roundRect(55, 150, 8, 35, 3);
        } else {
            ctx.rect(37, 150, 8, 35); ctx.rect(55, 150, 8, 35);
        }
    });

    ctx.restore();

    // Footer
    ctx.fillStyle = '#334155'; // slate-700
    ctx.fillRect(0, 1250, 1080, 100);
    
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Généré par C-Lab Performance', 540, 1310);

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