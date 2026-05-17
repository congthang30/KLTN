import { useState, useRef, useEffect, useCallback } from 'react';
import { loadModels, detectFace } from '../services/faceService';
import LivenessCheck from './LivenessCheck';

/**
 * FaceCapture component with optional liveness detection
 * 
 * When requireLiveness=true (default): Uses LivenessCheck with MediaPipe for
 * Agribank-style head direction challenges, then extracts face embedding via face-api.js
 * 
 * When requireLiveness=false: Legacy mode with upload/camera (for demo/testing)
 */
export default function FaceCapture({ onCapture, onError, autoStart = false, requireLiveness = true }) {
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  
  const [mode, setMode] = useState('upload');
  const [status, setStatus] = useState('idle');
  const [stream, setStream] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState('Choose an option to begin.');
  const [extractingEmbedding, setExtractingEmbedding] = useState(false);

  useEffect(() => {
    if (!requireLiveness && autoStart && mode === 'camera') startCamera();
    return () => stopCamera();
  }, [mode, requireLiveness]);

  // ── Liveness mode: after liveness passes, extract face embedding ──
  const handleLivenessPass = async (videoElement) => {
    setExtractingEmbedding(true);
    try {
      // Load face-api.js models
      await loadModels();

      // Extract 128-dim face embedding from the current video frame
      const embedding = await detectFace(videoElement);

      if (!embedding) {
        // Retry once with a small delay
        await new Promise(r => setTimeout(r, 500));
        const retry = await detectFace(videoElement);
        if (!retry) {
          setExtractingEmbedding(false);
          onError?.('Không thể trích xuất face embedding. Vui lòng thử lại.');
          return;
        }
        onCapture?.(retry);
      } else {
        onCapture?.(embedding);
      }
    } catch (err) {
      onError?.('Lỗi trích xuất face embedding: ' + err.message);
    } finally {
      setExtractingEmbedding(false);
    }
  };

  // ── Legacy camera mode (requireLiveness=false) ──
  const startCamera = async () => {
    setStatus('loading');
    setMessage('Loading face recognition models...');

    try {
      await loadModels();
      setMessage('Accessing camera...');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setStatus('ready');
      setMessage('Camera ready. Click "Scan Face" to capture.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed to start camera');
      onError?.(err.message);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStatus('idle');
  }, [stream]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('loading');
    setMessage('Loading models...');
    try {
      await loadModels();
      
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
        setStatus('ready');
        setMessage('Image loaded successfully. Click "Scan Uploaded Image" below.');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setStatus('error');
      setMessage('Model load failed: ' + err.message);
      onError?.(err.message);
    }
  };

  const scanFace = async () => {
    const elementToScan = mode === 'camera' ? videoRef.current : imageRef.current;
    if (!elementToScan) return;

    setStatus('scanning');
    setMessage(mode === 'camera' ? 'Scanning face from camera...' : 'Analyzing uploaded photo...');

    try {
      const embedding = await detectFace(elementToScan);

      if (!embedding) {
        setStatus('ready');
        setMessage(
          mode === 'camera' 
            ? 'No face detected in video feed. Please try again.' 
            : 'No face detected in the photo. Please upload a clear, front-facing portrait.'
        );
        return;
      }

      setStatus('captured');
      setMessage('Face analyzed successfully! ✅');
      onCapture?.(embedding);
    } catch (err) {
      setStatus('error');
      setMessage('Face scan failed: ' + err.message);
      onError?.(err.message);
    }
  };

  // ── LIVENESS MODE ──
  if (requireLiveness) {
    return (
      <div style={{ width: '100%' }}>
        {extractingEmbedding ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
          }}>
            <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4, margin: '0 auto' }} />
            <p style={{ marginTop: 16, color: 'var(--accent)', fontWeight: 600 }}>
              Đang trích xuất face embedding...
            </p>
          </div>
        ) : (
          <LivenessCheck
            onLivenessPass={handleLivenessPass}
            onError={onError}
          />
        )}
      </div>
    );
  }

  // ── LEGACY MODE (requireLiveness=false) ──
  const statusColors = {
    idle: 'var(--text-muted)',
    loading: 'var(--warning)',
    ready: 'var(--accent)',
    scanning: 'var(--warning)',
    captured: 'var(--success)',
    error: 'var(--danger)',
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Mode Selector Tabs */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
        <button
          type="button"
          className={`btn ${mode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setMode('upload'); stopCamera(); setPreviewUrl(null); setStatus('idle'); setMessage('Please select a photo file.'); }}
        >
          📁 Upload Photo
        </button>
        <button
          type="button"
          className={`btn ${mode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setMode('camera'); setPreviewUrl(null); setStatus('idle'); setMessage('Click "Start Camera" below.'); }}
        >
          📷 Live Camera
        </button>
      </div>

      {/* Capture Screen Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: `2px solid ${statusColors[status]}`,
        background: '#000',
        aspectRatio: '4/3',
        transition: 'border-color 0.3s ease',
      }}>
        {/* Mode 1: Camera Feed */}
        {mode === 'camera' && (
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            muted
            playsInline
          />
        )}

        {/* Mode 2: Upload Preview */}
        {mode === 'upload' && previewUrl && (
          <img
            ref={imageRef}
            src={previewUrl}
            alt="Face Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Overlay Spinner / Inactive placeholder */}
        {status === 'scanning' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)',
          }}>
            <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
          </div>
        )}

        {((mode === 'camera' && (status === 'idle' || status === 'loading')) || 
          (mode === 'upload' && !previewUrl)) && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', flexDirection: 'column', gap: 12,
          }}>
            <span style={{ fontSize: 48 }}>{mode === 'camera' ? '📷' : '📁'}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {mode === 'camera' 
                ? (status === 'loading' ? 'Initializing...' : 'Camera inactive') 
                : 'No image uploaded yet'}
            </span>
          </div>
        )}
      </div>

      {/* Message feedback */}
      <p style={{
        textAlign: 'center', marginTop: 12,
        color: statusColors[status], fontSize: '0.9rem', fontWeight: 500,
        minHeight: 24,
      }}>
        {message}
      </p>

      {/* Controls Container */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12, flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Upload Mode Inputs */}
        {mode === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              📁 Choose Photo File
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
            </label>
            
            {previewUrl && status === 'ready' && (
              <button className="btn btn-success btn-lg" onClick={scanFace}>
                🔍 Scan Uploaded Image
              </button>
            )}
          </div>
        )}

        {/* Camera Mode Inputs */}
        {mode === 'camera' && (
          <div style={{ display: 'flex', gap: 12 }}>
            {status === 'idle' && (
              <button className="btn btn-primary" onClick={startCamera}>
                📷 Start Camera
              </button>
            )}
            {status === 'ready' && (
              <button className="btn btn-success btn-lg" onClick={scanFace}>
                🔍 Scan Face
              </button>
            )}
            {(status === 'ready' || status === 'captured' || status === 'error') && (
              <button className="btn btn-ghost" onClick={stopCamera}>
                Stop Camera
              </button>
            )}
          </div>
        )}

        {/* General Reset Control */}
        {status === 'captured' && (
          <button 
            className="btn btn-secondary" 
            onClick={() => { 
              setStatus('idle'); 
              setPreviewUrl(null); 
              setMessage(mode === 'camera' ? 'Camera inactive.' : 'Please upload a photo file.'); 
            }}
          >
            🔄 Reset & Choose Another
          </button>
        )}
      </div>
    </div>
  );
}
