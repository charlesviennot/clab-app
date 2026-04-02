
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

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const signalRef = useRef<number[]>([]);
    const timestampsRef = useRef<number[]>([]);
    const lastValueRef = useRef<number>(0);
    const filterRef = useRef<number>(0);

    useEffect(() => {
        localStorage.setItem('clab_health_history', JSON.stringify(history));
    }, [history]);

    const startMeasurement = async () => {
        try {
            setError(null);
            setBpm(null);
            setHrv(null);
            setStatus(null);
            setProgress(0);
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
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Try to enable torch
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities() as any;
            if (capabilities.torch) {
                await track.applyConstraints({ advanced: [{ torch: true }] } as any);
            }

            setIsMeasuring(true);
            const startTime = Date.now();
            const duration = 30000; // 30 seconds

            const processFrame = () => {
                if (!isMeasuring || !videoRef.current || !canvasRef.current) return;

                const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;

                ctx.drawImage(videoRef.current, 0, 0, 100, 100);
                const imageData = ctx.getImageData(0, 0, 100, 100);
                const data = imageData.data;

                let redSum = 0;
                for (let i = 0; i < data.length; i += 4) {
                    redSum += data[i];
                }
                const avgRed = redSum / (data.length / 4);

                // Simple high-pass filter to remove DC offset
                const alpha = 0.95;
                filterRef.current = alpha * filterRef.current + (1 - alpha) * avgRed;
                const filteredValue = avgRed - filterRef.current;

                signalRef.current.push(filteredValue);
                timestampsRef.current.push(Date.now());

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
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) videoRef.current.srcObject = null;
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

        for (let i = 1; i < signal.length - 1; i++) {
            if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1] && signal[i] > 0.5) {
                const time = timestamps[i];
                if (time - lastPeakTime > minPeakDistance) {
                    peaks.push(time);
                    lastPeakTime = time;
                }
            }
        }

        if (peaks.length < 10) {
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
        if (calculatedHrv > 70) resStatus = 'optimal';
        else if (calculatedHrv < 30) resStatus = 'strained';
        else if (calculatedHrv < 50) resStatus = 'fatigued';
        
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
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Check-up Santé</h2>
                        <p className="text-xs text-slate-400">Mesure PPG via caméra & flash</p>
                    </div>
                    <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center">
                        <Heart className={isMeasuring ? 'animate-pulse' : ''} />
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
                    <div className="space-y-8 py-4">
                        <div className="relative w-48 h-48 mx-auto">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle className="text-slate-100 dark:text-slate-700 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                                <circle 
                                    className="text-rose-500 stroke-current transition-all duration-300 ease-linear" 
                                    strokeWidth="8" 
                                    strokeDasharray={251.2} 
                                    strokeDashoffset={251.2 - (251.2 * progress) / 100} 
                                    strokeLinecap="round" 
                                    fill="transparent" 
                                    r="40" cx="50" cy="50" 
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-slate-800 dark:text-white">{Math.round(progress)}%</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analyse...</span>
                            </div>
                        </div>

                        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-4 border border-rose-100 dark:border-rose-800 flex items-center gap-3 animate-pulse">
                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                            <p className="text-xs font-medium text-rose-800 dark:text-rose-300">Gardez le doigt bien appuyé sur le flash</p>
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
            <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
            <canvas ref={canvasRef} width="100" height="100" style={{ display: 'none' }} />
        </div>
    );
};
