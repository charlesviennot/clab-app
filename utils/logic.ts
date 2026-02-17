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

export const downloadShareImage = (session: any, durationSeconds: number, date: Date) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, '#1e293b'); // slate-800
    gradient.addColorStop(1, '#0f172a'); // slate-900
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('C-Lab Performance', 540, 100);

    // Session Type
    ctx.fillStyle = '#818cf8'; // indigo-400
    ctx.font = 'bold 60px sans-serif';
    const title = session.type.length > 20 ? session.type.substring(0, 20) + '...' : session.type;
    ctx.fillText(title, 540, 300);

    // Stats Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(140, 400, 800, 300);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    
    // Duration
    const h = Math.floor(durationSeconds / 3600);
    const m = Math.floor((durationSeconds % 3600) / 60);
    const s = durationSeconds % 60;
    const timeStr = `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    ctx.fillText('Durée', 340, 500);
    ctx.font = 'bold 80px sans-serif';
    ctx.fillText(timeStr, 340, 600);

    // Calories (Est)
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('Calories', 740, 500);
    ctx.font = 'bold 80px sans-serif';
    ctx.fillText(`${Math.floor(durationSeconds / 60 * 10)}`, 740, 600);

    // Date
    ctx.font = '30px sans-serif';
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.fillText(new Date(date).toLocaleDateString(), 540, 800);

    // Download
    const link = document.createElement('a');
    link.download = `clab-share-${session.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
};