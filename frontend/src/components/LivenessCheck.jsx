import { useState, useRef, useEffect, useCallback } from 'react';
import {
  initFaceMesh,
  detectLandmarks,
  computeHeadPose,
  classifyDirection,
  checkFaceDistance,
  isFaceInOval,
  generateRandomDirections,
  getDirectionInfo,
  destroyFaceMesh,
  THRESHOLDS,
} from '../services/livenessService';

/**
 * Agribank-style liveness detection component
 * 
 * Features:
 * - Oval face frame overlay
 * - Real-time MediaPipe Face Mesh detection
 * - Random 3/4 head direction challenges
 * - Auto progress bar (hold 2s to pass each direction)
 * - Face distance warnings (too far / too close)
 * - Fully automatic - no button clicks needed
 * 
 * @param {Object} props
 * @param {(videoEl: HTMLVideoElement) => void} props.onLivenessPass - Called when all directions passed
 * @param {(error: string) => void} [props.onError] - Called on error
 */
export default function LivenessCheck({ onLivenessPass, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const holdStartRef = useRef(null);

  const [status, setStatus] = useState('loading'); // loading | ready | active | error
  const [directions, setDirections] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [passedDirs, setPassedDirs] = useState([]);
  const [progress, setProgress] = useState(0); // 0-100
  const [distanceStatus, setDistanceStatus] = useState('OK');
  const [detectedDir, setDetectedDir] = useState('center');
  const [faceDetected, setFaceDetected] = useState(false);
  const [message, setMessage] = useState('Đang tải mô hình nhận diện...');
  const [allPassed, setAllPassed] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ yaw: 0, pitch: 0, dir: 'center' });

  // ── Initialize ──────────────────────────────────────────────────
  useEffect(() => {
    const dirs = generateRandomDirections(3);
    setDirections(dirs);
    init();

    return () => cleanup();
  }, []);

  const init = async () => {
    try {
      setStatus('loading');
      setMessage('Đang tải mô hình nhận diện khuôn mặt...');

      // Load MediaPipe model
      await initFaceMesh();

      setMessage('Đang mở camera...');

      // Start camera
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => {
          if (e.name !== 'AbortError') console.warn('Camera play error:', e);
        });
      }

      setStatus('active');
      setMessage('');

      // Start detection loop
      startDetectionLoop();
    } catch (err) {
      setStatus('error');
      setMessage('Lỗi: ' + (err.message || 'Không thể khởi tạo camera'));
      onError?.(err.message);
    }
  };

  const cleanup = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    destroyFaceMesh();
  }, []);

  // ── Real-time detection loop ────────────────────────────────────
  const startDetectionLoop = useCallback(() => {
    let lastTimestamp = 0;
    let frameCount = 0;

    const loop = (timestamp) => {
      // Always schedule next frame FIRST so loop never dies
      animFrameRef.current = requestAnimationFrame(loop);

      if (!videoRef.current || videoRef.current.readyState < 2) {
        return;
      }

      // Throttle to ~20fps (every 50ms) to reduce React re-render pressure
      if (timestamp - lastTimestamp < 50) {
        return;
      }
      lastTimestamp = timestamp;
      frameCount++;

      try {
        // MediaPipe requires integer timestamps in ms
        const tsMs = Math.floor(timestamp);
        const landmarks = detectLandmarks(videoRef.current, tsMs);

        if (!landmarks) {
          setFaceDetected(false);
          setDetectedDir('center');
          setProgress(0);
          holdStartRef.current = null;
          setDistanceStatus('OK');
          setDebugInfo(prev => ({ ...prev, dir: 'no-face' }));
          return;
        }

        setFaceDetected(true);

        // Check face distance
        const dist = checkFaceDistance(landmarks);
        setDistanceStatus(dist);

        if (dist !== 'OK') {
          setProgress(0);
          holdStartRef.current = null;
          setDetectedDir('center');
          return;
        }

        // Compute head pose
        const { yawRatio, pitchRatio } = computeHeadPose(landmarks);
        const dir = classifyDirection(yawRatio, pitchRatio);
        setDetectedDir(dir);
        setDebugInfo({ yaw: yawRatio, pitch: pitchRatio, dir });

        // Draw landmarks on canvas (only every 2nd frame to save CPU)
        if (frameCount % 2 === 0) {
          drawLandmarks(landmarks);
        }
      } catch (err) {
        console.error('[LivenessLoop] Frame error (loop continues):', err.message);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Progress tracking (separate from detection to avoid stale closures) ──
  useEffect(() => {
    if (status !== 'active' || allPassed) return;
    if (directions.length === 0) return;

    const targetDir = directions[currentIdx];
    if (!targetDir) return;

    if (detectedDir === targetDir && distanceStatus === 'OK' && faceDetected) {
      if (!holdStartRef.current) {
        holdStartRef.current = performance.now();
      }
      const elapsed = performance.now() - holdStartRef.current;
      const pct = Math.min(100, (elapsed / THRESHOLDS.HOLD_DURATION) * 100);
      setProgress(pct);

      if (elapsed >= THRESHOLDS.HOLD_DURATION) {
        // Direction passed!
        const newPassed = [...passedDirs, targetDir];
        setPassedDirs(newPassed);
        setProgress(0);
        holdStartRef.current = null;

        if (currentIdx + 1 >= directions.length) {
          // All directions passed!
          setAllPassed(true);
          setMessage('✅ Xác thực người thật thành công!');
        } else {
          setCurrentIdx(prev => prev + 1);
        }
      }
    } else {
      // Wrong direction or conditions not met - reset progress
      if (holdStartRef.current) {
        holdStartRef.current = null;
        setProgress(0);
      }
    }
  }, [detectedDir, distanceStatus, faceDetected, status, allPassed, currentIdx, directions, passedDirs]);

  // ── Trigger callback when all passed ──
  useEffect(() => {
    if (allPassed && videoRef.current) {
      // Small delay to show success state
      const timer = setTimeout(() => {
        onLivenessPass?.(videoRef.current);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [allPassed, onLivenessPass]);

  // ── Draw face mesh landmarks on canvas ──
  const drawLandmarks = useCallback((landmarks) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dots at key landmarks
    const keyPoints = [1, 33, 263, 152, 10, 61, 291, 133, 362, 159, 386];
    ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
    keyPoints.forEach(idx => {
      if (landmarks[idx]) {
        const x = landmarks[idx].x * canvas.width;
        const y = landmarks[idx].y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw face mesh connections (simplified - just contour)
    const contourIndices = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
      397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
      172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
    ];
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    contourIndices.forEach((idx, i) => {
      if (landmarks[idx]) {
        const x = landmarks[idx].x * canvas.width;
        const y = landmarks[idx].y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }, []);

  // ── Derived UI state ──
  const currentDirection = directions[currentIdx];
  const currentInfo = currentDirection ? getDirectionInfo(currentDirection) : null;

  const ovalColor =
    allPassed ? '#10b981' :
    !faceDetected ? 'rgba(255,255,255,0.3)' :
    distanceStatus !== 'OK' ? '#ef4444' :
    progress > 0 ? '#6366f1' :
    'rgba(255,255,255,0.5)';

  const getWarningMessage = () => {
    if (!faceDetected) return '⚠️ Không tìm thấy khuôn mặt';
    if (distanceStatus === 'TOO_FAR') return '⚠️ Hãy đưa khuôn mặt gần màn hình hơn';
    if (distanceStatus === 'TOO_CLOSE') return '⚠️ Hãy lùi khuôn mặt ra xa hơn';
    return null;
  };

  const warningMsg = getWarningMessage();

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontSize: 24 }}>🔒</span>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Xác thực khuôn mặt</span>
      </div>

      {/* Camera + Oval Frame */}
      <div style={cameraContainerStyle}>
        {/* Video (mirrored) */}
        <video
          ref={videoRef}
          style={videoStyle}
          muted
          playsInline
        />

        {/* Canvas overlay for landmarks */}
        <canvas
          ref={canvasRef}
          style={canvasStyle}
        />

        {/* Oval mask overlay */}
        <div style={ovalMaskStyle}>
          <div style={{
            ...ovalFrameStyle,
            borderColor: ovalColor,
            boxShadow: `0 0 20px ${ovalColor}40, inset 0 0 20px ${ovalColor}15`,
          }} />
        </div>

        {/* Dark corners outside oval */}
        <svg style={svgMaskStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <mask id="ovalMask">
              <rect x="0" y="0" width="100" height="100" fill="white" />
              <ellipse cx="50" cy="50" rx="35" ry="45" fill="black" />
            </mask>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.6)" mask="url(#ovalMask)" />
        </svg>

        {/* Direction arrow overlay */}
        {status === 'active' && !allPassed && currentInfo && faceDetected && !warningMsg && (
          <div style={{
            ...arrowOverlayStyle,
            ...(currentDirection === 'left' ? { left: 16, top: '50%', transform: 'translateY(-50%)' } :
               currentDirection === 'right' ? { right: 16, top: '50%', transform: 'translateY(-50%)' } :
               currentDirection === 'up' ? { top: 16, left: '50%', transform: 'translateX(-50%)' } :
               { bottom: 16, left: '50%', transform: 'translateX(-50%)' }),
          }}>
            <span style={arrowTextStyle}>{currentInfo.arrow}</span>
          </div>
        )}

        {/* Loading overlay */}
        {status === 'loading' && (
          <div style={loadingOverlayStyle}>
            <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
            <p style={{ color: '#a5b4fc', marginTop: 16, fontSize: '0.9rem' }}>{message}</p>
          </div>
        )}

        {/* Success overlay */}
        {allPassed && (
          <div style={successOverlayStyle}>
            <div style={successIconStyle}>✅</div>
            <p style={{ color: '#a7f3d0', fontWeight: 700, fontSize: '1.1rem' }}>
              Xác thực thành công!
            </p>
          </div>
        )}

        {/* Debug overlay - shows real-time detection values */}
        {status === 'active' && !allPassed && (
          <div style={{
            position: 'absolute',
            bottom: 8, left: 8,
            background: 'rgba(0,0,0,0.75)',
            color: '#a5b4fc',
            fontSize: '0.65rem',
            fontFamily: 'monospace',
            padding: '4px 8px',
            borderRadius: 6,
            zIndex: 15,
            lineHeight: 1.5,
          }}>
            <div>YAW: {debugInfo.yaw.toFixed(3)} | PITCH: {debugInfo.pitch.toFixed(3)}</div>
            <div>Detected: <span style={{ color: debugInfo.dir !== 'center' ? '#10b981' : '#fca5a5', fontWeight: 700 }}>{debugInfo.dir.toUpperCase()}</span></div>
          </div>
        )}
      </div>

      {/* Warning message */}
      {warningMsg && status === 'active' && !allPassed && (
        <div style={warningStyle}>
          {warningMsg}
        </div>
      )}

      {/* Instruction text */}
      {status === 'active' && !allPassed && currentInfo && !warningMsg && faceDetected && (
        <div style={instructionStyle}>
          <span style={instructionArrowStyle}>{currentInfo.arrow}</span>
          <span>{currentInfo.instruction}</span>
        </div>
      )}

      {/* Progress bar */}
      {status === 'active' && !allPassed && (
        <div style={progressContainerStyle}>
          <div style={progressTrackStyle}>
            <div style={{
              ...progressBarStyle,
              width: `${progress}%`,
              background: progress > 80 ? 
                'linear-gradient(90deg, #6366f1, #10b981)' : 
                'linear-gradient(90deg, #6366f1, #818cf8)',
            }} />
          </div>
          <span style={progressLabelStyle}>
            {passedDirs.length}/{directions.length}
          </span>
        </div>
      )}

      {/* Direction status indicators */}
      {status === 'active' && directions.length > 0 && (
        <div style={dirStatusContainerStyle}>
          {directions.map((dir, idx) => {
            const info = getDirectionInfo(dir);
            const isPassed = passedDirs.includes(dir);
            const isCurrent = idx === currentIdx && !allPassed;
            return (
              <div
                key={dir}
                style={{
                  ...dirStatusItemStyle,
                  borderColor: isPassed ? '#10b981' : isCurrent ? '#6366f1' : 'rgba(255,255,255,0.1)',
                  background: isPassed ? 'rgba(16, 185, 129, 0.1)' : isCurrent ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                  color: isPassed ? '#a7f3d0' : isCurrent ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
                }}
              >
                <span>{isPassed ? '✅' : isCurrent ? '🔄' : '⬜'}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{info.labelVi}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: 12 }}>{message}</p>
          <button className="btn btn-primary" onClick={init} type="button">
            🔄 Thử lại
          </button>
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const containerStyle = {
  width: '100%',
  maxWidth: 480,
  margin: '0 auto',
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 16,
  color: '#e2e8f0',
};

const cameraContainerStyle = {
  position: 'relative',
  width: '100%',
  aspectRatio: '3 / 4',
  borderRadius: 20,
  overflow: 'hidden',
  background: '#0a0a0a',
  border: '2px solid rgba(255,255,255,0.1)',
};

const videoStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transform: 'scaleX(-1)', // Mirror
};

const canvasStyle = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover', // Match video cropping
  pointerEvents: 'none',
  transform: 'scaleX(-1)', // Mirror to match video
};

const ovalMaskStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
};

const ovalFrameStyle = {
  width: '70%',
  height: '90%',
  borderRadius: '50%',
  border: '3px solid',
  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
};

const svgMaskStyle = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
};

const arrowOverlayStyle = {
  position: 'absolute',
  zIndex: 5,
  animation: 'liveness-pulse 1.2s ease-in-out infinite',
};

const arrowTextStyle = {
  fontSize: 48,
  color: '#6366f1',
  textShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
  fontWeight: 900,
};

const loadingOverlayStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.7)',
  zIndex: 10,
};

const successOverlayStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.5)',
  zIndex: 10,
};

const successIconStyle = {
  fontSize: 72,
  marginBottom: 12,
  animation: 'liveness-success 0.5s ease-out',
};

const warningStyle = {
  textAlign: 'center',
  marginTop: 12,
  padding: '10px 16px',
  borderRadius: 8,
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: '#fca5a5',
  fontSize: '0.9rem',
  fontWeight: 600,
};

const instructionStyle = {
  textAlign: 'center',
  marginTop: 12,
  padding: '12px 16px',
  borderRadius: 8,
  background: 'rgba(99, 102, 241, 0.08)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  color: '#a5b4fc',
  fontSize: '1.05rem',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const instructionArrowStyle = {
  fontSize: '1.4rem',
  animation: 'liveness-pulse 1.2s ease-in-out infinite',
};

const progressContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginTop: 12,
};

const progressTrackStyle = {
  flex: 1,
  height: 8,
  borderRadius: 4,
  background: 'rgba(255,255,255,0.08)',
  overflow: 'hidden',
};

const progressBarStyle = {
  height: '100%',
  borderRadius: 4,
  transition: 'width 0.1s linear',
};

const progressLabelStyle = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.5)',
  minWidth: 30,
  textAlign: 'right',
};

const dirStatusContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: 8,
  marginTop: 12,
  flexWrap: 'wrap',
};

const dirStatusItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid',
  transition: 'all 0.3s ease',
};

// Inject keyframe animations
if (typeof document !== 'undefined') {
  const styleId = 'liveness-check-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes liveness-pulse {
        0%, 100% { opacity: 1; transform: scale(1) translateY(-50%); }
        50% { opacity: 0.6; transform: scale(1.15) translateY(-50%); }
      }
      @keyframes liveness-success {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
}
