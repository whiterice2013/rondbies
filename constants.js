const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const swordImg = new Image();
swordImg.src = "./images/sword.png"; 

const width = canvas.width;
const height = canvas.height;

export const constants = {
  canvas,
  ctx,
  healthBar: document.getElementById("healthInner"),
  scoreDisplay: document.getElementById("score"),
  survivalDisplay: document.getElementById("survivalTime"),
  pauseBtn: document.getElementById("pauseBtn"),
  gameOverDiv: document.getElementById("gameOver"),
  finalScoreP: document.getElementById("finalScore"),
  leaderboardOl: document.getElementById("leaderboard"),
  restartBtn: document.getElementById("restartBtn"),
  swordImg,
  width,
  height,
  upgrades: { maxHealth: 100, speed: 4, knockbackPower: 10 },
  zombies: [],
  items: [],
  score: 0,
  survivalTime: 0,
  lastSpawn: 0,
  lastItemSpawn: 0,
  spawnInterval: 2000,
  minSpawnInterval: 300,
  itemSpawnInterval: 3000,
  knockbackTimeouts: new Map(),
  lastTimestamp: 0,
  attackCooldown: 0,
  swingAngle: 0,
  swinging: false,
  swingSpeed: 0.1,
  keys: {},
  mousePos: { x: width / 2, y: height / 2 },
  gamePaused: false,
  gameOver: false,
};


// 你給的音效連結改這裡
export const sounds = {
  swordSwing1: new Audio("https://www.myinstants.com/media/sounds/swoosh-sound-effects.mp3"),
  swordSwing2: new Audio("https://www.myinstants.com/media/sounds/swoosh-2.mp3"),
  hitZombie: new Audio("https://www.myinstants.com/media/sounds/bone-crack.mp3"),
  hurt: new Audio("https://www.myinstants.com/media/sounds/steve-old-hurt-sound_3cQdSVW.mp3"),
  gameOver: new Audio("https://www.myinstants.com/media/sounds/what-bottom-text-meme-sanctuary-guardian-sound-effect-hd.mp3"),
};

// 玩家設定
export const player = {
  x: width / 2,
  y: height / 2,
  radius: 20,
  speed: constants.upgrades.speed,
  health: constants.upgrades.maxHealth,
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#00f";
    ctx.fill();
  }
};