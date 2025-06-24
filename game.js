const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const healthBar = document.getElementById("healthInner");
const scoreDisplay = document.getElementById("score");
const survivalDisplay = document.getElementById("survivalTime");
const pauseBtn = document.getElementById("pauseBtn");
const gameOverDiv = document.getElementById("gameOver");
const finalScoreP = document.getElementById("finalScore");
const leaderboardOl = document.getElementById("leaderboard");
const restartBtn = document.getElementById("restartBtn");
const swordImg = new Image();
swordImg.src = "https://static.vecteezy.com/system/resources/previews/032/479/652/non_2x/knife-pixel-art-free-png.png";


const width = canvas.width;
const height = canvas.height;


// 升級參數
let upgrades = { maxHealth: 100, speed: 4, knockbackPower: 10 };

// 遊戲資料
let zombies = [], items = [];
let score = 0, survivalTime = 0;
let lastSpawn = 0, lastItemSpawn = 0;
let spawnInterval = 2000;
const minSpawnInterval = 300;
let itemSpawnInterval = 10000;
let knockbackTimeouts = new Map();
let lastTimestamp = 0;
let attackCooldown = 0;
let swingAngle = 0; // 目前揮動角度（弧度）
let swinging = false;
let swingSpeed = 0.1; // 揮動速度 (弧度/幀)

let keys = {};
let mousePos = { x: width / 2, y: height / 2 };
let gamePaused = false;
let gameOver = false;

// 你給的音效連結改這裡
const sounds = {
  swordSwing1: new Audio("https://www.myinstants.com/media/sounds/swoosh-sound-effects.mp3"),
  swordSwing2: new Audio("https://www.myinstants.com/media/sounds/swoosh-2.mp3"),
  hitZombie: new Audio("https://www.myinstants.com/media/sounds/bone-crack.mp3"),
  hurt: new Audio("https://www.myinstants.com/media/sounds/steve-old-hurt-sound_3cQdSVW.mp3"),
  gameOver: new Audio("https://www.myinstants.com/media/sounds/what-bottom-text-meme-sanctuary-guardian-sound-effect-hd.mp3"),
};

// 玩家設定
const player = {
  x: width / 2,
  y: height / 2,
  radius: 20,
  speed: upgrades.speed,
  health: upgrades.maxHealth,
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#00f";
    ctx.fill();
  }
};

function drawPlayer() {
  player.draw();
  drawSword(); 
}



class Zombie {
  constructor(x, y, type = "normal") {
    this.x = x;
    this.y = y;
    this.radius = 20;

    this.type = type;
    if (type === "fast") {
      this.health = 60;
      this.speed = 3.0;
      this.knockback = 15;
    } else if (type === "tank") {
      this.health = 200;
      this.speed = 0.8;
      this.knockback = 5;
    } else {
      this.health = 100;
      this.speed = 1.5;
      this.knockback = 10;
    }
  }

  moveTowards(targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    const red = Math.min(255, 255 * (1 - this.health / 100));
    const green = this.type === "fast" ? 255 : this.type === "tank" ? 128 : 255;
    ctx.fillStyle = `rgb(${red},${green},0)`;
    ctx.fill();
  }
}




class Item {
  constructor(x, y, type = "health") {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.type = type;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.type === "health" ? "#f00" : "#ff0";
    ctx.fill();
  }
}

let totalZombiesSpawned = 0;

function spawnZombie() {
  totalZombiesSpawned++;

  const slowFactor = Math.min(2, totalZombiesSpawned / 30); // 最多減速到 1.0

  const rand = Math.random();
  let type = "normal";
  if (rand < 0.1) type = "fast"; // 降低 fast 機率
  else if (rand < 0.2) type = "tank";

  // 隨機產生邊緣位置
  function randomX() {
    const edge = Math.random() < 0.5;
    return edge ? (Math.random() < 0.5 ? 0 : width) : Math.random() * width;
  }
  function randomY() {
    const edge = Math.random() < 0.5;
    return edge ? (Math.random() < 0.5 ? 0 : height) : Math.random() * height;
  }
  const zombie = new Zombie(randomX(), randomY(), type);

  // fast zombie gets slower if too many zombies have been spawned
  if (zombie.type === "fast") {
    zombie.speed = Math.max(1.0, zombie.speed - slowFactor); // 下限 1.0
  }

  zombies.push(zombie);
}


function spawnItem() {
  const x = Math.random() * width;
  const y = Math.random() * height;
  items.push(new Item(x, y));
}

function drawHealthBar() {
  const healthPercent = (player.health / upgrades.maxHealth) * 100;
  healthBar.style.width = healthPercent + "%";
}

function movePlayer() {
  if (keys["w"] || keys["ArrowUp"]) player.y -= player.speed;
  if (keys["s"] || keys["ArrowDown"]) player.y += player.speed;
  if (keys["a"] || keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["d"] || keys["ArrowRight"]) player.x += player.speed;
  // 限制邊界
  player.x = Math.min(Math.max(player.radius, player.x), width - player.radius);
  player.y = Math.min(Math.max(player.radius, player.y), height - player.radius);
}

function attackZombies() {
  if (swinging) return;
  swinging = true;
  swingAngle = 0;
  sounds.swordSwing2.play();

  const angle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
  const swordX = player.x + Math.cos(angle) * (player.radius + 20);
  const swordY = player.y + Math.sin(angle) * (player.radius + 20);

  zombies = zombies.filter(zombie => {
    const dx = zombie.x - swordX;
    const dy = zombie.y - swordY;
    const dist = Math.sqrt(dx * dx + dy * dy); // ← 修正：這行是錯誤的關鍵

    if (dist < zombie.radius + 10) {
      let damage = player.mode === "knife" ? 50 : 25;
      zombie.health -= damage;
      sounds.hitZombie.play();

      if (zombie.health <= 0) {
        score += 10;
        return false; // 殭屍死亡
      }

      // 擊退
      const knockbackStrength = zombie.knockback || 30;
      const angleToZombie = Math.atan2(dy, dx);
      zombie.x += Math.cos(angleToZombie) * (zombie.knockback || 30);
      zombie.y += Math.sin(angleToZombie) * (zombie.knockback || 30);
    }

    return true;
  });
}


function drawSword() {
  const dx = mousePos.x - player.x;
  const dy = mousePos.y - player.y;
  const baseAngle = Math.atan2(dy, dx);
  const angle = baseAngle + (swinging ? swingAngle : 0);
  const swordLength = 40;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(angle);
  // 這裡x,y從0開始畫，調整讓刀柄在原點
  ctx.drawImage(swordImg, 0, -swordLength / 2, swordLength, swordLength);
  ctx.restore();
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`Time: ${Math.floor(survivalTime/1000)}s`, 10, 60);

  if (gameOver) {
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "red";
    ctx.fillText("你死了", canvas.width / 2, canvas.height / 2);
  }
}



function updateSwing() {
  if (!swinging) return;
  swingAngle += swingSpeed;
  if (swingAngle >= Math.PI / 6) { // 30度，弧度是π/6
    swingSpeed = -swingSpeed; // 反向回來
  } else if (swingAngle <= 0) {
    swingAngle = 0;
    swinging = false; // 結束揮動
    swingSpeed = Math.abs(swingSpeed); // 重置正向速度
  }
}

function handleCollisions() {
  // 玩家與殭屍碰撞扣血與擊退
  zombies.forEach(zombie => {
    const dx = zombie.x - player.x;
    const dy = zombie.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < zombie.radius + player.radius) {
      player.health -= 1;
      sounds.hurt.play();
      // 擊退
      const angle = Math.atan2(dy, dx);
      player.x -= Math.cos(angle) * upgrades.knockbackPower;
      player.y -= Math.sin(angle) * upgrades.knockbackPower;
      if (player.health <= 0) {
        endGame();
      }
    }
  });

  // 玩家與道具碰撞回血
  items.forEach((item, i) => {
    const dx = item.x - player.x;
    const dy = item.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < item.radius + player.radius) {
      if (item.type === "health") {
        player.health = Math.min(upgrades.maxHealth, player.health + 20);
      }
      items.splice(i, 1);
    }
  });
}

function updateSpawnInterval(delta) {
  survivalTime += delta;
  if (survivalTime % 10000 < delta) {
    spawnInterval = Math.max(minSpawnInterval, spawnInterval - 100);
  }
  if (score !== 0 && score % 100 === 0 && delta < 50) {
    spawnInterval = Math.max(minSpawnInterval, spawnInterval - 50);
  }
}

function gameLoop(timestamp = 0) {
  if (gamePaused || gameOver) return;
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (isDead) {
    drawUI(); 
    restartBtn.style.display = "block"; 
    return; 
  }

  attackCooldown = Math.max(0, attackCooldown - delta);

  updateSpawnInterval(delta);
  
  updateSwing(); // 加這行

  ctx.clearRect(0, 0, width, height);
  movePlayer();

  zombies.forEach(zombie => {
    if (!knockbackTimeouts.has(zombie)) zombie.moveTowards(player.x, player.y);
    zombie.draw();
  });

  items.forEach(item => item.draw());

  drawPlayer();
  drawUI();
  drawHealthBar();
  handleCollisions();

  if (timestamp - lastSpawn > spawnInterval) {
    spawnZombie();
    lastSpawn = timestamp;
  }

  if (timestamp - lastItemSpawn > itemSpawnInterval) {
    spawnItem();
    lastItemSpawn = timestamp;
  }

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  gameOverDiv.style.display = "block";
  finalScoreP.textContent = `你得到了 ${score} 分！`;
  sounds.gameOver.play();
  saveToLeaderboard(score);
  renderLeaderboard();
}

function saveToLeaderboard(score) {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboard.push({ score, time: Date.now() });
  leaderboard.sort((a, b) => b.score - a.score);
  if (leaderboard.length > 10) leaderboard.length = 10;
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function renderLeaderboard() {
  if (!leaderboardOl) return;
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboardOl.innerHTML = "";
  leaderboard.forEach((entry, i) => {
    const li = document.createElement("li");
    li.textContent = `#${i + 1} - ${entry.score} 分 (${new Date(entry.time).toLocaleString()})`;
    leaderboardOl.appendChild(li);
  });
}

// 事件監聽
canvas.addEventListener("mousedown", (e) => {
  if (e.button === 0) { // 0 表示滑鼠左鍵
    attackZombies();
  }
});

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
});


window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

pauseBtn.addEventListener("click", () => {
  gamePaused = !gamePaused;
  if (!gamePaused && !gameOver) requestAnimationFrame(gameLoop);
});

restartBtn.addEventListener("click", () => {
  resetGame();
  gameOverDiv.style.display = "none";
  requestAnimationFrame(gameLoop);
});


// 初始化 & 啟動遊戲
resetGame();

canvas.addEventListener("mousemove", function (e) {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
});

requestAnimationFrame(gameLoop);
renderLeaderboard();


function resetGame() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.health = upgrades.maxHealth;
  player.mode = "knife";
  zombies = [];
  items = [];
  score = 0;
  survivalTime = 0;
  spawnInterval = 2000;
  lastSpawn = 0;
  lastItemSpawn = 0;
  gamePaused = false;
  gameOver = false;
  isDead = false;
  swinging = false;
  attackCooldown = 0;
  restartBtn.style.display = "none";
  requestAnimationFrame(gameLoop); // ← 重啟遊戲
}

