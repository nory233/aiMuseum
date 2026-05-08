import { useState } from 'react';
import { StatusBar } from './components/UI.jsx';
import {
  HomeScreen,
  VisitSetupScreen,
  RouteReadyScreen,
  NavigationScreen,
  ObjectDetailScreen,
  ScanningScreen,
  ModeSelectionScreen,
  QuickExplanationScreen,
  DetailedExplanationScreen,
  ImmersiveModeScreen,
  ContinueRouteScreen,
} from './components/Screens.jsx';

/** Shown only when AI is unavailable (hosted build or demo scan). Not a museum identification. */
const DEMO_OBJECT = {
  name: 'Demo object',
  period: '',
  context: 'AI offline sample',
  summary: 'This is placeholder content because no API key is available in this build.',
};

function normalizeScannedObject(payload) {
  if (!payload) return { ...DEMO_OBJECT };
  return {
    name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : 'Unidentified',
    period: typeof payload.period === 'string' && payload.period.trim() ? payload.period.trim() : 'Unknown',
    context: typeof payload.context === 'string' ? payload.context.trim() : '',
    summary: typeof payload.summary === 'string' ? payload.summary.trim() : '',
    scanVideoObjectUrl: payload.scanVideoObjectUrl,
    scanPreviewDataUrl: payload.scanPreviewDataUrl,
  };
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [history, setHistory] = useState([]);

  const [setup, setSetup] = useState({
    time: '90 min',
    interest: 'General history',
    style: 'Story-based',
  });

  const [object, setObject] = useState(DEMO_OBJECT);

  const go = (target) => {
    setHistory(h => [...h, screen]);
    setScreen(target);
    requestAnimationFrame(() => {
      document.querySelector('.scroll-area')?.scrollTo?.(0, 0);
      window.scrollTo?.(0, 0);
    });
  };

  const back = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setScreen(prev);
  };

  const restart = () => {
    setHistory([]);
    setScreen('home');
  };

  const commitScanResult = (payload) => {
    const next = normalizeScannedObject(payload ?? null);
    setObject((prev) => {
      const prevVid = prev?.scanVideoObjectUrl;
      const nextVid = next.scanVideoObjectUrl;
      if (prevVid && prevVid !== nextVid) URL.revokeObjectURL(prevVid);
      return next;
    });
    go('mode');
  };

  return (
    <div className="app-shell" role="main" aria-label="Nationalmuseum AI Guide">
      <StatusBar />
      {screen === 'home'       && <HomeScreen               onNext={() => go('setup')} />}
      {screen === 'setup'      && <VisitSetupScreen          onBack={back} onNext={() => go('route')}
                                    setup={setup} setSetup={setSetup} />}
      {screen === 'route'      && <RouteReadyScreen          onBack={back} onNext={() => go('navigation')}
                                    setup={setup} />}
      {screen === 'navigation' && <NavigationScreen          onBack={back} onNext={() => go('object')} />}
      {screen === 'object'     && <ObjectDetailScreen        onBack={back} onScan={() => go('scanning')} />}
      {screen === 'scanning'   && <ScanningScreen            onBack={back} onComplete={commitScanResult} />}
      {screen === 'mode'       && <ModeSelectionScreen       onBack={back}
                                    object={object}
                                    onQuick={() => go('quick')}
                                    onDetailed={() => go('detailed')}
                                    onImmersive={() => go('immersive')} />}
      {screen === 'quick'      && <QuickExplanationScreen    onBack={back} onImmersive={() => go('immersive')}
                                    object={object} setup={setup} />}
      {screen === 'detailed'   && <DetailedExplanationScreen onBack={back} onImmersive={() => go('immersive')}
                                    object={object} setup={setup} />}
      {screen === 'immersive'  && <ImmersiveModeScreen       onBack={back} onContinue={() => go('continue')}
                                    object={object} setup={setup} />}
      {screen === 'continue'   && <ContinueRouteScreen       onBack={back} onNext={restart} onRestart={() => go('route')} />}
    </div>
  );
}
