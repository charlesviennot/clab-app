
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Activity, Zap, Info, History, Camera, CheckCircle, AlertCircle, Thermometer, RefreshCw, TrendingUp, TrendingDown, Minus, Plus, Play, StopCircle, X, Dumbbell } from 'lucide-react';
import { vibrate } from '../utils/helpers';
import { PushUpCounter } from './PushUpCounter';

interface HealthRecord {
    date: string;
    bpm: number;
    hrv: number;
    status: 'optimal' | 'good' | 'fatigued' | 'strained';
}

export const HealthView = ({ userData, setUserData }: any) => {
    const [activeMode, setActiveMode] = useState<'vfc' | 'pushup'>('vfc');
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

    const [liveBpm, setLiveBpm] = useState<number | null>(null);
    const [liveRrIntervals, setLiveRrIntervals] = useState<number[]>([]);
    const lastLivePeakRef = useRef<number>(0);
    
    // New refs for advanced PPG algorithm
    const prevRedRef = useRef<number>(0);
    const dcFilterRef = useRef<number>(0);
    const lpfRef = useRef<number>(0);
    const allRrIntervalsRef = useRef<number[]>([]);
    const recentValuesRef = useRef<number[]>([0, 0, 0]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);

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
            
            setLiveBpm(null);
            setLiveRrIntervals([]);
            lastLivePeakRef.current = 0;
            
            prevRedRef.current = 0;
            dcFilterRef.current = 0;
            lpfRef.current = 0;
            allRrIntervalsRef.current = [];
            recentValuesRef.current = [0, 0, 0];
            
            // 1. Initial request to get permissions
            let stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            // 2. Enumerate devices to find the ultra-wide camera
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            
            const ultraCam = videoInputs.find(cam => 
                cam.label.toLowerCase().includes('ultra') || 
                cam.label.toLowerCase().includes('0.5')
            );

            if (ultraCam) {
                // Stop the temporary stream
                stream.getTracks().forEach(track => track.stop());
                try {
                    // Request the ultra-wide camera specifically
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            deviceId: { exact: ultraCam.deviceId },
                            width: { ideal: 640 },
                            height: { ideal: 480 },
                            frameRate: { ideal: 60 }
                        }
                    });
                } catch (e) {
                    console.warn("Failed to get ultra-wide camera, falling back to default", e);
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { 
                            facingMode: 'environment',
                            width: { ideal: 640 },
                            height: { ideal: 480 },
                            frameRate: { ideal: 60 }
                        }
                    });
                }
            } else {
                // If no ultra-wide found, just use the current stream but try to apply ideal constraints
                const track = stream.getVideoTracks()[0];
                try {
                    await track.applyConstraints({
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 60 }
                    });
                } catch(e) {}
            }

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
            let validElapsedTime = 0;
            let lastFrameTime = Date.now();
            const duration = 30000; // 30 seconds

            const processFrame = () => {
                if (!streamRef.current || !canvasRef.current) return;

                const now = Date.now();
                const deltaTime = now - lastFrameTime;
                lastFrameTime = now;

                const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;

                const source = videoRef.current || streamRef.current;
                
                try {
                    ctx.drawImage(source as any, 0, 0, 100, 100);
                } catch (e) {
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

                // Gating: Is the finger properly covering the camera?
                // We relax this to just require it to be mostly red to support devices where flash might be weak or on ultra-wide.
                const isFingerDetected = avgRed > 50 && avgRed > avgGreen * 1.1;

                if (!isFingerDetected) {
                    setSignalQuality(10);
                    setLiveSignal(prev => [...prev.slice(-49), 0]);
                    prevRedRef.current = avgRed;
                    
                    // Don't advance progress if finger is not detected
                    animationRef.current = requestAnimationFrame(processFrame);
                    return;
                }
                
                setSignalQuality(100);
                validElapsedTime += deltaTime;

                // --- THE PHYSICS OF PPG ---
                // When the heart beats, blood volume in the capillaries increases.
                // Blood absorbs light. Therefore, the image gets DARKER (avgRed drops).
                // To create a graph that spikes UP on a heartbeat, we invert the signal.
                const rawSignal = -avgRed; 
                const prevRaw = prevRedRef.current === 0 ? rawSignal : -prevRedRef.current;
                prevRedRef.current = avgRed;

                // 1. DC Blocker (High-pass filter) to remove the baseline brightness
                // y[n] = x[n] - x[n-1] + alpha * y[n-1]
                const alpha = 0.95;
                dcFilterRef.current = rawSignal - prevRaw + alpha * dcFilterRef.current;

                // 2. Low-pass filter to smooth out camera noise
                // y[n] = beta * y[n-1] + (1 - beta) * x[n]
                const beta = 0.7;
                lpfRef.current = beta * lpfRef.current + (1 - beta) * dcFilterRef.current;

                const finalValue = lpfRef.current;

                // Save for graph
                setLiveSignal(prev => [...prev.slice(-49), finalValue]);

                // 3. Peak Detection (Heartbeat)
                recentValuesRef.current.push(finalValue);
                recentValuesRef.current.shift();
                
                const [v1, v2, v3] = recentValuesRef.current;
                
                // A peak is a local maximum above a certain noise threshold
                const noiseThreshold = 0.5; 
                if (v2 > v1 && v2 > v3 && v2 > noiseThreshold) {
                    const now = Date.now();
                    const timeSinceLastPeak = now - lastLivePeakRef.current;
                    
                    // Refractory period: human heart rate rarely exceeds 200 BPM (300ms)
                    if (timeSinceLastPeak > 300) {
                        if (lastLivePeakRef.current > 0) {
                            const rr = timeSinceLastPeak;
                            allRrIntervalsRef.current.push(rr);
                            setLiveRrIntervals(prev => [...prev.slice(-3), Math.round(rr)]);
                            
                            // Live BPM calculation (average of last 5 RR intervals)
                            const recentRRs = allRrIntervalsRef.current.slice(-5);
                            const avgRr = recentRRs.reduce((a, b) => a + b, 0) / recentRRs.length;
                            setLiveBpm(Math.round(60000 / avgRr));
                        }
                        lastLivePeakRef.current = now;
                        
                        setIsPulseDetected(true);
                        setTimeout(() => setIsPulseDetected(false), 150);
                    }
                }

                const p = Math.min(100, (validElapsedTime / duration) * 100);
                setProgress(p);

                if (validElapsedTime < duration) {
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
        const rrIntervals = allRrIntervalsRef.current;

        if (rrIntervals.length < 5) {
            setError("Mesure trop courte ou signal instable. Réessayez.");
            return;
        }

        // Filtrage des intervalles aberrants (Ectopic beats)
        // Un intervalle normal ne varie pas de plus de 20% par rapport au précédent
        const validRrIntervals: number[] = [rrIntervals[0]];
        for (let i = 1; i < rrIntervals.length; i++) {
            const prev = rrIntervals[i - 1];
            const curr = rrIntervals[i];
            const change = Math.abs(curr - prev) / prev;
            if (change < 0.20) {
                validRrIntervals.push(curr);
            }
        }

        if (validRrIntervals.length < 5) {
            setError("Signal trop instable. Gardez le doigt immobile.");
            return;
        }

        // Calcul du BPM final (moyenne des intervalles valides)
        const avgRr = validRrIntervals.reduce((a, b) => a + b, 0) / validRrIntervals.length;
        const calculatedBpm = Math.round(60000 / avgRr);

        // Calcul du HRV (RMSSD)
        let sumDiffSq = 0;
        for (let i = 1; i < validRrIntervals.length; i++) {
            sumDiffSq += Math.pow(validRrIntervals[i] - validRrIntervals[i - 1], 2);
        }
        
        const calculatedHrv = validRrIntervals.length > 1 
            ? Math.round(Math.sqrt(sumDiffSq / (validRrIntervals.length - 1)))
            : 0;

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
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6">
                <button 
                    onClick={() => setActiveMode('vfc')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeMode === 'vfc' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    <Heart size={16} /> VFC
                </button>
                <button 
                    onClick={() => setActiveMode('pushup')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeMode === 'pushup' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    <Dumbbell size={16} /> Pompes
                </button>
            </div>

            {activeMode === 'pushup' ? (
                <PushUpCounter />
            ) : (
                <>
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

                {isMeasuring && createPortal(
                    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500 overflow-hidden font-sans">
                        {/* Real Camera Feed - No artificial red overlay, just the raw feed which will be red from the finger */}
                        <video 
                            ref={videoRef} 
                            className="absolute inset-0 w-full h-full object-cover scale-110" 
                            playsInline 
                            muted 
                        />
                        
                        {/* Top: Live BPM */}
                        <div className="absolute top-20 left-0 right-0 flex justify-center items-center gap-3 z-20">
                            <Heart className={`text-white ${isPulseDetected ? 'scale-110' : 'scale-100'} transition-transform duration-100`} fill="white" size={28} />
                            <span className="text-white text-6xl font-medium tracking-tight drop-shadow-md">{liveBpm || '--'} bpm</span>
                        </div>

                        {/* Middle: Real ECG Graph */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-40 z-20 flex flex-col justify-center">
                            {signalQuality < 50 ? (
                                <div className="flex flex-col items-center justify-center h-full px-8 text-center animate-pulse">
                                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                                        <Camera className="text-white" size={32} />
                                    </div>
                                    <p className="text-white text-xl font-bold drop-shadow-lg">
                                        Placez votre doigt sur la caméra
                                    </p>
                                    <p className="text-white/80 text-sm mt-2 font-medium">
                                        Couvrez complètement l'objectif (et le flash si possible)
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="relative w-full h-24 flex items-end justify-around px-4">
                                        {/* Real-time Pulse Graph */}
                                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                                            <path 
                                                d={`M ${liveSignal.map((v, i) => `${(i / 49) * 100},${50 - v * 15}`).join(' L ')}`}
                                                fill="none" 
                                                stroke="rgba(255,255,255,0.9)" 
                                                strokeWidth="1.5" 
                                                vectorEffect="non-scaling-stroke"
                                                className="transition-all duration-75"
                                            />
                                        </svg>
                                        {/* RR Intervals */}
                                        {liveRrIntervals.map((rr, idx) => (
                                            <div key={idx} className="text-white/90 text-sm font-medium mb-16 z-10 drop-shadow-md">{rr}</div>
                                        ))}
                                    </div>
                                    <p className="text-white text-xl font-bold text-center mt-8 px-8 leading-tight drop-shadow-lg">
                                        Stress is how bent out of shape your tree branch is
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Bottom: Progress Circle */}
                        <div className="absolute bottom-32 left-0 right-0 flex justify-center z-20">
                            <div className="relative w-40 h-40 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full border border-white/20">
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle 
                                        className="text-white/20" 
                                        strokeWidth="4" 
                                        fill="transparent" 
                                        r="44" cx="50" cy="50" 
                                    />
                                    <circle 
                                        className="text-white transition-all duration-300 ease-linear drop-shadow-md" 
                                        strokeWidth="4" 
                                        strokeDasharray={276} 
                                        strokeDashoffset={276 - (276 * progress) / 100} 
                                        strokeLinecap="round" 
                                        fill="transparent" 
                                        r="44" cx="50" cy="50" 
                                    />
                                </svg>
                                <span className="text-white text-4xl font-bold drop-shadow-md">{Math.round(progress)}%</span>
                            </div>
                        </div>

                        {/* Bottom-most: Stop Button */}
                        <div className="absolute bottom-12 left-0 right-0 flex justify-center z-20">
                            <button 
                                onClick={stopMeasurement} 
                                className="px-12 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white font-medium transition-colors border border-white/10"
                            >
                                Stop
                            </button>
                        </div>
                    </div>,
                    document.body
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
            </>
            )}

            {/* Hidden elements for processing */}
            <canvas ref={canvasRef} width="100" height="100" style={{ display: 'none' }} />
        </div>
    );
};
