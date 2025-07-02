import { useRef, useEffect, useState } from 'react';
import { constants } from './constants';
const cts = constants;

// Constants for player movement
const PLAYER_RADIUS = 10;
const PLAYER_SPEED = 4;
const FRICTION = 0.92;
const MAX_SPEED = 8;


export default function Player() {
    const [position, setPosition] = useState({ left: cts.width / 2, top: cts.height / 2 });
    const velocity = useRef({ x: 0, y: 0 });
    const keys = useRef({});

    // Key handling
    useEffect(() => {
        const handleKeyDown = (e) => {
            keys.current[e.key.toLowerCase()] = true;
        };
        const handleKeyUp = (e) => {
            keys.current[e.key.toLowerCase()] = false;
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Movement loop
    useEffect(() => {
        let animationFrame;
        const animate = () => {
            // WASD and Arrow keys
            if (keys.current['w'] || keys.current['arrowup']) velocity.current.y -= PLAYER_SPEED * 0.2;
            if (keys.current['s'] || keys.current['arrowdown']) velocity.current.y += PLAYER_SPEED * 0.2;
            if (keys.current['a'] || keys.current['arrowleft']) velocity.current.x -= PLAYER_SPEED * 0.2;
            if (keys.current['d'] || keys.current['arrowright']) velocity.current.x += PLAYER_SPEED * 0.2;

            // Clamp velocity
            velocity.current.x = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, velocity.current.x));
            velocity.current.y = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, velocity.current.y));

            // Apply friction
            velocity.current.x *= FRICTION;
            velocity.current.y *= FRICTION;

            // Update position and clamp to bounds
            setPosition(pos => {
                let left = pos.left + velocity.current.x;
                let top = pos.top + velocity.current.y;
                left = Math.max(PLAYER_RADIUS, Math.min(cts.width - PLAYER_RADIUS, left));
                top = Math.max(PLAYER_RADIUS, Math.min(cts.height - PLAYER_RADIUS, top));
                return { left, top };
            });

            animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, []);

    return (
        <div
            style={{
                width: PLAYER_RADIUS * 2,
                height: PLAYER_RADIUS * 2,
                backgroundColor: 'blue',
                position: 'absolute',
                left: position.left - PLAYER_RADIUS,
                top: position.top - PLAYER_RADIUS,
                borderRadius: '50%',
                outline: 'none',
            }}
            tabIndex={0}
        />
    );
}
