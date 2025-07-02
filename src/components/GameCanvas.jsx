import React from 'react';

export default function GameCanvas({ children }) {
  return (
    <div style={{ border: '2px solid black', width: '600px', height: '400px', position: 'relative' }}>
      {children}
    </div>
  );
}
