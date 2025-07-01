import { constants as cts, sounds, player} from './constants.js';


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
    cts.ctx.beginPath();
    cts.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    const red = Math.min(255, 255 * (1 - this.health / 100));
    const green = this.type === "fast" ? 255 : this.type === "tank" ? 128 : 255;
    cts.ctx.fillStyle = `rgb(${red},${green},0)`;
    cts.ctx.fill();
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
    cts.ctx.beginPath();
    cts.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    cts.ctx.fillStyle = this.type === "health" ? "#f00" : "#ff0";
    cts.ctx.fill();
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
    return edge ? (Math.random() < 0.5 ? 0 : cts.width) : Math.random() * cts.width;
  }
  function randomY() {
    const edge = Math.random() < 0.5;
    return edge ? (Math.random() < 0.5 ? 0 : cts.height) : Math.random() * cts.height;
  }
  const zombie = new Zombie(randomX(), randomY(), type);

  // fast zombie gets slower if too many zombies have been spawned
  if (zombie.type === "fast") {
    zombie.speed = Math.max(1.0, zombie.speed - slowFactor); // 下限 1.0
  }

  cts.zombies.push(zombie);
}


function spawnItem() {
  const x = Math.random() * cts.width;
  const y = Math.random() * cts.height;
  cts.items.push(new Item(x, y));
}

function drawHealthBar() {
  const healthPercent = (player.health / cts.upgrades.maxHealth) * 100;
  healthBar.style.width = healthPercent + "%";
}

function movePlayer() {
  if (cts.keys["w"] || cts.keys["ArrowUp"]) player.y -= player.speed;
  if (cts.keys["s"] || cts.keys["ArrowDown"]) player.y += player.speed;
  if (cts.keys["a"] || cts.keys["ArrowLeft"]) player.x -= player.speed;
  if (cts.keys["d"] || cts.keys["ArrowRight"]) player.x += player.speed;
  // 限制邊界
  player.x = Math.min(Math.max(player.radius, player.x), cts.width - player.radius);
  player.y = Math.min(Math.max(player.radius, player.y), cts.height - player.radius);
}

function attackZombies() {
  if (cts.swinging) return;
  cts.swinging = true;
  cts.swingAngle = 0;
  sounds.swordSwing2.play();

  const angle = Math.atan2(cts.mousePos.y - player.y, cts.mousePos.x - player.x);
  const swordX = player.x + Math.cos(angle) * (player.radius + 20);
  const swordY = player.y + Math.sin(angle) * (player.radius + 20);

  cts.zombies = cts.zombies.filter(zombie => {
    const dx = zombie.x - swordX;
    const dy = zombie.y - swordY;
    const dist = Math.sqrt(dx * dx + dy * dy); // ← 修正：這行是錯誤的關鍵

    if (dist < zombie.radius + 10) {
      let damage = player.mode === "knife" ? 50 : 25;
      zombie.health -= damage;
      sounds.hitZombie.play();

      if (zombie.health <= 0) {
        cts.score += 10;
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
  const dx = cts.mousePos.x - player.x;
  const dy = cts.mousePos.y - player.y;
  const baseAngle = Math.atan2(dy, dx);
  const angle = baseAngle + (cts.swinging ? cts.swingAngle : 0);
  const swordLength = 40;

  cts.ctx.save();
  cts.ctx.translate(player.x, player.y);
  cts.ctx.rotate(angle);
  // 這裡x,y從0開始畫，調整讓刀柄在原點
  cts.ctx.drawImage(cts.swordImg, 0, -swordLength / 2, swordLength, swordLength);
  cts.ctx.restore();
}

function drawUI() {
  cts.ctx.fillStyle = "white";
  cts.ctx.font = "20px Arial";
  cts.ctx.textAlign = "left";
  cts.ctx.fillText(`Score: ${cts.score}`, 10, 30);
  cts.ctx.fillText(`Time: ${Math.floor(cts.survivalTime/1000)}s`, 10, 60);

  if (cts.gameOver) {
    cts.ctx.font = "60px Arial";
    cts.ctx.textAlign = "center";
    cts.ctx.fillStyle = "red";
    cts.ctx.fillText("你死了", cts.canvas.constants.width / 2, cts.canvas.constants.height / 2);
  }
}



function updateSwing() {
  if (!cts.swinging) return;
  cts.swingAngle += cts.swingSpeed;
  if (cts.swingAngle >= Math.PI / 6) { // 30度，弧度是π/6
    cts.swingSpeed = -cts.swingSpeed; // 反向回來
  } else if (cts.swingAngle <= 0) {
    cts.swingAngle = 0;
    cts.swinging = false; // 結束揮動
    cts.swingSpeed = Math.abs(cts.swingSpeed); // 重置正向速度
  }
}

function handleCollisions() {
  // 玩家與殭屍碰撞扣血與擊退
  cts.zombies.forEach(zombie => {
    const dx = zombie.x - player.x;
    const dy = zombie.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < zombie.radius + player.radius) {
      player.health -= 1;
      sounds.hurt.play();
      // 擊退
      const angle = Math.atan2(dy, dx);
      player.x -= Math.cos(angle) * cts.upgrades.knockbackPower;
      player.y -= Math.sin(angle) * cts.upgrades.knockbackPower;
      if (player.health <= 0) {
        endGame();
      }
    }
  });

  // 玩家與道具碰撞回血
  cts.items.forEach((item, i) => {
    const dx = item.x - player.x;
    const dy = item.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < item.radius + player.radius) {
      if (item.type === "health") {
        player.health = Math.min(cts.upgrades.maxHealth, player.health + 20);
      }
      cts.items.splice(i, 1);
    }
  });
}

function updateSpawnInterval(delta) {
  cts.survivalTime += delta;
  if (cts.survivalTime % 10000 < delta) {
    cts.spawnInterval = Math.max(cts.minSpawnInterval, cts.spawnInterval - 100);
  }
  if (cts.score !== 0 && cts.score % 100 === 0 && delta < 50) {
    cts.spawnInterval = Math.max(cts.minSpawnInterval, cts.spawnInterval - 50);
  }
}

function gameLoop(timestamp = 0) {
  if (cts.gamePaused || cts.gameOver) return;
  if (!cts.lastTimestamp) cts.lastTimestamp = timestamp;
  const delta = timestamp - cts.lastTimestamp;
  cts.lastTimestamp = timestamp;

  if (cts.gameOver) {
    drawUI(); 
    restartBtn.style.display = "block"; 
    return; 
  }

  cts.attackCooldown = Math.max(0, cts.attackCooldown - delta);

  updateSpawnInterval(delta);
  
  updateSwing(); // 加這行

  cts.ctx.clearRect(0, 0, cts.width, cts.height);
  movePlayer();

  cts.zombies.forEach(zombie => {
    if (!cts.knockbackTimeouts.has(zombie)) zombie.moveTowards(player.x, player.y);
    zombie.draw();
  });

  cts.items.forEach(item => item.draw());

  drawPlayer();
  drawUI();
  drawHealthBar();
  handleCollisions();

  if (timestamp - cts.lastSpawn > cts.spawnInterval) {
    spawnZombie();
    cts.lastSpawn = timestamp;
  }

  if (timestamp - cts.lastItemSpawn > cts.itemSpawnInterval) {
    spawnItem();
    cts.lastItemSpawn = timestamp;
  }

  requestAnimationFrame(gameLoop);
}

function endGame() {
  cts.gameOver = true;
  cts.gameOverDiv.style.display = "block";
  cts.finalScoreP.textContent = `你得到了 ${cts.score} 分！`;
  sounds.gameOver.play();
  saveToLeaderboard(cts.score);
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
  if (!cts.leaderboardOl) return;
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  cts.leaderboardOl.innerHTML = "";
  leaderboard.forEach((entry, i) => {
    const li = document.createElement("li");
    li.textContent = `#${i + 1} - ${entry.score} 分 (${new Date(entry.time).toLocaleString()})`;
    cts.leaderboardOl.appendChild(li);
  });
}

// 事件監聽
cts.canvas.addEventListener("mousedown", (e) => {
  if (e.button === 0) { 
    attackZombies();
  }
});

window.addEventListener("keydown", e => {
  cts.keys[e.key.toLowerCase()] = true;
});


window.addEventListener("keyup", e => {
  cts.keys[e.key.toLowerCase()] = false;
});

pauseBtn.addEventListener("click", () => {
  cts.gamePaused = !cts.gamePaused;
  if (!cts.gamePaused && !cts.gameOver) requestAnimationFrame(gameLoop);
});

restartBtn.addEventListener("click", () => {
  resetGame();
  cts.gameOverDiv.style.display = "none";
  requestAnimationFrame(gameLoop);
});


// 初始化 & 啟動遊戲
resetGame();

cts.canvas.addEventListener("mousemove", function (e) {
  const rect = cts.canvas.getBoundingClientRect();
  cts.mousePos.x = e.clientX - rect.left;
  cts.mousePos.y = e.clientY - rect.top;
});

requestAnimationFrame(gameLoop);
renderLeaderboard();


function resetGame() {
  player.x = cts.canvas.width / 2;
  player.y = cts.height / 2;
  player.health = cts.upgrades.maxHealth;
  player.mode = "knife";
  cts.zombies = [];
  cts.items = [];
  cts.score = 0;
  cts.survivalTime = 0;
  cts.spawnInterval = 2000;
  cts.lastSpawn = 0;
  cts.lastItemSpawn = 0;
  cts.gamePaused = false;
  cts.gameOver = false;
  cts.swinging = false;
  cts.attackCooldown = 0;
  restartBtn.style.display = "none";
  requestAnimationFrame(gameLoop); // ← 重啟遊戲
}

