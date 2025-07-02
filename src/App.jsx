import React from 'react';
import GameCanvas from './components/GameCanvas';
import Player from './components/Player';

export default function App() {
  return (
    <div>
      <GameCanvas>
        <Player />
      </GameCanvas>
    </div>
  );
}
