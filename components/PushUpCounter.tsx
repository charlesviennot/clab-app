import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, X, Dumbbell, Minus, Plus, Timer, CheckCircle2 } from 'lucide-react';
import { vibrate } from '../utils/helpers';

export const PushUpCounter = ({ onClose }: { onClose?: () => void }) => {
    const [workoutState, setWorkoutState] = useState<'setup' | 'active' | 'rest' | 'finished'>('setup');
    const [targetReps, setTargetReps] = useState(10);
    const [restDuration, setRestDuration] = useState(45);
    
    const [count, setCount] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [restLeft, setRestLeft] = useState(0);
    const [history, setHistory] = useState<{set: number, reps: number}[]>([]);
    
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState("Placez-vous au-dessus du téléphone");
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const restTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    // State for the push-up logic
    const isDownRef = useRef(false);
    const baselineBrightnessRef = useRef<number | null>(null);
    const targetRepsRef = useRef(targetReps);

    useEffect(() => {
        targetRepsRef.current = targetReps;
    }, [targetReps]);

    // Manage camera stream attachment
    useEffect(() => {
        if (workoutState === 'active' && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(e => console.error("Video play failed", e));
        }
    }, [workoutState]);

    // Manage rest timer
    useEffect(() => {
        if (workoutState === 'rest') {
            restTimerRef.current = setInterval(() => {
                setRestLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(restTimerRef.current!);
                        startNextSet();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => {
                if (restTimerRef.current) clearInterval(restTimerRef.current);
            };
        }
    }, [workoutState]);

    const startWorkout = async () => {
        try {
            setError(null);
            setCount(0);
            setFeedback("Calibrage... restez en position haute");
            isDownRef.current = false;
            baselineBrightnessRef.current = null;

            if (!streamRef.current) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: 'user',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    }
                });
                streamRef.current = stream;
            }
            
            setWorkoutState('active');
            startDetectionLoop();

        } catch (err: any) {
            console.error(err);
            setError("Impossible d'accéder à la caméra frontale.");
            setWorkoutState('setup');
        }
    };

    const startDetectionLoop = () => {
        let frameCount = 0;
        let calibrationSum = 0;

        const processFrame = () => {
            if (!streamRef.current || !canvasRef.current || !videoRef.current) return;

            const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            const vw = videoRef.current.videoWidth;
            const vh = videoRef.current.videoHeight;
            if (vw > 0 && vh > 0) {
                const size = Math.min(vw, vh) * 0.5;
                const sx = (vw - size) / 2;
                const sy = (vh - size) / 2;
                ctx.drawImage(videoRef.current, sx, sy, size, size, 0, 0, 100, 100);
            } else {
                ctx.drawImage(videoRef.current, 0, 0, 100, 100);
            }
            
            const imageData = ctx.getImageData(0, 0, 100, 100);
            const data = imageData.data;

            let brightnessSum = 0;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                brightnessSum += (r * 0.299 + g * 0.587 + b * 0.114);
            }
            const avgBrightness = brightnessSum / (data.length / 4);

            if (frameCount < 30) {
                calibrationSum += avgBrightness;
                frameCount++;
                if (frameCount === 30) {
                    baselineBrightnessRef.current = calibrationSum / 30;
                    setFeedback("C'est parti ! Descendez...");
                }
            } else if (baselineBrightnessRef.current !== null) {
                // Increased sensitivity: only 10% darker to trigger down, 5% darker to trigger up
                const thresholdDown = baselineBrightnessRef.current * 0.90;
                const thresholdUp = baselineBrightnessRef.current * 0.95;

                if (!isDownRef.current && avgBrightness < thresholdDown) {
                    isDownRef.current = true;
                    setFeedback("Remontez !");
                    vibrate(50);
                } else if (isDownRef.current && avgBrightness > thresholdUp) {
                    isDownRef.current = false;
                    
                    // Play a small beep sound
                    try {
                        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                        if (AudioContext) {
                            const ctx = new AudioContext();
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
                            gain.gain.setValueAtTime(0.1, ctx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                            osc.start();
                            osc.stop(ctx.currentTime + 0.15);
                        }
                    } catch (e) {
                        console.error("Audio play failed", e);
                    }

                    setCount(prev => {
                        const newCount = prev + 1;
                        if (newCount >= targetRepsRef.current) {
                            setTimeout(() => finishSet(newCount), 0);
                        } else {
                            setFeedback("Pompe validée ! Descendez...");
                        }
                        return newCount;
                    });
                    vibrate([50, 50, 50]);
                }
            }

            animationRef.current = requestAnimationFrame(processFrame);
        };

        setTimeout(() => {
            animationRef.current = requestAnimationFrame(processFrame);
        }, 1000);
    };

    const finishSet = (repsDone: number) => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setHistory(prev => [...prev, { set: currentSet, reps: repsDone }]);
        setRestLeft(restDuration);
        setWorkoutState('rest');
        vibrate([100, 100, 100, 100]); // Long vibration for set complete
    };

    const startNextSet = () => {
        setCurrentSet(prev => prev + 1);
        setCount(0);
        setWorkoutState('active');
        setFeedback("Calibrage... restez en position haute");
        isDownRef.current = false;
        baselineBrightnessRef.current = null;
        startDetectionLoop();
    };

    const stopWorkout = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (restTimerRef.current) clearInterval(restTimerRef.current);
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        if (count > 0 && workoutState === 'active') {
            setHistory(prev => [...prev, { set: currentSet, reps: count }]);
        }
        
        setWorkoutState('finished');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (restTimerRef.current) clearInterval(restTimerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="space-y-6">
            <canvas ref={canvasRef} width="100" height="100" className="hidden" />

            {workoutState === 'setup' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Entraînement</h2>
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Dumbbell size={20} />
                        </div>
                    </div>
                    
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                        Posez votre téléphone au sol. La caméra frontale comptera vos pompes et gérera vos temps de repos.
                    </p>

                    <div className="space-y-4 mb-8">
                        {/* Reps selector */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-700">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Objectif par série</div>
                                <div className="text-3xl font-black text-slate-800 dark:text-white">{targetReps} <span className="text-lg text-slate-500 font-medium">reps</span></div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => setTargetReps(r => r + 1)} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"><Plus size={20}/></button>
                                <button onClick={() => setTargetReps(r => Math.max(1, r - 1))} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"><Minus size={20}/></button>
                            </div>
                        </div>

                        {/* Rest selector */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-700">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Temps de repos</div>
                                <div className="text-3xl font-black text-slate-800 dark:text-white">{restDuration} <span className="text-lg text-slate-500 font-medium">sec</span></div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => setRestDuration(r => r + 5)} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"><Plus size={20}/></button>
                                <button onClick={() => setRestDuration(r => Math.max(5, r - 5))} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"><Minus size={20}/></button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium flex items-center gap-2">
                            <X size={16} /> {error}
                        </div>
                    )}

                    <button 
                        onClick={startWorkout}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Play size={20} fill="currentColor" /> Commencer
                    </button>
                    
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="w-full mt-4 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition active:scale-95"
                        >
                            Retour
                        </button>
                    )}
                </div>
            )}

            {workoutState === 'active' && createPortal(
                <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500 overflow-hidden">
                    <video 
                        ref={videoRef} 
                        className="absolute inset-0 w-full h-full object-cover opacity-60" 
                        playsInline 
                        muted 
                        style={{ transform: 'scaleX(-1)' }}
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-64 h-64 rounded-full border-4 transition-colors duration-300 ${isDownRef.current ? 'border-emerald-500 bg-emerald-500/20' : 'border-white/30 bg-white/5'}`}></div>
                    </div>

                    <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-start z-20 pointer-events-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-black/40 border border-white/10 text-white">
                            <span className="text-xs font-bold uppercase tracking-widest">
                                Série {currentSet}
                            </span>
                        </div>
                        <button 
                            onClick={stopWorkout} 
                            className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-rose-500/80 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none mt-12">
                        <div className="flex items-baseline gap-2 drop-shadow-2xl">
                            <span className="text-white text-9xl font-black tabular-nums tracking-tighter">
                                {count}
                            </span>
                            <span className="text-white/60 text-5xl font-bold">
                                /{targetReps}
                            </span>
                        </div>
                        <div className="mt-8 px-6 py-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                            <p className="text-white text-lg font-medium text-center">
                                {feedback}
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {workoutState === 'rest' && createPortal(
                <div className="fixed inset-0 z-[100] bg-indigo-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                    <Timer className="text-indigo-300 mb-6" size={48} />
                    <h2 className="text-indigo-200 text-2xl font-bold mb-2">Repos (Série {currentSet} terminée)</h2>
                    <div className="text-white text-9xl font-black tabular-nums tracking-tighter mb-12">
                        {restLeft}
                    </div>
                    
                    <div className="flex gap-4 w-full max-w-xs">
                        <button onClick={() => setRestLeft(r => r + 15)} className="flex-1 py-4 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-2xl text-white font-bold text-lg">
                            +15s
                        </button>
                        <button onClick={startNextSet} className="flex-1 py-4 bg-white hover:bg-slate-100 active:scale-95 transition-all text-indigo-900 rounded-2xl font-bold text-lg shadow-xl">
                            Passer
                        </button>
                    </div>
                    
                    <button onClick={stopWorkout} className="mt-12 px-6 py-3 text-indigo-300/80 hover:text-white hover:bg-white/10 rounded-full transition-colors font-medium">
                        Terminer l'entraînement
                    </button>
                </div>,
                document.body
            )}

            {workoutState === 'finished' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 text-center animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Entraînement terminé !</h2>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 mb-6 mt-6 text-left border border-slate-100 dark:border-slate-700">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Résumé</div>
                        {history.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">Aucune pompe enregistrée.</p>
                        ) : (
                            <>
                                {history.map((h, i) => (
                                    <div key={i} className="flex justify-between items-center py-3 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0">
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">Série {h.set}</span>
                                        <span className="text-slate-800 dark:text-white font-bold">{h.reps} reps</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-slate-200 dark:border-slate-600">
                                    <span className="text-slate-800 dark:text-white font-black text-lg">Total</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-black text-2xl">{history.reduce((acc, h) => acc + h.reps, 0)} reps</span>
                                </div>
                            </>
                        )}
                    </div>

                    <button onClick={() => {
                        setWorkoutState('setup');
                        setHistory([]);
                        setCurrentSet(1);
                    }} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 mb-3">
                        Nouvel entraînement
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="w-full py-4 text-slate-500 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                            Fermer
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
