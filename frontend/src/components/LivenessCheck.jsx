import { useState, useRef, useEffect } from 'react';
import {
  initFaceMesh,
  detectLandmarks,
  computeHeadPose,
  classifyDirection,
  checkFaceDistance,
  generateRandomDirections,
  getDirectionInfo,
  destroyFaceMesh,
  THRESHOLDS,
} from '../services/livenessService';

/**
 * LivenessCheck v2 - Simplified architecture
 * 
 * Uses a SINGLE setInterval (80ms) for both face detection + progress tracking.
 * No requestAnimationFrame, no complex ref syncing, no stale closures.
 */
export default function LivenessCheck({ onLivenessPass, onError }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const holdStartRef = useRef(null);
  const tsCounterRef = useRef(1); // monotonic timestamp for MediaPipe

  // All mutable state in a single ref to avoid stale closures
  const stateRef = useRef({
    directions: [],
    currentIdx: 0,
    passedDirs: [],
    allPassed: false,
  });

  // Display-only state (triggers React re-renders for UI)
  const [status, setStatus] = useState('loading');
  const [displayDir, setDisplayDir] = useState('center');
  const [displayProgress, setDisplayProgress] = useState(0);
  const [displayPassed, setDisplayPassed] = useState([]);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [distanceWarn, setDistanceWarn] = useState(null);
  const [message, setMessage] = useState('Đang tải mô hình nhận diện...');
  const [allPassedUI, setAllPassedUI] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ yaw: 0, pitch: 0, dir: '-' });

  // Generate directions once
  const [directions] = useState(() => generateRandomDirections(3));

  // ── Initialize on mount ──
  useEffect(() => {
    stateRef.current.directions = directions;
    let cancelled = false;

    const start = async () => {
      try {
        setStatus('loading');
        setMessage('Đang tải mô hình nhận diện khuôn mặt...');
        await initFaceMesh();

        if (cancelled) return;
        setMessage('Đang mở camera...');

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });

        if (cancelled) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }

        // Wait for video to be ready
        await new Promise(resolve => {
          const check = () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              resolve();
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });

        if (cancelled) return;
        setStatus('active');
        setMessage('');

        // Start the SINGLE detection+progress interval
        startLoop();
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage('Lỗi: ' + (err.message || 'Không thể khởi tạo camera'));
          onError?.(err.message);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      stopLoop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      destroyFaceMesh();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── SINGLE interval: Detection + Progress ──
  const startLoop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      try {
        const s = stateRef.current;
        if (s.allPassed) return;
        if (!videoRef.current || videoRef.current.readyState < 2) return;

        // Use monotonic counter as timestamp (avoids MediaPipe timestamp issues)
        tsCounterRef.current += 80;
        const landmarks = detectLandmarks(videoRef.current, tsCounterRef.current);

        if (!landmarks) {
          setFaceDetected(false);
          setDisplayDir('center');
          setDistanceWarn(null);
          setDebugInfo(prev => ({ ...prev, dir: 'NO-FACE' }));
          holdStartRef.current = null;
          setDisplayProgress(0);
          return;
        }

        setFaceDetected(true);

        // Check distance
        const dist = checkFaceDistance(landmarks);
        if (dist === 'TOO_FAR') {
          setDistanceWarn('⚠️ Hãy đưa khuôn mặt gần màn hình hơn');
          holdStartRef.current = null;
          setDisplayProgress(0);
          return;
        }
        if (dist === 'TOO_CLOSE') {
          setDistanceWarn('⚠️ Hãy lùi khuôn mặt ra xa hơn');
          holdStartRef.current = null;
          setDisplayProgress(0);
          return;
        }
        setDistanceWarn(null);

        // Compute head direction
        const { yawRatio, pitchRatio } = computeHeadPose(landmarks);
        const dir = classifyDirection(yawRatio, pitchRatio);
        setDisplayDir(dir);
        setDebugInfo({ yaw: yawRatio, pitch: pitchRatio, dir: dir.toUpperCase() });

        // ── Progress tracking (inline, no separate timer) ──
        const targetDir = s.directions[s.currentIdx];
        if (!targetDir) return;

        if (dir === targetDir) {
          // Correct direction!
          if (!holdStartRef.current) {
            holdStartRef.current = performance.now();
          }
          const elapsed = performance.now() - holdStartRef.current;
          const pct = Math.min(100, (elapsed / THRESHOLDS.HOLD_DURATION) * 100);
          setDisplayProgress(pct);

          if (elapsed >= THRESHOLDS.HOLD_DURATION) {
            // ✅ Direction passed!
            s.passedDirs.push(targetDir);
            setDisplayPassed([...s.passedDirs]);
            setDisplayProgress(0);
            holdStartRef.current = null;

            if (s.currentIdx + 1 >= s.directions.length) {
              // All done!
              s.allPassed = true;
              setAllPassedUI(true);
              setMessage('✅ Xác thực người thật thành công!');
            } else {
              s.currentIdx++;
              setDisplayIdx(s.currentIdx);
            }
          }
        } else {
          // Wrong direction - reset hold timer
          holdStartRef.current = null;
          setDisplayProgress(0);
        }
      } catch (err) {
        console.error('[Liveness] Loop error (continues):', err.message);
      }
    }, 80); // ~12fps - stable and reliable
  };

  const stopLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // ── Trigger callback when all passed ──
  useEffect(() => {
    if (allPassedUI && videoRef.current) {
      const timer = setTimeout(() => {
        onLivenessPass?.(videoRef.current);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [allPassedUI, onLivenessPass]);

  // ── Derived UI ──
  const currentDirection = directions[displayIdx];
  const currentInfo = currentDirection ? getDirectionInfo(currentDirection) : null;

  const ovalColor =
    allPassedUI ? '#10b981' :
    !faceDetected ? 'rgba(255,255,255,0.3)' :
    distanceWarn ? '#ef4444' :
    displayProgress > 0 ? '#6366f1' :
    'rgba(255,255,255,0.5)';

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontSize: 24 }}>🔒</span>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Xác thực khuôn mặt</span>
      </div>

      {/* Camera + Oval */}
      <div style={cameraContainerStyle}>
        <video ref={videoRef} style={videoStyle} muted playsInline />

        {/* Oval mask */}
        <div style={ovalMaskStyle}>
          <div style={{
            ...ovalFrameStyle,
            borderColor: ovalColor,
            boxShadow: `0 0 20px ${ovalColor}40, inset 0 0 20px ${ovalColor}15`,
          }} />
        </div>

        {/* Dark corners */}
        <svg style={svgMaskStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <mask id="ovalMask">
              <rect x="0" y="0" width="100" height="100" fill="white" />
              <ellipse cx="50" cy="50" rx="35" ry="45" fill="black" />
            </mask>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.6)" mask="url(#ovalMask)" />
        </svg>

        {/* Direction arrow */}
        {status === 'active' && !allPassedUI && currentInfo && faceDetected && !distanceWarn && (
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

        {/* Loading */}
        {status === 'loading' && (
          <div style={loadingOverlayStyle}>
            <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
            <p style={{ color: '#a5b4fc', marginTop: 16, fontSize: '0.9rem' }}>{message}</p>
          </div>
        )}

        {/* Success */}
        {allPassedUI && (
          <div style={successOverlayStyle}>
            <div style={successIconStyle}>✅</div>
            <p style={{ color: '#a7f3d0', fontWeight: 700, fontSize: '1.1rem' }}>
              Xác thực thành công!
            </p>
          </div>
        )}

        {/* Debug overlay */}
        {status === 'active' && !allPassedUI && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: 'rgba(0,0,0,0.8)', color: '#a5b4fc',
            fontSize: '0.65rem', fontFamily: 'monospace',
            padding: '4px 8px', borderRadius: 6, zIndex: 15, lineHeight: 1.6,
          }}>
            <div>YAW: {debugInfo.yaw.toFixed(3)} | PITCH: {debugInfo.pitch.toFixed(3)}</div>
            <div>Dir: <span style={{ color: debugInfo.dir !== 'CENTER' && debugInfo.dir !== 'NO-FACE' ? '#10b981' : '#fca5a5', fontWeight: 700 }}>{debugInfo.dir}</span></div>
            <div>Target: {currentDirection?.toUpperCase() || '-'}</div>
          </div>
        )}
      </div>

      {/* Distance warning */}
      {distanceWarn && status === 'active' && !allPassedUI && (
        <div style={warningStyle}>{distanceWarn}</div>
      )}

      {/* No face warning */}
      {!faceDetected && status === 'active' && !allPassedUI && !distanceWarn && (
        <div style={warningStyle}>⚠️ Không tìm thấy khuôn mặt</div>
      )}

      {/* Instruction */}
      {status === 'active' && !allPassedUI && currentInfo && faceDetected && !distanceWarn && (
        <div style={instructionStyle}>
          <span style={instructionArrowStyle}>{currentInfo.arrow}</span>
          <span>{currentInfo.instruction}</span>
        </div>
      )}

      {/* Progress bar */}
      {status === 'active' && !allPassedUI && (
        <div style={progressContainerStyle}>
          <div style={progressTrackStyle}>
            <div style={{
              ...progressBarStyle,
              width: `${displayProgress}%`,
              background: displayProgress > 80 ?
                'linear-gradient(90deg, #6366f1, #10b981)' :
                'linear-gradient(90deg, #6366f1, #818cf8)',
            }} />
          </div>
          <span style={progressLabelStyle}>
            {displayPassed.length}/{directions.length}
          </span>
        </div>
      )}

      {/* Direction status pills */}
      {status === 'active' && directions.length > 0 && (
        <div style={dirStatusContainerStyle}>
          {directions.map((dir, idx) => {
            const info = getDirectionInfo(dir);
            const isPassed = displayPassed.includes(dir);
            const isCurrent = idx === displayIdx && !allPassedUI;
            return (
              <div key={dir} style={{
                ...dirStatusItemStyle,
                borderColor: isPassed ? '#10b981' : isCurrent ? '#6366f1' : 'rgba(255,255,255,0.1)',
                background: isPassed ? 'rgba(16, 185, 129, 0.1)' : isCurrent ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                color: isPassed ? '#a7f3d0' : isCurrent ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
              }}>
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
          <button className="btn btn-primary" onClick={() => window.location.reload()} type="button">
            🔄 Thử lại
          </button>
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const containerStyle = { width: '100%', maxWidth: 480, margin: '0 auto' };

const headerStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: 8, marginBottom: 16, color: '#e2e8f0',
};

const cameraContainerStyle = {
  position: 'relative', width: '100%', aspectRatio: '3 / 4',
  borderRadius: 20, overflow: 'hidden', background: '#0a0a0a',
  border: '2px solid rgba(255,255,255,0.1)',
};

const videoStyle = {
  width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)',
};

const ovalMaskStyle = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  pointerEvents: 'none',
};

const ovalFrameStyle = {
  width: '70%', height: '90%', borderRadius: '50%',
  border: '3px solid', transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
};

const svgMaskStyle = {
  position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
};

const arrowOverlayStyle = {
  position: 'absolute', zIndex: 5,
  animation: 'liveness-pulse 1.2s ease-in-out infinite',
};

const arrowTextStyle = {
  fontSize: 48, color: '#6366f1',
  textShadow: '0 0 20px rgba(99, 102, 241, 0.5)', fontWeight: 900,
};

const loadingOverlayStyle = {
  position: 'absolute', inset: 0,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.7)', zIndex: 10,
};

const successOverlayStyle = {
  position: 'absolute', inset: 0,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.5)', zIndex: 10,
};

const successIconStyle = {
  fontSize: 72, marginBottom: 12,
  animation: 'liveness-success 0.5s ease-out',
};

const warningStyle = {
  textAlign: 'center', marginTop: 12, padding: '10px 16px', borderRadius: 8,
  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
  color: '#fca5a5', fontSize: '0.9rem', fontWeight: 600,
};

const instructionStyle = {
  textAlign: 'center', marginTop: 12, padding: '12px 16px', borderRadius: 8,
  background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
  color: '#a5b4fc', fontSize: '1.05rem', fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
};

const instructionArrowStyle = {
  fontSize: '1.4rem', animation: 'liveness-pulse 1.2s ease-in-out infinite',
};

const progressContainerStyle = {
  display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
};

const progressTrackStyle = {
  flex: 1, height: 8, borderRadius: 4,
  background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
};

const progressBarStyle = {
  height: '100%', borderRadius: 4, transition: 'width 0.1s linear',
};

const progressLabelStyle = {
  fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)',
  minWidth: 30, textAlign: 'right',
};

const dirStatusContainerStyle = {
  display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap',
};

const dirStatusItemStyle = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
  borderRadius: 8, border: '1px solid', transition: 'all 0.3s ease',
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
