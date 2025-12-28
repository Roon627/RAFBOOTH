import React, { useRef, useState, useEffect, useCallback } from 'react';

interface CameraProps {
  currentPhotoIndex: number;
  totalPhotos: number;
  onCapture: (image: string) => void;
  onCancel: () => void;
}

const Camera: React.FC<CameraProps> = ({ currentPhotoIndex, totalPhotos, onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Clean up any active camera streams
  const killCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // This is the heavy lifter that handles all the device-finding magic
  const wakeCamera = useCallback(async () => {
    setError(null);
    setIsInitialized(false);
    killCamera();

    // First try: The "ideal" setup for a photo booth (selfie mode)
    const highQualitySelfie = {
      video: { 
        facingMode: 'user', 
        width: { ideal: 1280 }, 
        height: { ideal: 720 } 
      },
      audio: false
    };

    // Second try: Just give us anything that works if the above fails
    const justGiveMeAnyVideo = {
      video: true,
      audio: false
    };

    try {
      let stream: MediaStream;
      
      try {
        // Try the fancy constraints first
        stream = await navigator.mediaDevices.getUserMedia(highQualitySelfie);
      } catch (e: any) {
        console.warn("Selfie constraints were too picky, falling back to basic video.", e);
        // This is where we catch "Requested device not found" - we try the simplest possible request
        stream = await navigator.mediaDevices.getUserMedia(justGiveMeAnyVideo);
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for metadata to be sure it's actually ready
        videoRef.current.onloadedmetadata = () => {
          setIsInitialized(true);
        };
      }
    } catch (err: any) {
      console.error("Camera died in the void:", err);
      // Map the weird browser errors into something a human actually understands
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Looks like camera access was denied. You'll need to enable it in your settings to snap photos!");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("Can't find a camera connected to this device. If you're on a PC, check your webcam plug!");
      } else {
        setError(`Portal Error: ${err.message || "Something went wrong waking the camera."}`);
      }
    }
  }, []);

  useEffect(() => {
    wakeCamera();
    return () => killCamera();
  }, [wakeCamera]);

  // Handle that 3-2-1 timer before we snap the pic
  const handleSnapClick = () => {
    if (!isInitialized || countdown !== null) return;
    
    setCountdown(3);
    const ticker = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(ticker);
          doCapture();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const doCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Grab dimensions from the actual video stream
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const dim = Math.min(vw, vh);
      
      // We want a nice square snap
      canvas.width = 800;
      canvas.height = 800;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror it so it feels natural to the user
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        
        // Crop it to a square in the center
        const sx = (vw - dim) / 2;
        const sy = (vh - dim) / 2;
        ctx.drawImage(video, sx, sy, dim, dim, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        onCapture(canvas.toDataURL('image/png'));
      }
    }
  };

  // If the camera won't play ball, show an error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-black/80 border-2 border-red-500/20 rounded-[3rem] backdrop-blur-xl max-w-md text-center animate-fadeIn shadow-2xl">
        <div className="text-6xl mb-6">🕯️</div>
        <h3 className="text-2xl font-halloween text-red-400 mb-4">Portal Connection Failed</h3>
        <p className="text-white/60 mb-8">{error}</p>
        <div className="flex flex-col w-full gap-3">
          <button onClick={wakeCamera} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-400 transition-all">TRY AGAIN</button>
          <button onClick={onCancel} className="w-full py-4 bg-white/5 text-white/40 rounded-2xl font-bold">GO BACK</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 animate-fadeIn">
      <div className="text-center">
        <h3 className="text-3xl font-halloween text-white mb-2 uppercase tracking-tighter">SNAP {currentPhotoIndex + 1} OF {totalPhotos}</h3>
        <p className="text-purple-300/60 text-sm font-bold uppercase tracking-widest">Strike a pose!</p>
      </div>

      <div className="relative w-full max-w-md aspect-square bg-black rounded-[3rem] overflow-hidden shadow-2xl border-[10px] border-white/5">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${isInitialized ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {!isInitialized && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0a1f]">
            <div className="w-10 h-10 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-[10px] text-orange-400/50 font-bold uppercase tracking-widest">Summoning Camera...</p>
          </div>
        )}

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
            <span className="text-[10rem] font-halloween text-orange-400 animate-ping drop-shadow-[0_0_30px_rgba(249,115,22,0.6)]">
              {countdown}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-4 w-full max-w-md px-4">
        <button onClick={onCancel} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white/40 rounded-2xl font-bold transition-all border border-white/10">CANCEL</button>
        <button 
          onClick={handleSnapClick}
          disabled={!isInitialized || countdown !== null}
          className="flex-[2] py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-halloween text-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          CAPTURE 📸
        </button>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Camera;