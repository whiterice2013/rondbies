import { useRef, useEffect, useState } from 'react';
import {constants, playerConstants} from './constants.ts';
const cts = constants;
const playerCts = playerConstants;


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
            if (keys.current['w'] || keys.current['arrowup']) velocity.current.y -= playerCts.speed * 0.2;
            if (keys.current['s'] || keys.current['arrowdown']) velocity.current.y += playerCts.speed * 0.2;
            if (keys.current['a'] || keys.current['arrowleft']) velocity.current.x -= playerCts.speed * 0.2;
            if (keys.current['d'] || keys.current['arrowright']) velocity.current.x += playerCts.speed * 0.2;

            // Clamp velocity
            velocity.current.x = Math.max(-playerCts.maxSpeed, Math.min(playerCts.maxSpeed, velocity.current.x));
            velocity.current.y = Math.max(-playerCts.maxSpeed, Math.min(playerCts.maxSpeed, velocity.current.y));

            // Apply friction
            velocity.current.x *= playerCts.friction;
            velocity.current.y *= playerCts.friction;

            // Update position and clamp to bounds
            setPosition(pos => {
                let left = pos.left + velocity.current.x;
                let top = pos.top + velocity.current.y;
                left = Math.max(playerCts.radius, Math.min(cts.width - playerCts.radius, left));
                top = Math.max(playerCts.radius, Math.min(cts.height - playerCts.radius, top));
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
                width: playerCts.radius * 2,
                height: playerCts.radius * 2,
                backgroundColor: playerCts.color,
                position: 'absolute',
                left: position.left - playerCts.radius,
                top: position.top - playerCts.radius,
                borderRadius: '50%',
                outline: 'none',
            }}
            tabIndex={0}
        >
        </div>
    );
}
