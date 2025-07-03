import React from 'react';
import GameCanvas from './components/GameCanvas';
import Player from './components/player';
//import Sword from './components/sword';

export default function App() {
  return (
    <div>
      <GameCanvas>
        <Player />
        {/* <Sword position={{ left: 100, top: 100 }} /> */}
      </GameCanvas>
    </div>
  );
}
