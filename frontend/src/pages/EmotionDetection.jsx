import { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';

const EMOJI = { neutral:'😐', happy:'😊', sad:'😢', angry:'😠', surprised:'😲', fearful:'😨', disgusted:'🤢' };
const BAR_COLORS = { neutral:'#6c63ff', happy:'#10b981', sad:'#3b82f6', angry:'#ef4444', surprised:'#f59e0b', fearful:'#a855f7', disgusted:'#ec4899' };
const EMOTIONS = Object.keys(EMOJI);
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

export default function EmotionDetection() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelError, setModelError] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [bars, setBars] = useState({});
  const [dominant, setDominant] = useState({ name: 'neutral', emoji: '😐', conf: 0 });
  const [timeline, setTimeline] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const faceapiRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastLogRef = useRef(0);

  // Load face-api.js from CDN dynamically
  useEffect(() => {
    if (window.faceapi) { faceapiRef.current = window.faceapi; loadModels(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
    script.onload = () => { faceapiRef.current = window.faceapi; loadModels(); };
    script.onerror = () => setModelError('Failed to load face-api.js library');
    document.head.appendChild(script);
  }, []);

  const loadModels = async () => {
    try {
      const fa = faceapiRef.current;
      await fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await fa.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    } catch (e) { setModelError(e.message); }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setStreaming(true);
      startTimeRef.current = Date.now();
      setTimeline([]);
      videoRef.current.onplaying = () => startDetection();
    } catch { alert('Camera access denied.'); }
  };

  const stopCamera = () => {
    clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setStreaming(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const startDetection = () => {
    const fa = faceapiRef.current;
    const opts = new fa.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current?.videoWidth) return;
      const dets = await fa.detectAllFaces(videoRef.current, opts).withFaceExpressions();
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (!dets.length) { setBars({}); return; }
      const ex = dets[0].expressions;
      const box = dets[0].detection.box;
      ctx.strokeStyle = '#6c63ff'; ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      let best = 'neutral', bestV = 0;
      for (const [k, v] of Object.entries(ex)) { if (v > bestV) { bestV = v; best = k; } }
      setDominant({ name: best, emoji: EMOJI[best], conf: bestV });
      setBars(ex);
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (elapsed - lastLogRef.current >= 3) {
        lastLogRef.current = elapsed;
        setTimeline(prev => [...prev.slice(-14), { time: elapsed, emotion: best, conf: bestV }]);
      }
    }, 500);
  };

  useEffect(() => () => { clearInterval(intervalRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  return (
    <>
      <Navbar />
      <div className="page-body">
        <div className="page-header">
          <div><h1>Emotion <span className="text-accent">Detection</span></h1><p className="text-muted">Real-time facial expression analysis during your interview practice.</p></div>
        </div>

        {!modelsLoaded && !modelError && <div className="loading-bar"><div className="loader-spinner" /> Loading AI face detection models…</div>}
        {modelError && <div className="loading-bar error">❌ {modelError}</div>}
        {modelsLoaded && <div className="loading-bar success">✅ AI models loaded — ready!</div>}

        <div style={{marginBottom:16}}>
          {!streaming ? <button className="btn btn-primary" disabled={!modelsLoaded} onClick={startCamera}>📷 Start Camera</button>
            : <button className="btn btn-outline" onClick={stopCamera}>⏹ Stop</button>}
        </div>

        <div className="emo-grid">
          <div className="video-wrap">
            {!streaming && <div className="video-placeholder"><span style={{fontSize:48,opacity:.3}}>📷</span><span>Click Start Camera</span></div>}
            <video ref={videoRef} autoPlay muted playsInline style={{width:'100%',height:'100%',objectFit:'cover',display:streaming?'block':'none',transform:'scaleX(-1)'}} />
            <canvas ref={canvasRef} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',transform:'scaleX(-1)'}} />
            {streaming && (
              <>
                <div className="video-status"><div className="status-dot live" /> LIVE</div>
                <div className="current-emo"><span style={{fontSize:28}}>{dominant.emoji}</span><div><div style={{fontWeight:700,textTransform:'capitalize'}}>{dominant.name}</div><div className="text-muted text-sm">{Math.round(dominant.conf*100)}%</div></div></div>
              </>
            )}
          </div>

          <div className="emo-sidebar">
            <div className="chart-card">
              <h3 className="chart-title">📊 Live Emotion Levels</h3>
              {EMOTIONS.map(e => {
                const val = Math.round((bars[e] || 0) * 100);
                return (
                  <div key={e} className="emo-bar-row">
                    <span className="emo-bar-label">{EMOJI[e]} {e}</span>
                    <div className="emo-bar-track"><div className="emo-bar-fill" style={{width:`${val}%`,background:BAR_COLORS[e]}} /></div>
                    <span className="emo-bar-pct">{val}%</span>
                  </div>
                );
              })}
            </div>
            <div className="chart-card">
              <h3 className="chart-title">🕒 Timeline</h3>
              <div style={{maxHeight:180,overflowY:'auto'}}>
                {timeline.length === 0 ? <p className="text-muted text-center" style={{padding:12}}>Start camera to see timeline</p>
                  : [...timeline].reverse().map((t, i) => {
                    const m = String(Math.floor(t.time/60)).padStart(2,'0');
                    const s = String(t.time%60).padStart(2,'0');
                    return <div key={i} className="timeline-row"><span className="tl-time">{m}:{s}</span><span>{EMOJI[t.emotion]}</span><span className="tl-name">{t.emotion}</span><span className="text-muted text-sm">{Math.round(t.conf*100)}%</span></div>;
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
