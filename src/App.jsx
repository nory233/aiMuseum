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

const DEMO_OBJECT = {
  name: 'Glättsten',
  period: '1100-1500 CE',
  context: 'Textile craft tool',
  summary: 'A smoothing stone used to press and finish cloth after washing in medieval Nordic households.',
};

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
      {screen === 'scanning'   && <ScanningScreen            onBack={back}
                                    onComplete={(obj) => { setObject(obj || DEMO_OBJECT); go('mode'); }} />}
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
