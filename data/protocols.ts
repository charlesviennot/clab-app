
export const RUN_PROTOCOLS = {
  steady: [
    { name: "Mise en action", sets: "10 min", reps: "Continu", rest: "-", rpe: 2, note: "Progressif", imageKeyword: "jogging slow morning", instructions: "Commencez très lentement. Laissez le corps monter en température. Respiration par le nez recommandée." },
    { name: "Corps de séance", sets: "30-40 min", reps: "Continu", rest: "-", rpe: 3, note: "Zone 2", imageKeyword: "running road fitness", instructions: "Allure de croisière. Vous devez pouvoir tenir une conversation complète sans essoufflement." },
    { name: "Lignes Droites (Option)", sets: "5", reps: "80m", rest: "Retour marché", rpe: 6, note: "Technique", imageKeyword: "sprinting track runner", instructions: "Accélération progressive sur 80m. Focus sur la pose de pied et le redressement. Ce n'est pas un sprint max." }
  ],
  interval_short: [
    { name: "Échauffement Complet", sets: "20 min", reps: "Continu", rest: "-", rpe: 3, note: "Préparation", imageKeyword: "runner stretching track", instructions: "15' footing lent + 5' de gammes (talons-fesses, montées de genoux, pas chassés) pour activer l'élasticité." },
    { name: "Fractions 30/30", sets: "2 blocs", reps: "8-10 reps", rest: "2' entre blocs", rpe: 8, note: "VMA", imageKeyword: "fast running track sprint", instructions: "30 sec vite (dynamique) / 30 sec trot lent. Ne partez pas au sprint, visez la régularité." },
    { name: "Retour au calme", sets: "10 min", reps: "Lent", rest: "-", rpe: 2, note: "Lactate clearance", imageKeyword: "jogging sunset cool down", instructions: "Trot très lent pour faire redescendre la fréquence cardiaque et rincer les muscles." }
  ],
  interval_long: [
    { name: "Échauffement", sets: "20 min", reps: "Continu", rest: "-", rpe: 3, note: "Préparation", imageKeyword: "road running warm up", instructions: "Footing + 3 accélérations progressives." },
    { name: "Fractions Longues", sets: "4-5", reps: "3-4 min", rest: "2 min", rpe: 8, note: "VMA Longue", imageKeyword: "fast running road intensity", instructions: "90-95% VMA. C'est dur mais tenable sur la durée." },
    { name: "Retour au calme", sets: "10 min", reps: "Lent", rest: "-", rpe: 2, note: "Cool down", imageKeyword: "slow jogging relaxing", instructions: "Relâchez tout." }
  ],
  threshold: [
    { name: "Échauffement", sets: "20 min", reps: "Continu", rest: "-", rpe: 3, note: "Aérobie", imageKeyword: "road running shoes", instructions: "Footing progressif. Finir par 2-3 accélérations sur 20 secondes pour monter le cardio." },
    { name: "Blocs au Seuil", sets: "3", reps: "8 à 10 min", rest: "2 min trot", rpe: 7, note: "Seuil Anaérobie", imageKeyword: "tempo run serious runner", instructions: "Allure 'confortablement difficile'. On ne peut plus parler, mais on ne souffre pas. Concentration sur le souffle." },
    { name: "Retour au calme", sets: "10 min", reps: "Lent", rest: "-", rpe: 2, note: "Récupération", imageKeyword: "walking tired runner", instructions: "Relâchez totalement les épaules et les bras." }
  ],
  hills: [
    { name: "Échauffement", sets: "20 min", reps: "Continu", rest: "-", rpe: 3, note: "Préparation", imageKeyword: "trail running forest", instructions: "Footing sur terrain plat avant d'attaquer la pente." },
    { name: "Cote courtes", sets: "8-10", reps: "30-45 sec", rest: "Descente marchée", rpe: 9, note: "Puissance", imageKeyword: "uphill sprinting running hill", instructions: "Montez dynamique. Poussez fort sur les orteils, levez les genoux, aidez-vous des bras. Récupérez en descendant." },
    { name: "Retour au calme", sets: "10 min", reps: "Lent", rest: "-", rpe: 2, note: "Cool down", imageKeyword: "trail running calm", instructions: "Sur le plat pour dérouler les jambes." }
  ],
  long_run: [
    { name: "Première partie", sets: "1/3 temps", reps: "Lent", rest: "-", rpe: 3, note: "Économie", imageKeyword: "long distance running road", instructions: "Départ très prudent. Économisez le glycogène. Hydratez-vous dès les 20 premières minutes." },
    { name: "Cœur de sortie", sets: "1/3 temps", reps: "Allure Endurance", rest: "-", rpe: 4, note: "Volume", imageKeyword: "marathon runner training", instructions: "Allure cible endurance. Fluidité, relâchement. Visualisez la course." },
    { name: "Fin de sortie", sets: "1/3 temps", reps: "Libre", rest: "-", rpe: 5, note: "Mental", imageKeyword: "runner tired happy", instructions: "Si vous vous sentez bien, accélérez légèrement (progressive finish). Sinon, maintenez l'allure." }
  ],
  recovery: [
    { name: "Footing", sets: "30-45 min", reps: "Continu", rest: "-", rpe: 2, note: "Récupération", imageKeyword: "slow jogging park morning", instructions: "Aucun objectif d'allure. Courez 'au feeling', très lentement. C'est un massage pour les jambes." }
  ]
};

export const STRENGTH_PROTOCOLS = {
  force: {
    legs: [
      { name: "Back Squat", sets: 5, reps: "3-5", rest: "3-4 min", rpe: 9, note: "Explosif à la montée", imageKeyword: "barbell back squat gym", instructions: "Barre sur les trapèzes, pieds largeur épaules. Descendez fesses en arrière jusqu'à la parallèle. Gardez le dos droit et gainé. Poussez fort dans les talons pour remonter.", imageUrl: "" }, 
      { name: "Deadlift", sets: 3, reps: "5", rest: "3 min", rpe: 8, note: "Chaîne post.", imageKeyword: "barbell deadlift gym powerlifting", instructions: "Barre au sol contre les tibias. Dos plat, poitrine sortie. Poussez le sol avec les jambes avant de tirer avec le dos. Extension complète de hanche en haut.", imageUrl: "" },
      { name: "Fentes Arrière (Lourd)", sets: 3, reps: "6/jambe", rest: "2 min", rpe: 8, note: "Stabilité.", imageKeyword: "dumbbell reverse lunge gym", instructions: "Un grand pas en arrière. Descendez le genou arrière proche du sol. Gardez le buste droit. Poussez avec la jambe avant pour revenir.", imageUrl: "" },
      { name: "Box Jumps", sets: 5, reps: "3", rest: "2 min", rpe: 10, note: "Explosivité.", imageKeyword: "box jump crossfit gym", instructions: "Saut explosif sur une boite (~60cm). Atterrissez en douceur, genoux fléchis. Extension complète des hanches en l'air.", imageUrl: "" }
    ],
    upper: [
      { name: "Weighted Pull-ups", sets: 5, reps: "5", rest: "3 min", rpe: 9, note: "Lesté.", imageKeyword: "weighted pull up gym", instructions: "Tractions prise pronation. Menton au-dessus de la barre. Contrôlez la descente. Ajoutez du poids si > 8 reps faciles.", imageUrl: "" },
      { name: "Military Press", sets: 5, reps: "5", rest: "3 min", rpe: 8, note: "Force épaules.", imageKeyword: "barbell military press standing", instructions: "Debout, barre sur les clavicules. Développez au-dessus de la tête sans cambrer le dos (gainage fort). Verrouillez les coudes.", imageUrl: "" },
      { name: "Pendlay Row", sets: 4, reps: "6", rest: "2 min", rpe: 8, note: "Explosif.", imageKeyword: "pendlay row barbell", instructions: "Buste parallèle au sol. Tirez la barre explosivement vers le bas de la poitrine. Reposez la barre au sol à chaque rep.", imageUrl: "" },
      { name: "Core Hold (Lesté)", sets: 4, reps: "30s", rest: "90s", rpe: 8, note: "Gainage.", imageKeyword: "weighted plank plate back", instructions: "Planche abdominale avec un disque sur le dos. Corps aligné, fessiers serrés. Ne laissez pas le bassin tomber.", imageUrl: "" }
    ],
    full: [
      { name: "Trap Bar Deadlift", sets: 5, reps: "5", rest: "3 min", rpe: 9, note: "Force globale.", imageKeyword: "trap bar deadlift hex bar", instructions: "Variante plus sûre du deadlift. Poussez dans les jambes comme un squat inversé. Gardez les bras tendus.", imageUrl: "" },
      { name: "Bench Press", sets: 5, reps: "5", rest: "3 min", rpe: 9, note: "Poussée.", imageKeyword: "bench press barbell", instructions: "Dos plat sur le banc, pieds ancrés au sol. Descendez la barre milieu de poitrine. Poussez explosivement.", imageUrl: "" },
      { name: "Weighted Squat", sets: 4, reps: "6", rest: "3 min", rpe: 8, note: "Jambes.", imageKeyword: "squat barbell", instructions: "Voir Back Squat.", imageUrl: "" },
      { name: "Farmers Walk", sets: 3, reps: "20m", rest: "2 min", rpe: 9, note: "Grip & Core.", imageKeyword: "farmers walk heavy dumbbells", instructions: "Marchez avec deux haltères très lourds. Posture parfaite, épaules en arrière. Ne pas dandiner.", imageUrl: "" }
    ]
  },
  hypertrophy: {
    push: [ 
      { name: "Développé Couché Haltères", sets: 4, reps: "10-12", rest: "90s", rpe: 8, note: "Pecs / Triceps", imageKeyword: "dumbbell bench press", instructions: "Plus d'amplitude qu'à la barre. Bien étirer les pecs en bas. Resserrer en haut sans claquer les haltères.", imageUrl: "https://i.postimg.cc/pLfpNd9Q/De-veloppe-Couche-Halte-res.png" },
      { name: "Développé Militaire", sets: 4, reps: "12", rest: "90s", rpe: 8, note: "Épaules", imageKeyword: "dumbbell shoulder press seated", instructions: "Assis ou debout. Contrôlez la descente (3 sec) pour maximiser le temps sous tension.", imageUrl: "https://i.postimg.cc/T1vJpxSR/dev_militaire.png" },
      { name: "Extensions Triceps Poulie", sets: 4, reps: "15", rest: "45s", rpe: 9, note: "Triceps", imageKeyword: "tricep pushdown cable", instructions: "Coudes collés au corps. Seuls les avant-bras bougent. Contractez fort en bas.", imageUrl: "https://i.postimg.cc/prQYj7bn/Extensions_Triceps_Poulie.png" },
      { name: "Élévations Latérales", sets: 4, reps: "15-20", rest: "45s", rpe: 9, note: "Deltoïde Latéral", imageKeyword: "dumbbell lateral raise", instructions: "Bras légèrement fléchis. Montez les coudes, pas les mains. Imaginez verser une carafe d'eau en haut.", imageUrl: "https://i.postimg.cc/Xq6kpWh7/elevation_late_rale.png" },
      { name: "Écarté Poulie Vis-à-vis", sets: 3, reps: "15-20", rest: "45s", rpe: 9, note: "Finition Pecs.", imageKeyword: "cable crossover fly", instructions: "Cherchez la contraction maximale en croisant les mains. Gardez les coudes ouverts.", imageUrl: "https://i.postimg.cc/9M7Bm0Lf/ecarte_poulie.png" }
    ],
    pull: [
      { name: "Tirage Vertical", sets: 4, reps: "12", rest: "90s", rpe: 8, note: "Dos Largeur", imageKeyword: "lat pulldown gym", instructions: "Tirez la barre vers le haut de la poitrine. Sortez la cage thoracique. Ne balancez pas le buste.", imageUrl: "https://i.postimg.cc/Lsg7r9F4/tirage_vertical.png" },
      { name: "Rowing Barre", sets: 4, reps: "10", rest: "90s", rpe: 8, note: "Dos Épaisseur", imageKeyword: "barbell bent over row", instructions: "Buste penché à 45°. Tirez vers le nombril en resserrant les omoplates.", imageUrl: "https://i.postimg.cc/3xcVSyVw/rowing.png" },
      { name: "Curl Barre", sets: 4, reps: "12", rest: "60s", rpe: 9, note: "Biceps", imageKeyword: "barbell bicep curl", instructions: "Coudes fixes. Ne pas utiliser le dos pour lancer la barre.", imageUrl: "https://i.postimg.cc/fT56dqvY/curl_barre.png" },
      { name: "Hammer Curls", sets: 3, reps: "12", rest: "60s", rpe: 9, note: "Brachial", imageKeyword: "dumbbell hammer curl", instructions: "Prise marteau (neutre). Cible l'épaisseur du bras et l'avant-bras.", imageUrl: "https://i.postimg.cc/QdtvJg6n/Hammer_curl.png" },
      { name: "Crunchs", sets: 4, reps: "20", rest: "45s", rpe: 8, note: "Abdos", imageKeyword: "crunches floor abs", instructions: "Enroulez la colonne, ne tirez pas sur la nuque. Soufflez en montant.", imageUrl: "https://i.postimg.cc/7Z6jn1Bj/crunchs.png" }
    ],
    legs: [ 
      { name: "Squat", sets: 4, reps: "10-12", rest: "3 min", rpe: 8, note: "Base Jambes", imageKeyword: "barbell squat", instructions: "Amplitude complète. Le creux de la hanche doit passer sous le genou si la mobilité le permet.", imageUrl: "https://i.postimg.cc/ry7vNRBY/squat.png" },
      { name: "Presse à cuisses", sets: 4, reps: "12-15", rest: "2 min", rpe: 9, note: "Volume Quads", imageKeyword: "leg press machine", instructions: "Pieds largeur épaules. Descendez genoux vers épaules. Ne verrouillez pas les genoux en haut.", imageUrl: "https://i.postimg.cc/tgD5S8YP/legs_press.png" },
      { name: "Fentes Marchées", sets: 3, reps: "12/jambe", rest: "90s", rpe: 8, note: "Unilatéral", imageKeyword: "walking lunges dumbbells", instructions: "Faites des pas de géant. Le genou arrière frôle le sol. Gardez le rythme.", imageUrl: "https://i.postimg.cc/FKGZWw7S/fente_marche.png" },
      { name: "Leg Curl", sets: 4, reps: "15", rest: "60s", rpe: 9, note: "Ischios", imageKeyword: "lying leg curl machine", instructions: "Contrôlez la phase retour (excentrique). Ne décollez pas les hanches du banc.", imageUrl: "https://i.postimg.cc/6Qz0jFyn/Legs_curl.png" },
      { name: "Mollets Debout", sets: 4, reps: "15", rest: "45s", rpe: 9, note: "Mollets", imageKeyword: "standing calf raise machine", instructions: "Extension maximale sur la pointe des pieds. Pause 1sec en haut, 1sec en bas.", imageUrl: "https://i.postimg.cc/brS9vJL1/mollet_debout.png" }
    ],
    shoulders_arms: [
      { name: "Développé Militaire", sets: 4, reps: "10-12", rest: "90s", rpe: 8, note: "Base Épaules", imageKeyword: "seated dumbbell military press", instructions: "Barre ou haltères. Dos droit, abdos serrés. Poussez la charge au-dessus de la tête sans cambrer.", imageUrl: "" },
      { name: "Élévations Latérales Haltères", sets: 4, reps: "15-20", rest: "45s", rpe: 9, note: "Deltoïde Latéral", imageKeyword: "dumbbell lateral raise standing", instructions: "Coude légèrement fléchi. Montez les coudes, pas les mains. Contrôlez la descente.", imageUrl: "" },
      { name: "Curl Biceps Incliné", sets: 3, reps: "12", rest: "60s", rpe: 9, note: "Biceps Chef Long", imageKeyword: "incline dumbbell curl", instructions: "Banc à 45°. Laissez les bras pendre derrière le corps pour étirer le biceps. Gardez les coudes fixes.", imageUrl: "" },
      { name: "Extension Triceps Corde", sets: 4, reps: "15", rest: "45s", rpe: 9, note: "Chef Latéral Triceps", imageKeyword: "tricep rope pushdown", instructions: "Poulie haute. Écartez la corde en bas du mouvement. Gardez les coudes collés aux côtes.", imageUrl: "" },
      { name: "Curl Marteau", sets: 3, reps: "12", rest: "60s", rpe: 8, note: "Brachial", imageKeyword: "hammer curls standing", instructions: "Prise marteau (neutre). Cible l'épaisseur du bras et l'avant-bras.", imageUrl: "https://i.postimg.cc/QdtvJg6n/Hammer_curl.png" }
    ],
    chest_back: [
      { name: "Développé Incliné", sets: 4, reps: "10", rest: "90s", rpe: 8, note: "Haut Pecs", imageKeyword: "incline dumbbell press", instructions: "Banc à 30°. Cible le haut des pectoraux. Touchez la poitrine, poussez.", imageUrl: "" },
      { name: "Tirage Horizontal", sets: 4, reps: "10", rest: "90s", rpe: 8, note: "Dos", imageKeyword: "seated cable row gym", instructions: "Dos droit. Tirez la poignée au bas ventre. Sortez la poitrine.", imageUrl: "" },
      { name: "Écarté Couché", sets: 3, reps: "15", rest: "60s", rpe: 9, note: "Isolation Pecs", imageKeyword: "dumbbell flyes bench", instructions: "Ouvrez la cage thoracique. Gardez une légère flexion des coudes.", imageUrl: "" },
      { name: "Pull-over", sets: 3, reps: "15", rest: "60s", rpe: 8, note: "Dos/Pecs", imageKeyword: "dumbbell pullover bench", instructions: "Allongé en travers du banc. Descendez l'haltère derrière la tête bras tendus.", imageUrl: "" },
      { name: "Shrugs", sets: 4, reps: "15", rest: "45s", rpe: 8, note: "Trapèzes", imageKeyword: "dumbbell shrugs", instructions: "Haussement d'épaules. Ne roulez pas les épaules, juste haut/bas.", imageUrl: "" }
    ]
  },
  street_workout: {
    push: [
        { name: "Dips", sets: 4, reps: "8-12", rest: "2 min", rpe: 8, note: "Pecs/Triceps/Épaules", imageKeyword: "parallel bar dips calisthenics", instructions: "Mouvement roi de la poussée. Bras tendus au départ. Descendez à 90°.", imageUrl: "https://i.postimg.cc/cCGBrWjx/dips.png" },
        { name: "Pike Push-ups", sets: 4, reps: "8-10", rest: "90s", rpe: 8, note: "Épaules", imageKeyword: "pike pushup calisthenics", instructions: "Corps en V inversé.", imageUrl: "https://i.postimg.cc/nzSktsnG/Pike-Push-ups.png" },
        { name: "Pseudo Planche Push-ups", sets: 3, reps: "8-12", rest: "90s", rpe: 9, note: "Avant d'épaule", imageKeyword: "planche lean pushup", instructions: "Mains tournées vers l'extérieur. Penchez-vous en avant.", imageUrl: "https://i.postimg.cc/2y2fY7V0/Pseudo_Planche_Push_ups.png" },
        { name: "Pompes Diamant", sets: 3, reps: "Max", rest: "60s", rpe: 9, note: "Triceps", imageKeyword: "diamond pushups floor", instructions: "Mains jointes sous la poitrine.", imageUrl: "https://i.postimg.cc/P5ZTpZcL/pompe_diamant.png" }
    ],
    pull: [
        { name: "Tractions Pronation", sets: 4, reps: "8-12", rest: "2 min", rpe: 9, note: "Dos", imageKeyword: "pull ups bar calisthenics", instructions: "Prise large. Menton au-dessus de la barre.", imageUrl: "" },
        { name: "Tractions Australiennes", sets: 4, reps: "12", rest: "90s", rpe: 8, note: "Rhomboïdes", imageKeyword: "australian pull ups inverted row", instructions: "Barre basse. Corps gainé.", imageUrl: "" },
        { name: "Chin-ups", sets: 3, reps: "8-10", rest: "90s", rpe: 9, note: "Biceps", imageKeyword: "chin ups bar", instructions: "Prise supination.", imageUrl: "" },
        { name: "Skin The Cat", sets: 3, reps: "3-5", rest: "2 min", rpe: 8, note: "Mobilité", imageKeyword: "skin the cat gymnastics", instructions: "Enroulez le corps. Étirement épaules.", imageUrl: "" }
    ],
    legs: [
        { name: "Pistol Squat", sets: 4, reps: "5-8/jambe", rest: "2 min", rpe: 9, note: "Unilatéral", imageKeyword: "pistol squat one leg", instructions: "Squat sur une jambe. Assisté si besoin.", imageUrl: "" },
        { name: "Fentes Sautées", sets: 4, reps: "20", rest: "90s", rpe: 8, note: "Explosivité", imageKeyword: "jumping lunges plyometric", instructions: "Alternez en l'air. Réception souple.", imageUrl: "" },
        { name: "Squat Bulgare", sets: 3, reps: "10/jambe", rest: "90s", rpe: 8, note: "Chaîne Post.", imageKeyword: "bulgarian split squat bodyweight", instructions: "Pied arrière surélevé.", imageUrl: "" },
        { name: "Glute Bridge Unilatéral", sets: 3, reps: "15/jambe", rest: "60s", rpe: 8, note: "Fessiers", imageKeyword: "single leg glute bridge floor", instructions: "Dos au sol, une jambe levée.", imageUrl: "" }
    ],
    skills_core: [
        { name: "Muscle-Up Transition", sets: 5, reps: "3-5", rest: "3 min", rpe: 9, note: "Technique", imageKeyword: "muscle up rings transition", instructions: "Travail du passage buste sur la barre.", imageUrl: "" },
        { name: "L-Sit Hold", sets: 4, reps: "Max sec", rest: "90s", rpe: 9, note: "Gainage", imageKeyword: "l-sit floor calisthenics", instructions: "Jambes à l'équerre.", imageUrl: "" },
        { name: "Toes to Bar", sets: 4, reps: "8-12", rest: "90s", rpe: 8, note: "Abdos", imageKeyword: "toes to bar hanging", instructions: "Pieds à la barre.", imageUrl: "" },
        { name: "Hollow Body", sets: 3, reps: "45s", rest: "60s", rpe: 7, note: "Gainage", imageKeyword: "hollow body hold floor", instructions: "Dos plaqué au sol.", imageUrl: "" }
    ],
    full_body: [
        { name: "Burpees", sets: 4, reps: "15", rest: "60s", rpe: 8, note: "Cardio", imageKeyword: "burpees exercise", instructions: "Rythme constant.", imageUrl: "" },
        { name: "Tractions", sets: 4, reps: "Max-2", rest: "90s", rpe: 9, note: "Tirage", imageKeyword: "pull ups bar", instructions: "Volume.", imageUrl: "" },
        { name: "Dips", sets: 4, reps: "Max-2", rest: "90s", rpe: 9, note: "Poussée", imageKeyword: "dips bar", instructions: "Volume.", imageUrl: "" },
        { name: "Squats", sets: 4, reps: "25", rest: "60s", rpe: 7, note: "Jambes", imageKeyword: "air squat fast", instructions: "Rapide.", imageUrl: "" }
    ]
  },
  home_no_equipment: {
    push_home: [
        { name: "Pompes Élastique", sets: 4, reps: "10-12", rest: "90s", rpe: 8, note: "Pecs/Triceps", imageKeyword: "banded pushups floor", instructions: "Élastique dans le dos, tenu dans chaque main. Résistance max en haut." },
        { name: "Développé Militaire (Band)", sets: 4, reps: "12", rest: "90s", rpe: 8, note: "Épaules", imageKeyword: "resistance band overhead press", instructions: "Debout, pieds sur l'élastique. Poussez les mains vers le ciel. Gainage fort." },
        { name: "Élévations Latérales", sets: 3, reps: "15", rest: "60s", rpe: 9, note: "Isolation Delto", imageKeyword: "band lateral raise", instructions: "Pied sur l'élastique. Montez les coudes à hauteur d'épaule." },
        { name: "Extensions Triceps (Nuque)", sets: 3, reps: "15", rest: "60s", rpe: 9, note: "Triceps", imageKeyword: "band tricep extension", instructions: "Élastique sous le pied, main derrière la nuque. Tendez le bras vers le plafond." }
    ],
    pull_home: [
        { name: "Rowing Debout", sets: 4, reps: "12-15", rest: "90s", rpe: 8, note: "Dos Épaisseur", imageKeyword: "resistance band bent over row", instructions: "Pieds sur l'élastique, buste penché. Tirez les mains vers les hanches." },
        { name: "Face Pulls", sets: 4, reps: "15-20", rest: "60s", rpe: 7, note: "Posture / Coiffe", imageKeyword: "band face pull home", instructions: "Élastique accroché en hauteur (porte). Tirez vers le front en écartant les mains." },
        { name: "Band Pull-Aparts", sets: 3, reps: "20", rest: "45s", rpe: 7, note: "Arrière d'épaule", imageKeyword: "band pull aparts", instructions: "Bras tendus devant soi. Écartez les mains pour toucher la poitrine avec l'élastique." },
        { name: "Biceps Curl", sets: 3, reps: "12-15", rest: "60s", rpe: 9, note: "Biceps", imageKeyword: "resistance band bicep curl", instructions: "Pieds sur l'élastique. Coudes collés au corps." }
    ],
    legs_home: [
        { name: "Squat avec Élastique", sets: 4, reps: "15", rest: "90s", rpe: 8, note: "Jambes", imageKeyword: "resistance band squat", instructions: "Pieds sur l'élastique, bande passée derrière la nuque ou tenue en 'Front Rack' sur les épaules." },
        { name: "RDL (Jambes Tendues)", sets: 4, reps: "12", rest: "90s", rpe: 8, note: "Ischios", imageKeyword: "resistance band deadlift", instructions: "Pieds sur l'élastique (raccourci pour tension). Poussez les fesses en arrière, dos plat." },
        { name: "Marche Latérale (Monstre)", sets: 3, reps: "20 pas", rest: "60s", rpe: 8, note: "Moyen Fessier", imageKeyword: "lateral band walk", instructions: "Élastique autour des chevilles. Genoux fléchis. Pas chassés larges." },
        { name: "Fentes Unilatérales", sets: 3, reps: "12/jambe", rest: "90s", rpe: 8, note: "Fessiers/Quads", imageKeyword: "split squat resistance band", instructions: "Pied avant sur l'élastique. Tenez les extrémités." }
    ],
    core_home: [
        { name: "Pallof Press", sets: 3, reps: "12/côté", rest: "60s", rpe: 8, note: "Anti-Rotation", imageKeyword: "pallof press band", instructions: "Élastique attaché sur le côté. Tendez les bras devant vous sans vous laisser tourner." },
        { name: "Woodchoppers", sets: 3, reps: "15/côté", rest: "60s", rpe: 7, note: "Obliques", imageKeyword: "band woodchopper", instructions: "Mouvement de bûcheron en diagonale (haut vers bas opposé)." },
        { name: "Dead Bug (Tension)", sets: 3, reps: "20 alt.", rest: "60s", rpe: 7, note: "Gainage", imageKeyword: "banded dead bug", instructions: "Dos au sol, élastique tiré derrière la tête pour activer le grand dorsal pendant le mouvement de jambes." },
        { name: "Planche", sets: 3, reps: "Max", rest: "60s", rpe: 9, note: "Statique", imageKeyword: "plank exercise", instructions: "Classique mais efficace." }
    ],
    full_home: [
        { name: "Thrusters Élastique", sets: 4, reps: "15", rest: "90s", rpe: 9, note: "Cardio/Force", imageKeyword: "band thrusters", instructions: "Squat complet + Développé au dessus de la tête en remontant." },
        { name: "Good Mornings", sets: 4, reps: "20", rest: "60s", rpe: 7, note: "Chaine Post.", imageKeyword: "band good morning", instructions: "Élastique autour de la nuque, pieds dessus. Penchez le buste en avant, dos plat." },
        { name: "High Pull + Squat", sets: 3, reps: "15", rest: "90s", rpe: 8, note: "Full Body", imageKeyword: "band high pull", instructions: "Tirage menton suivi d'un squat." },
        { name: "Burpees", sets: 3, reps: "15", rest: "60s", rpe: 9, note: "Cardio", imageKeyword: "burpees fitness", instructions: "Sans élastique. Juste pour le cardio." }
    ]
  },
  reinforcement: {
    posture_upper: [
        { name: "Y-T-W-L au sol", sets: 3, reps: "10 de chaque", rest: "60s", rpe: 6, note: "Santé Épaules", imageKeyword: "ytwl floor exercise", instructions: "Allongé sur le ventre. Formez les lettres avec les bras. Pouces vers le ciel. Contrôlez." },
        { name: "Oiseau (Buste penché)", sets: 3, reps: "15", rest: "60s", rpe: 7, note: "Delto Postérieur", imageKeyword: "reverse fly bodyweight bent over", instructions: "Sans poids ou petites bouteilles d'eau. Buste à 90°. Écartez les bras." },
        { name: "Wall Slides", sets: 3, reps: "12", rest: "45s", rpe: 5, note: "Mobilité", imageKeyword: "wall slides shoulder exercise", instructions: "Dos au mur. Glissez les bras le long du mur en gardant coudes et poignets collés." },
        { name: "Gainage Ours (Bear Crawl Hold)", sets: 4, reps: "30s", rest: "45s", rpe: 7, note: "Stabilité", imageKeyword: "bear crawl hold fitness", instructions: "4 pattes. Décollez les genoux de 2cm. Dos plat comme une table. Tenez." }
    ],
    stability_lower: [
        { name: "Single Leg Deadlift (Sans poids)", sets: 3, reps: "10/jambe", rest: "60s", rpe: 6, note: "Proprioception", imageKeyword: "single leg deadlift bodyweight", instructions: "Sur une jambe, penchez le buste en avant, jambe libre en arrière. Gardez l'équilibre." },
        { name: "Clamshells", sets: 3, reps: "15/côté", rest: "30s", rpe: 6, note: "Moyen Fessier", imageKeyword: "clamshell exercise lying", instructions: "Allongé sur le côté, genoux pliés. Ouvrez le genou du dessus sans bouger le bassin." },
        { name: "Marche en crabe (Elastique opt.)", sets: 3, reps: "20 pas", rest: "45s", rpe: 7, note: "Hanches", imageKeyword: "crab walk fitness", instructions: "Position demi-squat. Pas latéraux. Gardez les genoux ouverts." },
        { name: "Montée sur pointe 1 jambe", sets: 3, reps: "15/jambe", rest: "45s", rpe: 7, note: "Prévention Cheville", imageKeyword: "single leg calf raise", instructions: "Lentement. Contrôlez la descente pour renforcer le tendon d'Achille." }
    ],
    core_back: [
        { name: "Dead Bug", sets: 4, reps: "20 alt.", rest: "45s", rpe: 6, note: "Coordination", imageKeyword: "dead bug abs exercise", instructions: "Dos plaqué au sol. Allongez bras et jambe opposés sans cambrer." },
        { name: "Bird Dog", sets: 3, reps: "12/côté", rest: "45s", rpe: 6, note: "Chaîne croisée", imageKeyword: "bird dog yoga exercise", instructions: "4 pattes. Tendez bras et jambe opposés. Cherchez la longueur, pas la hauteur." },
        { name: "Pont Fessier Marché", sets: 3, reps: "20 pas", rest: "60s", rpe: 7, note: "Ischios/Fessiers", imageKeyword: "glute bridge march", instructions: "Position pont fessier haut. Levez un pied puis l'autre sans que le bassin ne bouge." },
        { name: "Gainage Latéral", sets: 3, reps: "30s/côté", rest: "45s", rpe: 7, note: "Obliques", imageKeyword: "side plank fitness", instructions: "Coude sous l'épaule. Alignement parfait cheville-hanche-épaule." }
    ],
    mobility_flow: [
        { name: "Fente avec rotation", sets: "10 alt.", reps: "Lent", rest: "-", rpe: 4, note: "Mobilité Hanches/Dos", imageKeyword: "lunge with twist stretch", instructions: "Grande fente, main au sol, ouvrez l'autre bras vers le ciel." },
        { name: "Chien tête en bas / Cobra", sets: "10 passages", reps: "Fluide", rest: "-", rpe: 5, note: "Chaîne Ant./Post.", imageKeyword: "downward dog to cobra flow", instructions: "Passez d'une position à l'autre en ondulant la colonne." },
        { name: "Squat Profond (Hold)", sets: "3", reps: "30s", rest: "30s", rpe: 5, note: "Ouverture Hanches", imageKeyword: "deep squat mobility", instructions: "Descendez au maximum. Gardez le dos droit. Poussez les genoux avec les coudes." },
        { name: "Inchworm", sets: "8", reps: "Lent", rest: "-", rpe: 5, note: "Ischios/Épaules", imageKeyword: "inchworm exercise standing", instructions: "Debout, posez mains au sol, avancez en planche, revenez pieds vers mains." }
    ],
    total_body_tone: [
        { name: "Squat to Press (Imaginaire)", sets: 4, reps: "15", rest: "60s", rpe: 7, note: "Cardio léger", imageKeyword: "squat to overhead press bodyweight", instructions: "Squat, puis extension bras vers le ciel. Rythmé." },
        { name: "Fentes Latérales", sets: 3, reps: "10/côté", rest: "60s", rpe: 6, note: "Adducteurs", imageKeyword: "side lunge exercise", instructions: "Gardez la jambe tendue bien droite. Fesses en arrière." },
        { name: "Pompes sur genoux (ou mur)", sets: 3, reps: "10-12", rest: "60s", rpe: 6, note: "Poussée", imageKeyword: "knee pushups women", instructions: "Focus qualité du mouvement et gainage." },
        { name: "Gainage Planche Dynamique", sets: 3, reps: "30s", rest: "45s", rpe: 7, note: "Core", imageKeyword: "plank shoulder taps", instructions: "En planche, touchez votre épaule opposée avec la main. Le bassin ne doit pas danser." }
    ]
  },
  hyrox: {
    sleds_strength: [
        { name: "Sled Push (Lourd)", sets: 5, reps: "20m", rest: "2 min", rpe: 9, note: "Puissance Poussée", imageKeyword: "sled push gym", instructions: "Bras tendus ou pliés, dos plat. Poussez avec les jambes. Charge lourde (simu Hyrox : 125-175kg).", imageUrl: "" },
        { name: "Sled Pull (Corde)", sets: 5, reps: "20m", rest: "2 min", rpe: 9, note: "Chaîne Postérieure", imageKeyword: "sled pull gym rope", instructions: "Tirez le traîneau avec une corde ou harnais. Reculez en gardant le dos droit et les jambes fléchies.", imageUrl: "" },
        { name: "Farmers Carry", sets: 4, reps: "40m", rest: "90s", rpe: 8, note: "Grip / Gainage", imageKeyword: "farmers walk kettlebell", instructions: "Deux kettlebells lourdes (24/32kg). Marchez vite, épaules en arrière, sans dandiner.", imageUrl: "" },
        { name: "Dead Hang", sets: 3, reps: "Max sec", rest: "60s", rpe: 9, note: "Grip Endurance", imageKeyword: "dead hang pullup bar", instructions: "Suspendez-vous à une barre. Relâchez tout sauf les mains.", imageUrl: "" }
    ],
    functional_endurance: [
        { name: "Wall Balls", sets: 5, reps: "20", rest: "60s", rpe: 8, note: "Cardio / Jambes", imageKeyword: "crossfit wall balls", instructions: "Squat complet, lancez la balle sur la cible (3m). Enchaînez la réception avec le squat suivant.", imageUrl: "" },
        { name: "Burpee Broad Jumps", sets: 4, reps: "10-15", rest: "90s", rpe: 9, note: "Explosivité", imageKeyword: "burpee broad jump", instructions: "Faites un burpee, puis un saut en longueur vers l'avant. Répétez sur la distance.", imageUrl: "" },
        { name: "Box Jumps Over", sets: 4, reps: "15", rest: "60s", rpe: 8, note: "Plyométrie", imageKeyword: "box jump over crossfit", instructions: "Sautez sur la boite, passez de l'autre côté. Rythme constant.", imageUrl: "" },
        { name: "Hand Release Push-ups", sets: 4, reps: "15", rest: "60s", rpe: 7, note: "Endurance Poussée", imageKeyword: "hand release pushups", instructions: "Décollez les mains du sol en bas du mouvement. Poussez explosif.", imageUrl: "" }
    ],
    legs_compromised: [
        { name: "Sandbag Lunges", sets: 4, reps: "20m", rest: "90s", rpe: 9, note: "Jambes sous charge", imageKeyword: "sandbag lunges", instructions: "Sac sur les épaules (10-20kg). Fentes marchées. Genou arrière touche le sol.", imageUrl: "" },
        { name: "Goblet Squats", sets: 4, reps: "15", rest: "60s", rpe: 8, note: "Volume Jambes", imageKeyword: "kettlebell goblet squat", instructions: "KB contre la poitrine. Squat profond. Gardez le dos droit.", imageUrl: "" },
        { name: "Step Ups (Lestés)", sets: 3, reps: "10/jambe", rest: "60s", rpe: 8, note: "Unilatéral", imageKeyword: "weighted step ups box", instructions: "Montez sur une box avec une KB ou Dumbbell. Extension complète de la hanche en haut.", imageUrl: "" },
        { name: "Calf Raises", sets: 4, reps: "20", rest: "45s", rpe: 7, note: "Mollets", imageKeyword: "calf raise gym", instructions: "Indispensable pour la poussée du traîneau.", imageUrl: "" }
    ],
    ergs_power: [
        { name: "Rowing Intervals", sets: 5, reps: "500m", rest: "2 min", rpe: 9, note: "Puissance Aérobie", imageKeyword: "concept2 rowing machine", instructions: "Tirage puissant. Cadence ~28-30 s/m.", imageUrl: "" },
        { name: "SkiErg (ou Band Pulls)", sets: 5, reps: "500m (ou 2min)", rest: "2 min", rpe: 9, note: "Haut du corps", imageKeyword: "skierg machine", instructions: "Utilisez le poids du corps pour tirer les poignées vers le bas. Flexion de hanche.", imageUrl: "" },
        { name: "Thrusters (KB/Barre)", sets: 4, reps: "12", rest: "90s", rpe: 9, note: "Transfert Wall Ball", imageKeyword: "barbell thrusters crossfit", instructions: "Front squat + développé au dessus de la tête en un seul mouvement fluide.", imageUrl: "" },
        { name: "Kettlebell Swings", sets: 4, reps: "20", rest: "60s", rpe: 8, note: "Hanche / Cardio", imageKeyword: "kettlebell swing", instructions: "Mouvement de balancier initié par les hanches, pas les épaules.", imageUrl: "" }
    ],
    full_race_sim: [
        { name: "Run 1km (Pré-fatigue)", sets: 1, reps: "1km", rest: "0", rpe: 8, note: "Seuil", imageKeyword: "treadmill running", instructions: "Allure course cible.", imageUrl: "" },
        { name: "Sled Push", sets: 2, reps: "25m", rest: "1 min", rpe: 9, note: "Force", imageKeyword: "sled push heavy", instructions: "Poussez lourd.", imageUrl: "" },
        { name: "Run 1km", sets: 1, reps: "1km", rest: "0", rpe: 8, note: "Seuil", imageKeyword: "running tired", instructions: "Reprenez le rythme immédiatement.", imageUrl: "" },
        { name: "Wall Balls", sets: 1, reps: "50", rest: "2 min", rpe: 9, note: "Mental", imageKeyword: "wall balls crossfit", instructions: "Série longue. Gérez le souffle.", imageUrl: "" }
    ]
  }
};
