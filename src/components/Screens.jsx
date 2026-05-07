import { useEffect, useRef, useState } from 'react';
import {
  AppBar, AICard, ProgressBar, MetaRow,
  SuccessBanner, StoneIcon, StickyBottom,
} from './UI.jsx';
import { aiEnabled, recognizeObject, generateExplanation } from '../lib/gemini.js';

// Screen 1: Home
export function HomeScreen({ onNext }) {
  return (
    <div className="screen">
      <div className="hero-section">
        <div className="hero-deco" />
        <div className="hero-deco2" />
        <div className="hero-eyebrow">Nationalmuseum, Stockholm</div>
        <div className="hero-title">AI<br />Museum<br />Guide</div>
        <p className="hero-sub" style={{ marginTop: 10 }}>
          Personalized storytelling<br />through Nationalmuseum
        </p>
      </div>
      <div className="scroll-area" style={{ paddingTop: 24 }}>
        <div className="section-eye">Your visit, your way</div>
        <div className="section-title">Discover exhibits tailored to you</div>
        <p className="body-para" style={{ marginBottom: 20 }}>
          Choose your time, interests, and preferred learning style, and we'll build
          a personalised route through Nationalmuseum.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <span className="tag-pill">Smart Routes</span>
          <span className="tag-pill">Object Recognition</span>
          <span className="tag-pill">Story Mode</span>
        </div>
        {!aiEnabled && (
          <p style={{ fontSize: 11, color: 'var(--stone)', marginTop: 16 }}>
            Demo mode: add a free OpenRouter API key to <code>.env</code> for live AI.
          </p>
        )}
      </div>
      <StickyBottom>
        <button className="btn btn-primary" onClick={onNext}>
          Start my visit&nbsp;<i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </button>
      </StickyBottom>
    </div>
  );
}

// Screen 2: Visit Setup
export function VisitSetupScreen({ onBack, onNext, setup, setSetup }) {
  const update = (key, val) => setSetup(s => ({ ...s, [key]: val }));

  const ChipGroup = ({ options, selected, onSelect }) => (
    <div className="chip-row">
      {options.map(opt => (
        <div
          key={opt}
          className={`chip${selected === opt ? ' chip--selected' : ''}`}
          onClick={() => onSelect(opt)}
          role="button"
          aria-pressed={selected === opt}
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onSelect(opt)}
        >
          {opt}
        </div>
      ))}
    </div>
  );

  return (
    <div className="screen">
      <AppBar title="Set up your visit" subtitle="Personalise your route" onBack={onBack} />
      <div className="scroll-area">
        <ProgressBar pct={33} />
        <div className="card">
          <div className="card__title">How much time do you have?</div>
          <ChipGroup options={['60 min', '90 min', '120 min']} selected={setup.time} onSelect={v => update('time', v)} />
        </div>
        <div className="card">
          <div className="card__title">What are you interested in?</div>
          <ChipGroup
            options={['General history', 'Applied arts', 'Design & craft', 'Nordic art']}
            selected={setup.interest}
            onSelect={v => update('interest', v)}
          />
        </div>
        <div className="card">
          <div className="card__title">How would you like to learn?</div>
          <ChipGroup options={['Story-based', 'Chronological', 'Thematic']} selected={setup.style} onSelect={v => update('style', v)} />
        </div>
      </div>
      <StickyBottom>
        <button className="btn btn-primary btn-primary--green" onClick={onNext}>
          Create my route&nbsp;<i className="fa-solid fa-route" aria-hidden="true" />
        </button>
      </StickyBottom>
    </div>
  );
}

// Screen 3: Route Ready
export function RouteReadyScreen({ onBack, onNext, setup }) {
  return (
    <div className="screen">
      <AppBar title="Your route" onBack={onBack} />
      <div className="scroll-area">
        <SuccessBanner icon={<i className="fa-solid fa-check" aria-hidden="true" />} title="Your route is ready" sub="Personalised for your visit today" />
        <AICard>
          I've created a Nationalmuseum route focusing on {setup?.interest?.toLowerCase() || 'your interests'}.
          It fits your {setup?.time || '90-minute'} window perfectly.
        </AICard>
        <div className="card" style={{ marginBottom: 12 }}>
          <MetaRow label="Time"  value={setup?.time || '90 minutes'} />
          <MetaRow label="Focus" value={setup?.interest || 'General history'} />
          <MetaRow label="Style" value={setup?.style || 'Story-based'} />
        </div>
        <div className="section-eye" style={{ marginBottom: 8 }}>Your stops</div>
        <div className="card">
          <ul className="stop-list">
            {[
              { n: 1, title: 'Textile and everyday life', sub: 'Start here · ~25 min' },
              { n: 2, title: 'Domestic tools',            sub: 'Second floor · ~30 min' },
              { n: 3, title: 'Daily life stories',        sub: 'East wing · ~35 min' },
            ].map(s => (
              <li key={s.n} className="stop-item">
                <div className="stop-num">{s.n}</div>
                <div>
                  <div className="stop-info__title">{s.title}</div>
                  <div className="stop-info__sub">{s.sub}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <StickyBottom>
        <button className="btn btn-primary" onClick={onNext}>
          Begin route&nbsp;<i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </button>
      </StickyBottom>
    </div>
  );
}

// Screen 4: Navigation
// Optional floor plan: add `public/museum-map.png` (or set VITE_MUSEUM_MAP_URL). Omitted if load fails.
export function NavigationScreen({ onBack, onNext }) {
  const mapSrc = (import.meta.env.VITE_MUSEUM_MAP_URL || '/museum-map.png').trim();
  const [mapHidden, setMapHidden] = useState(false);

  return (
    <div className="screen">
      <AppBar title="Your next stop" subtitle="Stop 1 of 3" onBack={onBack} />
      <div className="scroll-area">
        {mapSrc && !mapHidden && (
          <div className="nav-map-wrap">
            <img
              className="nav-map-img"
              src={mapSrc}
              alt="Museum floor map"
              onError={() => setMapHidden(true)}
            />
          </div>
        )}
        <div className="map-card">
          <div className="map-dot" />
          <div style={{ flex: 1 }}>
            <div className="map-label">You are here</div>
            <div className="map-val">Main entrance hall</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="map-label">Destination</div>
            <div className="map-val" style={{ color: 'var(--green)' }}>Section A3</div>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-eye" style={{ marginBottom: 4 }}>Next stop</div>
          <div className="card__title" style={{ marginBottom: 6 }}>Textile and everyday life</div>
          <p className="body-para" style={{ color: 'var(--stone)' }}>
            A good place to begin your story-based route through daily life in the collection.
          </p>
        </div>
        <AICard>
          You're in Nationalmuseum near the textile and everyday life section. Head through the main hall
          and turn left at the archway.
        </AICard>
        <div className="row row--mt">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onNext}>View map</button>
          <button className="btn btn-primary" style={{ flex: 2, height: 44, fontSize: 14 }} onClick={onNext}>
            Go to stop
          </button>
        </div>
      </div>
    </div>
  );
}

// Screen 5: Object Detail
export function ObjectDetailScreen({ onBack, onScan }) {
  return (
    <div className="screen">
      <AppBar title="Nearby object" onBack={onBack} />
      <div className="scroll-area">
        <div className="exhibit-img">
          <StoneIcon size={90} />
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'rgba(0,0,0,0.45)', color: 'white',
            fontSize: 11, padding: '3px 8px', borderRadius: 'var(--r-sm)',
          }}>
            1100-1500 CE
          </div>
        </div>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-eye" style={{ marginBottom: 2 }}>Object label</div>
          <div className="card__title" style={{ marginBottom: 6 }}>Textilhantverk 1100-1500</div>
          <p className="body-para" style={{ color: 'var(--stone)' }}>
            Ceramics, bone needles, and glättsten. Tools of domestic textile craft from the medieval period.
          </p>
        </div>
        <AICard>
          Not sure what this object is? Scan it to learn what it was used for and why it matters.
        </AICard>
        <div className="row row--mt">
          <button className="btn btn-ghost" style={{ flex: 1 }}>Label only</button>
          <button className="btn btn-primary btn-primary--green" style={{ flex: 2, height: 44, fontSize: 14 }} onClick={onScan}>
            <i className="fa-solid fa-camera" aria-hidden="true" />&nbsp;Scan object
          </button>
        </div>
      </div>
    </div>
  );
}

// Screen 6: Scanning (camera + OpenRouter vision, with fake-scan fallback)
export function ScanningScreen({ onBack, onComplete }) {
  const [phase, setPhase] = useState('idle'); // idle | scanning | done | error
  const [errMsg, setErrMsg] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Acquire the camera stream once on mount.
  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const tryStreams = [
        () => navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        }),
        () => navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 } },
          audio: false,
        }),
        () => navigator.mediaDevices.getUserMedia({ video: true, audio: false }),
      ];
      for (const tryGet of tryStreams) {
        if (cancelled) return;
        try {
          const stream = await tryGet();
          if (cancelled) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          streamRef.current = stream;
          setCameraReady(true);
          return;
        } catch {
          /* try next */
        }
      }
      setCameraReady(false);
    }
    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Once the video element is mounted AND we have a stream, attach + play.
  useEffect(() => {
    if (cameraReady && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraReady]);

  // Wait until the video has actual frame dimensions (videoWidth > 0).
  const waitForVideoReady = (timeoutMs = 4000) => new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const v = videoRef.current;
      if (v && v.videoWidth > 0) return resolve(true);
      if (Date.now() - start > timeoutMs) return resolve(false);
      requestAnimationFrame(tick);
    };
    tick();
  });

  const captureFrameBase64 = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    const w = Math.min(video.videoWidth, 768);
    const scale = w / video.videoWidth;
    canvas.width = w;
    canvas.height = video.videoHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return dataUrl.split(',')[1];
  };

  const handleTap = async () => {
    if (phase !== 'idle') return;
    setPhase('scanning');
    setErrMsg('');

    if (!aiEnabled) {
      setTimeout(() => setPhase('done'), 1200);
      setTimeout(() => onComplete(null), 2100);
      return;
    }

    if (!cameraReady) {
      setErrMsg('Camera is unavailable. Allow camera access and reload, or try another device.');
      setPhase('error');
      setTimeout(() => { setPhase('idle'); }, 3800);
      return;
    }

    try {
      const ready = await waitForVideoReady();
      if (!ready) throw new Error('Camera not ready yet. Wait a moment.');
      const b64 = captureFrameBase64();
      if (!b64) throw new Error('Could not capture frame.');
      const obj = await recognizeObject(b64, 'image/jpeg');
      setPhase('done');
      setTimeout(() => onComplete(obj), 700);
    } catch (e) {
      setErrMsg(e.message || 'Recognition failed.');
      setPhase('error');
      setTimeout(() => { setPhase('idle'); }, 2200);
    }
  };

  const messages = {
    idle: {
      main: !aiEnabled
        ? 'Tap to scan (demo)'
        : (cameraReady ? 'Tap to scan' : 'Camera needed'),
      sub: !aiEnabled
        ? 'No API key — a sample object after scan.'
        : (cameraReady ? 'Hold steady while AI identifies the object' : 'Allow camera access, then reload the page.'),
    },
    scanning: {
      main: cameraReady ? 'Analyzing...' : 'Waiting...',
      sub: aiEnabled ? 'Sending photo to AI vision model' : 'Using demo identification',
    },
    done:     { main: 'Object identified!', sub: 'Opening object details...' },
    error:    { main: 'Scan failed', sub: errMsg || 'Try again' },
  };

  return (
    <div className="screen" style={{ background: 'var(--dark)' }}>
      <AppBar title="Scan artifact" onBack={onBack} />
      <div className="scan-bg">
        <div className="scan-frame" onClick={handleTap} role="button" aria-label="Start scan">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', borderRadius: 8,
              display: cameraReady ? 'block' : 'none',
            }}
          />
          {!cameraReady && <StoneIcon size={70} />}
          <div className="corner corner--tl" />
          <div className="corner corner--tr" />
          <div className="corner corner--bl" />
          <div className="corner corner--br" />
          {phase !== 'idle' && phase !== 'error' && (
            <div className="scan-line" style={{ animationPlayState: phase === 'done' ? 'paused' : 'running' }} />
          )}
        </div>
        <div style={{ marginTop: 28 }}>
          <div className="scan-status-msg">{messages[phase].main}</div>
          <div className="scan-status-sub">{messages[phase].sub}</div>
        </div>
        <button
          className="btn btn-ghost"
          style={{ marginTop: 28, width: 120, color: 'var(--stone)', borderColor: 'rgba(255,255,255,0.2)' }}
          onClick={onBack}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Screen 7: Mode Selection
export function ModeSelectionScreen({ onBack, object, onQuick, onDetailed, onImmersive }) {
  return (
    <div className="screen">
      <AppBar title="Object recognised" onBack={onBack} />
      <div className="scroll-area">
        <div className="recognized-card">
          <div className="recognized-thumb"><StoneIcon size={44} /></div>
          <div>
            <div className="recognized-title">{object?.name || 'Glättsten'}</div>
            <div className="recognized-sub">{object?.context || 'Stone used in textile work'}</div>
            <div className="recognized-tag">{object?.summary || 'Used to smooth cloth after washing'}</div>
          </div>
        </div>
        <div className="section-eye" style={{ marginBottom: 12 }}>Choose how you want to learn</div>
        {[
          { label: 'Quick explanation',    desc: "A short summary in a few lines. Perfect if you're in a hurry.", num: '1', handler: onQuick },
          { label: 'Detailed explanation', desc: 'More context about material, use, and historical significance.', num: '2', handler: onDetailed },
        ].map(m => (
          <div key={m.label} className="mode-card" onClick={m.handler} role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && m.handler()}>
            <div className="mode-icon">{m.num}</div>
            <div>
              <div className="mode-title">{m.label}</div>
              <div className="mode-desc">{m.desc}</div>
            </div>
          </div>
        ))}
        <div className="mode-card mode-card--featured" onClick={onImmersive} role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onImmersive()}>
          <div className="mode-icon mode-icon--green">3</div>
          <div>
            <div className="mode-title">
              Immersive mode <span className="mode-badge">Recommended</span>
            </div>
            <div className="mode-desc">See a historical character demonstrate how the object was used.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook: load AI explanation with fallback
function useAIExplanation({ object, mode, setup, fallback }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(aiEnabled);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!aiEnabled) {
      setData(fallback);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    generateExplanation({ object, mode, interest: setup?.interest, style: setup?.style })
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => {
        if (cancelled) return;
        setError(e.message || 'AI request failed');
        setData(fallback);
        setLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object?.name, mode, setup?.interest, setup?.style]);

  return { data, loading, error };
}

function LoadingShimmer({ lines = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{
          height: 12, background: 'var(--parchment)', borderRadius: 6,
          width: `${70 + (i * 7) % 30}%`, animation: 'screenIn 0.6s ease-in-out infinite alternate',
        }} />
      ))}
    </div>
  );
}

// Screen 8: Quick Explanation
export function QuickExplanationScreen({ onBack, onImmersive, object, setup }) {
  const fallback = {
    bullets: [
      'This object is called a glättsten, a smoothing stone.',
      'It was used in textile work to smooth cloth after washing.',
      'It helped make fabric softer and more even, a small but essential household tool.',
    ],
  };
  const { data, loading, error } = useAIExplanation({ object, mode: 'quick', setup, fallback });
  const bullets = data?.bullets || fallback.bullets;

  return (
    <div className="screen">
      <AppBar title="Quick explanation" onBack={onBack} />
      <div className="scroll-area">
        <div className="exhibit-img" style={{ aspectRatio: '3/2' }}>
          <StoneIcon size={90} />
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <span className="tag-pill">{object?.name || 'Glättsten'}</span>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-eye" style={{ marginBottom: 10 }}>Three things to know</div>
          {loading ? <LoadingShimmer lines={3} /> : bullets.map((text, i) => (
            <div key={i} className="bullet-item" style={{ marginBottom: i < bullets.length - 1 ? 12 : 0 }}>
              <div className="bullet-dot" />
              <p className="body-para">{text}</p>
            </div>
          ))}
        </div>
        {error && (
          <p style={{ fontSize: 11, color: 'var(--stone)', marginBottom: 12 }}>
            AI unavailable. Showing demo content.
          </p>
        )}
        <div className="row row--mt">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onBack}>Back</button>
          <button className="btn btn-primary btn-primary--green" style={{ flex: 2, height: 44, fontSize: 14 }} onClick={onImmersive}>
            Try immersive mode
          </button>
        </div>
      </div>
    </div>
  );
}

// Screen 9: Detailed Explanation
export function DetailedExplanationScreen({ onBack, onImmersive, object, setup }) {
  const fallback = {
    paragraphs: [
      'A glättsten is a smoothing stone used in textile production. After cloth was washed, it could be pressed and rubbed with the stone to improve its surface, making it feel softer and more finished.',
      'Though simple, this tool reflects the importance of textile care in everyday historical life. It required skill and patience, and was often passed between generations.',
    ],
    meta: {
      period: '1100-1500',
      context: 'Textile craft',
      function: 'Smoothing cloth',
      importance: 'Everyday household use',
    },
  };
  const { data, loading, error } = useAIExplanation({ object, mode: 'detailed', setup, fallback });
  const paragraphs = data?.paragraphs || fallback.paragraphs;
  const meta = data?.meta || fallback.meta;

  return (
    <div className="screen">
      <AppBar title="Detailed explanation" onBack={onBack} />
      <div className="scroll-area">
        <div className="section-eye" style={{ marginBottom: 4 }}>Object study</div>
        <div className="section-title" style={{ marginBottom: 14 }}>{object?.name || 'Glättsten'}</div>
        <div className="card" style={{ marginBottom: 14 }}>
          {loading ? <LoadingShimmer lines={5} /> : paragraphs.map((p, i) => (
            <p key={i} className="body-para" style={{ marginTop: i > 0 ? 12 : 0 }}>{p}</p>
          ))}
        </div>
        <div className="section-eye" style={{ marginBottom: 8 }}>Object data</div>
        <div className="card">
          <MetaRow label="Period"     value={meta.period || '-'} />
          <MetaRow label="Context"    value={meta.context || '-'} />
          <MetaRow label="Function"   value={meta.function || '-'} />
          <MetaRow label="Importance" value={meta.importance || '-'} />
        </div>
        {error && (
          <p style={{ fontSize: 11, color: 'var(--stone)', marginTop: 12 }}>
            AI unavailable. Showing demo content.
          </p>
        )}
        <div className="row row--mt" style={{ marginTop: 12 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onBack}>Back</button>
          <button className="btn btn-primary btn-primary--green" style={{ flex: 2, height: 44, fontSize: 14 }} onClick={onImmersive}>
            Try immersive mode
          </button>
        </div>
      </div>
    </div>
  );
}

// Screen 10: Immersive Mode
export function ImmersiveModeScreen({ onBack, onContinue, object, setup }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const fallback = {
    character: 'Medieval textile worker, 1200 CE',
    lines: [
      '"I smooth my cloth with this stone after washing it. I press it across the fabric to make it softer and more even."',
      '"Without this, the cloth would stay rough. It\'s simple work, but it makes a big difference."',
    ],
  };
  const { data, loading, error } = useAIExplanation({ object, mode: 'immersive', setup, fallback });
  const character = data?.character || fallback.character;
  const lines = data?.lines || fallback.lines;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [playing]);

  const togglePlay = () => setPlaying(p => !p);

  const replay = () => {
    const el = videoRef.current;
    if (el) el.currentTime = 0;
    setPlaying(true);
    queueMicrotask(() => {
      videoRef.current?.play().catch(() => {});
    });
  };

  const stopAndExit = () => {
    setPlaying(false);
    onBack();
  };

  return (
    <div className="screen" style={{ background: 'var(--dark2)' }}>
      <AppBar title="Immersive Mode" onBack={onBack} />
      <div className="scroll-area" style={{ background: 'var(--cream)', paddingTop: 16 }}>
        <span className="immersive-tag">Historical scene</span>
        <div className="media-placeholder">
          <video
            ref={videoRef}
            className="immersive-video"
            src="/immersive-ambient.mp4"
            playsInline
            loop
            muted
            preload="auto"
            aria-label="Ambient scene video"
          />
          <div className="media-play-overlay">
            <button type="button" className="play-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play scene'}>
              {playing
                ? (
                    <span style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ width: 4, height: 14, background: 'white', borderRadius: 1 }} />
                      <span style={{ width: 4, height: 14, background: 'white', borderRadius: 1 }} />
                    </span>
                  )
                : <div className="play-icon" />}
            </button>
            <div className="media-label">{character}</div>
          </div>
          <div className="media-live-badge">LIVE SCENE</div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--stone)', marginBottom: 12, padding: '0 4px' }}>
          Video is a neutral ambient loop for your visit at Nationalmuseum Stockholm. The dialogue below follows the object you scanned.
        </p>
        {loading ? (
          <div className="dialogue-card"><LoadingShimmer lines={3} /></div>
        ) : lines.map((text, i) => (
          <div key={i} className="dialogue-card" style={i === 1 ? { borderLeft: '3px solid var(--gold)' } : {}}>
            <div className="dialogue-char" style={i === 1 ? { color: 'var(--gold)' } : {}}>
              {i === 0 ? character : 'Continuing...'}
            </div>
            <div className="dialogue-line">{text}</div>
          </div>
        ))}
        {error && (
          <p style={{ fontSize: 11, color: 'var(--stone)', marginBottom: 12 }}>
            AI unavailable. Showing demo content.
          </p>
        )}
        <div className="row" style={{ marginBottom: 12 }}>
          <button type="button" className="btn btn-ctrl" onClick={replay}>Replay</button>
          <button type="button" className="btn btn-ctrl" onClick={togglePlay}>{playing ? 'Pause' : 'Play'}</button>
          <button type="button" className="btn btn-ctrl" onClick={stopAndExit}>Exit</button>
        </div>
      </div>
      <StickyBottom>
        <button className="btn btn-primary" onClick={onContinue}>
          Continue route&nbsp;<i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </button>
      </StickyBottom>
    </div>
  );
}

// Screen 11: Continue Route
export function ContinueRouteScreen({ onBack, onNext, onRestart }) {
  return (
    <div className="screen">
      <AppBar title="Stop complete" onBack={onBack} />
      <div className="scroll-area">
        <SuccessBanner
          icon={<i className="fa-solid fa-check" aria-hidden="true" />}
          title="You've completed this stop"
          sub="Now you understand what it is, how it was used, and why it mattered"
        />
        <ProgressBar pct={33} />
        <p style={{ fontSize: 12, color: 'var(--stone)', marginBottom: 16 }}>Stop 1 of 3 complete</p>
        <div className="card" style={{ marginBottom: 12 }}>
          <ul className="stop-list">
            <li className="stop-item">
              <div className="stop-num stop-num--done">
                <i className="fa-solid fa-check" style={{ fontSize: 11, color: 'white' }} aria-hidden="true" />
              </div>
              <div>
                <div className="stop-info__title stop-info__title--done">Textile and everyday life</div>
                <div className="stop-info__sub">Completed</div>
              </div>
            </li>
            <li className="stop-item">
              <div className="stop-num stop-num--active">2</div>
              <div>
                <div className="stop-info__title">Domestic tools</div>
                <div className="stop-info__sub">Next · Second floor · ~30 min</div>
              </div>
            </li>
            <li className="stop-item">
              <div className="stop-num">3</div>
              <div>
                <div className="stop-info__title">Daily life stories</div>
                <div className="stop-info__sub">East wing · ~35 min</div>
              </div>
            </li>
          </ul>
        </div>
        <AICard>
          Continue your route to another story from everyday life. Domestic tools reveal
          just as much about how people really lived.
        </AICard>
        <div className="row row--mt">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onRestart}>Full route</button>
          <button className="btn btn-primary btn-primary--green" style={{ flex: 2, height: 44, fontSize: 14 }} onClick={onNext}>
            Next stop
          </button>
        </div>
      </div>
    </div>
  );
}
