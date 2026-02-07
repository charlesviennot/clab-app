import { formatStopwatch, getMuscleActivation } from './helpers';

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
        [3, 5, 0, 2].forEach(dayIdx => { 
            if (runIdx < easyRuns.length) {
                if (scheduleData[dayIdx].sessions.length === 0) {
                    scheduleData[dayIdx].sessions.push(easyRuns[runIdx]);
                    scheduleData[dayIdx].focus = "Endurance";
                    runIdx++;
                } 
                else if (scheduleData[dayIdx].sessions.length === 1 && scheduleData[dayIdx].sessions[0].category !== 'run') {
                    const s = scheduleData[dayIdx].sessions[0];
                    if (!s.type.includes("Jambes")) {
                        scheduleData[dayIdx].sessions.push(easyRuns[runIdx]);
                        runIdx++;
                    }
                }
            }
        });
    }

    return scheduleData.map(day => {
        if (day.sessions.length === 0) return { day: day.dayName, activity: "Repos", focus: "Récupération", sessionIds: [] };
        const names = day.sessions.map((s: any) => s.type).join(' + ');
        const ids = day.sessions.map((s: any) => s.id);
        return { 
            day: day.dayName, 
            activity: names, 
            focus: day.focus || "Entraînement", 
            sessionIds: ids 
        };
    });
};

export const downloadShareImage = (session: any, durationSeconds: number, date: Date) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fond
    ctx.fillStyle = '#0f172a'; // Slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Titre
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(session.type.toUpperCase(), canvas.width / 2, 120);

    // Date
    ctx.fillStyle = '#94a3b8'; // Slate-400
    ctx.font = '30px sans-serif';
    ctx.fillText(new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), canvas.width / 2, 180);

    // Stats Box
    ctx.fillStyle = '#1e293b'; // Slate-800
    // @ts-ignore
    ctx.roundRect ? ctx.roundRect(140, 240, 800, 180, 40) : ctx.fillRect(140, 240, 800, 180);
    ctx.fill();

    // Stats Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText(formatStopwatch(durationSeconds), 340, 330);
    ctx.fillText(session.rpe + '/10', 740, 330);
    
    ctx.fillStyle = '#64748b'; // Slate-500
    ctx.font = '24px sans-serif';
    ctx.fillText("DURÉE", 340, 370);
    ctx.fillText("INTENSITÉ (RPE)", 740, 370);

    // Graphique Musculaire (SVG Reconstruit pour Canvas)
    const active = getMuscleActivation(session.type);
    const primary = "#f43f5e"; // Rose
    const secondary = "#fb923c"; // Orange
    const inactive = "#334155"; // Slate-700
    
    const svgString = `
    <svg width="400" height="500" viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="15" r="10" fill="${inactive}" />
        <path d="M35 30 H65 V60 H35 Z" fill="${active.chest ? primary : inactive}" rx="5" />
        <circle cx="25" cy="35" r="8" fill="${active.shoulders ? primary : inactive}" />
        <circle cx="75" cy="35" r="8" fill="${active.shoulders ? primary : inactive}" />
        <rect x="15" y="45" width="10" height="40" rx="5" fill="${active.arms ? secondary : inactive}" />
        <rect x="75" y="45" width="10" height="40" rx="5" fill="${active.arms ? secondary : inactive}" />
        <rect x="40" y="62" width="20" height="30" rx="2" fill="${active.abs ? primary : inactive}" />
        <rect x="35" y="95" width="12" height="50" rx="4" fill="${active.legs ? primary : inactive}" />
        <rect x="53" y="95" width="12" height="50" rx="4" fill="${active.legs ? primary : inactive}" />
        <rect x="37" y="150" width="8" height="35" rx="3" fill="${active.legs ? secondary : inactive}" />
        <rect x="55" y="150" width="8" height="35" rx="3" fill="${active.legs ? secondary : inactive}" />
        ${active.cardio ? `<path d="M56 36 C56 36 58 32 62 32 C66 32 68 36 62 42 L56 46 L50 42 C44 36 46 32 50 32 C54 32 56 36 56 36 Z" fill="${primary}" stroke="white" stroke-width="2"/>` : ''}
    </svg>`;

    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 340, 480, 400, 500);
        
        // Footer Brand
        ctx.fillStyle = '#64748b';
        ctx.font = '24px sans-serif';
        ctx.fillText("Généré par C-Lab Performance", canvas.width/2, 1040);

        // Trigger Download
        const link = document.createElement('a');
        link.download = `clab_visual_${session.type.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
};

export const downloadTCX = (session: any, durationSeconds: number, date: Date, exercisesLog: any) => {
  const startTime = date.toISOString();
  const endTime = new Date(date.getTime() + durationSeconds * 1000).toISOString();
  
  // Estimation calorique : Course ~12kcal/min, Muscu ~8kcal/min
  const kcalPerMin = session.category === 'run' ? 12 : 8;
  const calories = Math.floor((durationSeconds / 60) * kcalPerMin); 
  
  let sport = 'Other';
  if (session.category === 'run') sport = 'Running';
  
  const distanceMeters = session.distance ? parseFloat(session.distance) * 1000 : 0;

  // --- CONSTRUCTION DU RÉSUMÉ FORMAT "HEVY / STRONG" ---
  let notesContent = `🚀 C-Lab Performance\n${session.type}\n${session.description}\n\n`;
  
  if (session.exercises) {
      session.exercises.forEach((ex: any, idx: number) => {
          notesContent += `────────────────────\n`;
          notesContent += `${idx + 1}. ${ex.name.toUpperCase()}\n`;
          
          const uniqueId = `${session.id}-ex-${idx}`;
          const log = exercisesLog[uniqueId];
          const targetReps = ex.reps.replace(' reps', '').replace('/', '-'); // Nettoyage simple

          // Récupération du nombre de séries
          let setsCount = 1;
          if (typeof ex.sets === 'number') setsCount = ex.sets;
          else if (typeof ex.sets === 'string') {
              const match = ex.sets.match(/^(\d+)/);
              if (match) setsCount = parseInt(match[1]);
          }

          // Si on a des logs de poids enregistrés par l'utilisateur
          if (log && log.weights && log.weights.length > 0) {
            log.weights.forEach((w: string, setIdx: number) => {
                // Si le poids est entré, on l'affiche, sinon c'est Poids du corps ou juste reps
                if (w && w !== "") {
                    notesContent += `Set ${setIdx + 1}: ${w}kg × ${targetReps}\n`;
                } else {
                    notesContent += `Set ${setIdx + 1}: ${targetReps}\n`;
                }
            });
            // Si l'utilisateur a fait moins de séries que prévu dans le log (cas rare mais possible)
            if (log.weights.length < setsCount) {
                for (let i = log.weights.length; i < setsCount; i++) {
                        notesContent += `Set ${i + 1}: ${targetReps}\n`;
                }
            }
          } else {
            // Fallback : Si aucun poids n'est saisi, on affiche le format standard pour chaque série
            for(let i=0; i<setsCount; i++) {
                notesContent += `Set ${i + 1}: ${targetReps}\n`;
            }
          }
      });
  }
  
  notesContent += `────────────────────\n`;
  notesContent += `🔥 RPE: ${session.rpe}/10\n`;
  notesContent += `⏱️ Temps: ${formatStopwatch(durationSeconds)}`;

  // Échappement des caractères spéciaux XML pour éviter les bugs d'import
  const safeNotes = notesContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const tcxContent = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd"
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Activities>
    <Activity Sport="${sport}">
      <Id>${startTime}</Id>
      <Lap StartTime="${startTime}">
        <TotalTimeSeconds>${durationSeconds}</TotalTimeSeconds>
        <DistanceMeters>${distanceMeters}</DistanceMeters>
        <Calories>${calories}</Calories>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
          <Trackpoint>
            <Time>${startTime}</Time>
            <DistanceMeters>0</DistanceMeters>
          </Trackpoint>
          <Trackpoint>
            <Time>${endTime}</Time>
            <DistanceMeters>${distanceMeters}</DistanceMeters>
          </Trackpoint>
        </Track>
      </Lap>
      <Notes>${safeNotes}</Notes>
      <Creator xsi:type="Device_t">
        <Name>C-Lab Performance</Name>
        <UnitId>0</UnitId>
        <ProductID>1</ProductID>
        <Version>
          <VersionMajor>2</VersionMajor>
          <VersionMinor>0</VersionMinor>
          <BuildMajor>0</BuildMajor>
          <BuildMinor>0</BuildMinor>
        </Version>
      </Creator>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

  const blob = new Blob([tcxContent], {type: 'application/vnd.garmin.tcx+xml'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  const safeType = session.type.replace(/\s+/g, '_').toLowerCase();
  link.download = `clab_${dateStr}_${safeType}.tcx`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};