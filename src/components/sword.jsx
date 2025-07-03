import React from "react";
import { constants, playerConstants } from "./constants";
const cts = constants;
const playerCts = playerConstants;
const swordImg = "./images/sword.png";

export default function Sword({ position }) {
    return (
        <img
            src={swordImg}
            alt="Sword"
            style={{
                width: playerCts.radius * 2,
                height: playerCts.radius * 2,
                position: 'absolute',
                left: position.left - playerCts.radius,
                top: position.top - playerCts.radius,
                borderRadius: '50%',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                objectFit: 'cover',
                backgroundColor: 'lightgray',
            }}
        />
    );
}