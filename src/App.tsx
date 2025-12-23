import React, { Suspense } from 'react';
import './App.css';
const Game = React.lazy(() => import('./components/Game/Game.tsx'));
import { Providers } from './providers/Provider.tsx';
function App() {
  return (
    <div className="App">
      <Providers>
        <Suspense fallback={<div />}> 
          <Game />
        </Suspense>
      </Providers>
    </div>
  );
}

export default App;
