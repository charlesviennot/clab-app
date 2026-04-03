import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Play, StopCircle, X, RotateCcw, Dumbbell } from 'lucide-react';
import { vibrate } from '../utils/helpers';

export const PushUpCounter = ({ onClose }: { onClose?: () => void }) => {
    const [isCounting, setIsCounting] = useState(false);
    const [count, setCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState("Placez-vous au-dessus du téléphone");
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    
    // State for the push-up logic
    const isDownRef = useRef(false);
    const baselineBrightnessRef = useRef<number | null>(null);

    useEffect(() => {
        if (isCounting && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(e => console.error("Video play failed", e));
        }
    }, [isCounting]);

    const startCounter = async () => {
        try {
            setError(null);
            setCount(0);
            setFeedback("Calibrage... restez en position haute");
            isDownRef.current = false;
            baselineBrightnessRef.current = null;

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'user', // Front camera
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            streamRef.current = stream;
            setIsCounting(true);

            let frameCount = 0;
            let calibrationSum = 0;

            const processFrame = () => {
                if (!streamRef.current || !canvasRef.current || !videoRef.current) return;

                const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;

                // Draw the center of the video to the canvas (we only care about the center where the face/chest goes)
                const vw = videoRef.current.videoWidth;
                const vh = videoRef.current.videoHeight;
                if (vw > 0 && vh > 0) {
                    const size = Math.min(vw, vh) * 0.5; // 50% of the center
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
                    // Simple perceived brightness formula
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];
                    brightnessSum += (r * 0.299 + g * 0.587 + b * 0.114);
                }
                const avgBrightness = brightnessSum / (data.length / 4);

                // Calibration phase (first 30 frames ~ 1 second)
                if (frameCount < 30) {
                    calibrationSum += avgBrightness;
                    frameCount++;
                    if (frameCount === 30) {
                        baselineBrightnessRef.current = calibrationSum / 30;
                        setFeedback("C'est parti ! Descendez...");
                    }
                } else if (baselineBrightnessRef.current !== null) {
                    // Detection phase
                    // When the user goes down, they cover the camera, making it significantly darker
                    const thresholdDown = baselineBrightnessRef.current * 0.6; // 40% darker
                    const thresholdUp = baselineBrightnessRef.current * 0.85; // 15% darker

                    if (!isDownRef.current && avgBrightness < thresholdDown) {
                        // User went down
                        isDownRef.current = true;
                        setFeedback("Remontez !");
                        vibrate(50);
                    } else if (isDownRef.current && avgBrightness > thresholdUp) {
                        // User went back up
                        isDownRef.current = false;
                        setCount(prev => prev + 1);
                        setFeedback("Pompe validée ! Descendez...");
                        vibrate([50, 50, 50]); // Success vibration
                    }
                }

                animationRef.current = requestAnimationFrame(processFrame);
            };

            // Start processing after a short delay to let the camera adjust exposure
            setTimeout(() => {
                animationRef.current = requestAnimationFrame(processFrame);
            }, 1000);

        } catch (err: any) {
            console.error(err);
            setError("Impossible d'accéder à la caméra frontale.");
            setIsCounting(false);
        }
    };

    const stopCounter = () => {
        setIsCounting(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        streamRef.current = null;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCounter();
        };
    }, []);

    return (
        <div className="space-y-6">
            <canvas ref={canvasRef} width="100" height="100" className="hidden" />

            {!isCounting ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 text-center">
                    <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
                        <Dumbbell size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Compteur de Pompes</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                        Posez votre téléphone au sol, sous votre visage. La caméra frontale comptera automatiquement vos pompes.
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium flex items-center gap-2">
                            <X size={16} /> {error}
                        </div>
                    )}

                    <button 
                        onClick={startCounter}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Play size={20} fill="currentColor" /> Démarrer
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
            ) : createPortal(
                <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500 overflow-hidden">
                    {/* Camera Feed */}
                    <video 
                        ref={videoRef} 
                        className="absolute inset-0 w-full h-full object-cover" 
                        playsInline 
                        muted 
                        style={{ transform: 'scaleX(-1)' }} // Mirror effect for front camera
                    />
                    
                    {/* Target Circle Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-48 h-48 rounded-full border-4 transition-colors duration-300 ${isDownRef.current ? 'border-emerald-500 bg-emerald-500/20' : 'border-white/50 bg-white/10'}`}></div>
                    </div>

                    {/* Top Bar with Cancel */}
                    <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-start z-20 pointer-events-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-black/40 border border-white/10 text-white">
                            <Dumbbell size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">
                                Auto-Count
                            </span>
                        </div>
                        <button 
                            onClick={stopCounter} 
                            className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Counter Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                        <span className="text-white text-9xl font-black drop-shadow-2xl tabular-nums tracking-tighter">
                            {count}
                        </span>
                        <div className="mt-8 px-6 py-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                            <p className="text-white text-lg font-medium text-center">
                                {feedback}
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
