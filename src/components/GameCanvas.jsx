import React from 'react';
import { constants } from './constants'; 
const cts = constants;

export default function GameCanvas({ children }) {
  return (
    <div style={{ border: '2px solid gray', borderRadius: '12px', width: `${cts.width}px`, height: `${cts.height}px`, position: 'relative', overflow: 'hidden' }}>
      <canvas
        width={cts.width}
        height={cts.height}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
