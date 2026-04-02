
import React, { useState, useEffect, useRef } from 'react';
import { Heart, Activity, Zap, Info, History, Camera, CheckCircle, AlertCircle, Thermometer, RefreshCw, TrendingUp, TrendingDown, Minus, Plus, Play, StopCircle } from 'lucide-react';
import { vibrate } from '../utils/helpers';

interface HealthRecord {
    date: string;
    bpm: number;
    hrv: number;
    status: 'optimal' | 'good' | 'fatigued' | 'strained';
}

export const HealthView = ({ userData, setUserData }: any) => {
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [progress, setProgress] = useState(0);
    const [bpm, setBpm] = useState<number | null>(null);
    const [hrv, setHrv] = useState<number | null>(null);
    const [status, setStatus] = useState<HealthRecord['status'] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<HealthRecord[]>(() => {
        const saved = localStorage.getItem('clab_health_history');
        return saved ? JSON.parse(saved) : [];
    });

    const [liveSignal, setLiveSignal] = useState<number[]>([]);
    const [signalQuality, setSignalQuality] = useState(0);
    const [isPulseDetected, setIsPulseDetected] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const signalRef = useRef<number[]>([]);
    const timestampsRef = useRef<number[]>([]);
    const filterRef = useRef<number>(0);

    useEffect(() => {
        localStorage.setItem('clab_health_history', JSON.stringify(history));
    }, [history]);

    // Effect to attach stream to video element when it becomes available
    useEffect(() => {
        if (isMeasuring && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(e => console.error("Video play failed", e));
        }
    }, [isMeasuring]);

    const startMeasurement = async () => {
        try {
            setError(null);
            setBpm(null);
            setHrv(null);
            setStatus(null);
            setProgress(0);
            setLiveSignal([]);
            setSignalQuality(0);
            setIsPulseDetected(false);
            signalRef.current = [];
            timestampsRef.current = [];
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 128 },
                    height: { ideal: 128 },
                    frameRate: { ideal: 30 }
                }
            });

            streamRef.current = stream;
            
            // Try to enable torch
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities() as any;
            if (capabilities.torch) {
                try {
                    await track.applyConstraints({ advanced: [{ torch: true }] } as any);
                } catch (e) {
                    console.warn("Torch activation failed", e);
                }
            }

            setIsMeasuring(true);
            const startTime = Date.now();
            const duration = 30000; // 30 seconds

            const processFrame = () => {
                if (!streamRef.current || !canvasRef.current) return;

                const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;

                // We use a hidden canvas to process the pixels even if video is shown
                // But we can also use the video element as source for drawImage
                // To be safe and reactive, we use the stream directly if possible or the video ref
                const source = videoRef.current || streamRef.current;
                
                try {
                    ctx.drawImage(source as any, 0, 0, 100, 100);
                } catch (e) {
                    // If video isn't ready yet
                    animationRef.current = requestAnimationFrame(processFrame);
                    return;
                }

                const imageData = ctx.getImageData(0, 0, 100, 100);
                const data = imageData.data;

                let redSum = 0;
                let greenSum = 0;
                for (let i = 0; i < data.length; i += 4) {
                    redSum += data[i];
                    greenSum += data[i+1];
                }
                const avgRed = redSum / (data.length / 4);
                const avgGreen = greenSum / (data.length / 4);

                // Quality check: finger should be red and bright
                const quality = (avgRed > 150 && avgRed > avgGreen * 1.2) ? 100 : 20;
                setSignalQuality(quality);

                // Simple high-pass filter to remove DC offset
                const alpha = 0.95;
                filterRef.current = alpha * filterRef.current + (1 - alpha) * avgRed;
                const filteredValue = avgRed - filterRef.current;

                signalRef.current.push(filteredValue);
                timestampsRef.current.push(Date.now());
                
                // Pulse detection for UI feedback
                if (filteredValue > 0.8) {
                    setIsPulseDetected(true);
                    setTimeout(() => setIsPulseDetected(false), 150);
                }

                // Update live signal for graph (last 50 points)
                setLiveSignal(prev => [...prev.slice(-49), filteredValue]);

                const elapsed = Date.now() - startTime;
                const p = Math.min(100, (elapsed / duration) * 100);
                setProgress(p);

                if (elapsed < duration) {
                    animationRef.current = requestAnimationFrame(processFrame);
                } else {
                    stopMeasurement();
                    calculateResults();
                }
            };

            animationRef.current = requestAnimationFrame(processFrame);

        } catch (err: any) {
            console.error(err);
            setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
            setIsMeasuring(false);
        }
    };

    const stopMeasurement = () => {
        setIsMeasuring(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                // Try to turn off torch before stopping
                const capabilities = track.getCapabilities() as any;
                if (capabilities.torch) {
                    track.applyConstraints({ advanced: [{ torch: false }] } as any).catch(() => {});
                }
                track.stop();
            });
        }
        streamRef.current = null;
    };

    const calculateResults = () => {
        const signal = signalRef.current;
        const timestamps = timestampsRef.current;

        if (signal.length < 300) {
            setError("Mesure trop courte ou signal instable. Réessayez.");
            return;
        }

        // Peak detection
        const peaks: number[] = [];
        const minPeakDistance = 400; // ms (max 150 BPM)
        let lastPeakTime = 0;

        // Simple thresholding for peak detection
        const threshold = 0.5; 

        for (let i = 1; i < signal.length - 1; i++) {
            if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1] && signal[i] > threshold) {
                const time = timestamps[i];
                if (time - lastPeakTime > minPeakDistance) {
                    peaks.push(time);
                    lastPeakTime = time;
                }
            }
        }

        if (peaks.length < 8) {
            setError("Signal trop faible. Assurez-vous de bien couvrir l'objectif et le flash.");
            return;
        }

        // BPM
        const totalDuration = peaks[peaks.length - 1] - peaks[0];
        const calculatedBpm = Math.round((peaks.length - 1) / (totalDuration / 60000));

        // HRV (RMSSD)
        const rrIntervals: number[] = [];
        for (let i = 1; i < peaks.length; i++) {
            rrIntervals.push(peaks[i] - peaks[i - 1]);
        }

        let sumDiffSq = 0;
        for (let i = 1; i < rrIntervals.length; i++) {
            sumDiffSq += Math.pow(rrIntervals[i] - rrIntervals[i - 1], 2);
        }
        const calculatedHrv = Math.round(Math.sqrt(sumDiffSq / (rrIntervals.length - 1)));

        setBpm(calculatedBpm);
        setHrv(calculatedHrv);

        // Interpretation
        let resStatus: HealthRecord['status'] = 'good';
        if (calculatedHrv > 65) resStatus = 'optimal';
        else if (calculatedHrv < 25) resStatus = 'strained';
        else if (calculatedHrv < 45) resStatus = 'fatigued';
        
        setStatus(resStatus);

        const newRecord: HealthRecord = {
            date: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
            bpm: calculatedBpm,
            hrv: calculatedHrv,
            status: resStatus
        };

        setHistory(prev => [newRecord, ...prev].slice(0, 10));
        if (userData.hapticEnabled) vibrate(100);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Check-up Santé</h2>
                        <p className="text-xs text-slate-400">Mesure PPG via caméra & flash</p>
                    </div>
                    <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center">
                        <Heart className={isMeasuring || isPulseDetected ? 'animate-pulse scale-110' : ''} />
                    </div>
                </div>

                {!isMeasuring && !bpm && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Camera className="text-indigo-500" />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Prêt pour la mesure ?</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px] mx-auto">
                                Posez délicatement votre index sur l'objectif de la caméra arrière et le flash. Restez immobile pendant 30 secondes.
                            </p>
                        </div>
                        <button 
                            onClick={startMeasurement}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Play size={20} fill="currentColor" /> Démarrer le scan
                        </button>
                    </div>
                )}

                {isMeasuring && (
                    <div className="space-y-6 py-2">
                        {/* Live Camera View - Zoomed and Reactive */}
                        <div className={`relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 transition-all duration-150 shadow-2xl ${isPulseDetected ? 'border-rose-400 scale-105 shadow-rose-400/30' : 'border-rose-600 shadow-rose-200 dark:shadow-none'}`}>
                            <video 
                                ref={videoRef} 
                                className={`w-full h-full object-cover scale-[3.0] transition-opacity duration-150 ${isPulseDetected ? 'opacity-80' : 'opacity-100'}`} 
                                playsInline 
                                muted 
                            />
                            {/* Red overlay to simulate the flash through tissue effect */}
                            <div className="absolute inset-0 bg-rose-600/10 mix-blend-color pointer-events-none"></div>
                            
                            {/* Progress Overlay */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                                <circle 
                                    className="text-white/20 stroke-current" 
                                    strokeWidth="4" 
                                    fill="transparent" 
                                    r="48" cx="50" cy="50" 
                                />
                                <circle 
                                    className="text-white stroke-current transition-all duration-300 ease-linear" 
                                    strokeWidth="4" 
                                    strokeDasharray={301.6} 
                                    strokeDashoffset={301.6 - (301.6 * progress) / 100} 
                                    strokeLinecap="round" 
                                    fill="transparent" 
                                    r="48" cx="50" cy="50" 
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-white text-3xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{Math.round(progress)}%</span>
                            </div>
                        </div>

                        {/* Real-time Pulse Graph */}
                        <div className="h-24 bg-slate-900 rounded-2xl p-2 relative overflow-hidden border border-slate-800">
                            <div className="absolute top-2 left-3 flex items-center gap-1.5 z-10">
                                <div className={`w-1.5 h-1.5 rounded-full ${signalQuality > 50 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    {signalQuality > 50 ? 'Signal Stable' : 'Ajustez votre doigt'}
                                </span>
                            </div>
                            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                                <path 
                                    d={`M ${liveSignal.map((v, i) => `${(i / 49) * 100},${20 - v * 8}`).join(' L ')}`}
                                    fill="none"
                                    stroke={isPulseDetected ? "#fb7185" : "#f43f5e"}
                                    strokeWidth={isPulseDetected ? "2.5" : "1.5"}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-all duration-100"
                                />
                            </svg>
                        </div>

                        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-4 border border-rose-100 dark:border-rose-800 flex items-center gap-3">
                            <div className={`w-2 h-2 bg-rose-500 rounded-full ${isPulseDetected ? 'scale-150' : 'animate-ping'}`}></div>
                            <p className="text-xs font-medium text-rose-800 dark:text-rose-300">
                                {isPulseDetected ? "Battement détecté !" : "Analyse du flux sanguin..."}
                            </p>
                        </div>

                        <button 
                            onClick={stopMeasurement}
                            className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition active:scale-95"
                        >
                            Annuler
                        </button>
                    </div>
                )}

                {bpm && !isMeasuring && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pouls (BPM)</div>
                                <div className="text-3xl font-black text-slate-800 dark:text-white">{bpm}</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">HRV (ms)</div>
                                <div className="text-3xl font-black text-slate-800 dark:text-white">{hrv}</div>
                            </div>
                        </div>

                        <div className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center ${
                            status === 'optimal' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' :
                            status === 'good' ? 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' :
                            status === 'fatigued' ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800' :
                            'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800'
                        }`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                                status === 'optimal' ? 'bg-emerald-500 text-white' :
                                status === 'good' ? 'bg-blue-500 text-white' :
                                status === 'fatigued' ? 'bg-amber-500 text-white' :
                                'bg-rose-500 text-white'
                            }`}>
                                {status === 'optimal' ? <Zap size={32} fill="currentColor" /> : 
                                 status === 'good' ? <CheckCircle size={32} /> : 
                                 status === 'fatigued' ? <Activity size={32} /> : 
                                 <AlertCircle size={32} />}
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">
                                {status === 'optimal' ? 'Forme Olympique !' :
                                 status === 'good' ? 'Bonne Récupération' :
                                 status === 'fatigued' ? 'Fatigue Détectée' :
                                 'Besoin de Repos'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {status === 'optimal' ? 'Votre système nerveux est prêt pour une séance intense. C\'est le moment de chercher un PR !' :
                                 status === 'good' ? 'Vous avez bien récupéré. Suivez votre plan d\'entraînement normalement.' :
                                 status === 'fatigued' ? 'Votre HRV est un peu bas. Privilégiez une séance de récupération active ou du sommeil.' :
                                 'Signes de stress physiologique important. Repos total conseillé aujourd\'hui.'}
                            </p>
                        </div>

                        <button 
                            onClick={startMeasurement}
                            className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} /> Nouvelle mesure
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
            </div>

            {/* History */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                    <History className="text-indigo-600" size={18} /> Historique Santé
                </h3>
                <div className="space-y-3">
                    {history.length > 0 ? history.map((rec, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-8 rounded-full ${
                                    rec.status === 'optimal' ? 'bg-emerald-500' :
                                    rec.status === 'good' ? 'bg-blue-500' :
                                    rec.status === 'fatigued' ? 'bg-amber-500' :
                                    'bg-rose-500'
                                }`}></div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400">{rec.date}</div>
                                    <div className="font-bold text-xs text-slate-700 dark:text-white">{rec.bpm} BPM • {rec.hrv} ms (HRV)</div>
                                </div>
                            </div>
                            <div className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                                rec.status === 'optimal' ? 'bg-emerald-100 text-emerald-700' :
                                rec.status === 'good' ? 'bg-blue-100 text-blue-700' :
                                rec.status === 'fatigued' ? 'bg-amber-100 text-amber-700' :
                                'bg-rose-100 text-rose-700'
                            }`}>
                                {rec.status}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-6 text-slate-400 text-xs italic">
                            Aucune mesure enregistrée.
                        </div>
                    )}
                </div>
            </div>

            {/* Science Card */}
            <div className="bg-indigo-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Activity size={80}/></div>
                <div className="relative z-10">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><Info size={18} className="text-indigo-300"/> Comprendre le HRV</h3>
                    <p className="text-[11px] text-indigo-100 leading-relaxed">
                        La Variabilité de la Fréquence Cardiaque (HRV) mesure l'intervalle de temps entre chaque battement. Un HRV élevé indique un système nerveux autonome équilibré et une excellente capacité de récupération. C'est l'indicateur n°1 utilisé par les athlètes de haut niveau pour ajuster leur charge d'entraînement.
                    </p>
                </div>
            </div>

            {/* Hidden elements for processing */}
            <canvas ref={canvasRef} width="100" height="100" style={{ display: 'none' }} />
        </div>
    );
};
