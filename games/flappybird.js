const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let birdY = canvas.height / 2;
let velocity = 0;
let gravity = 0.6;
let jumpStrength = -10;
let obstacles = [];
let gameSpeed = 2;
let score = 0;
let highScore = localStorage.getItem(gamename + 'HighScore') || 0;

document.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.key === " " || event.key === "ArrowUp" || event.key === "W" || event.key === "w") {
        velocity = jumpStrength;
    }
});

function drawBird() {
    ctx.fillStyle = "yellow";
    ctx.fillRect(50, birdY, 30, 30);
}

function drawObstacles() {
    ctx.fillStyle = "green";
    for (let obstacle of obstacles) {
        ctx.fillRect(obstacle.x, 0, obstacle.width, obstacle.top);
        ctx.fillRect(obstacle.x, obstacle.bottom, obstacle.width, canvas.height - obstacle.bottom);
    }
}

function updateObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= gameSpeed;
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            i--;
            score++;
        }
    }
    if (obstacles.length === 0 || canvas.width - obstacles[obstacles.length - 1].x > 300) {
        let obstacleGap = 175;
        let minHeight = 50;
        let maxHeight = canvas.height - 50 - obstacleGap;
        let height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);

        let obstacle = {
            x: canvas.width,
            top: height,
            bottom: height + obstacleGap,
            width: 30,
        };
        obstacles.push(obstacle);
    }
}

function checkCollisions() {
    if (birdY + 30 > canvas.height || birdY < 0) {
        gameOver();
    }
    for (let obstacle of obstacles) {
        if (
            50 + 30 > obstacle.x &&
            50 < obstacle.x + obstacle.width &&
            (birdY < obstacle.top || birdY + 30 > obstacle.bottom)
        ) {
            gameOver();
        }
    }
}

function gameOver() {
    if (score > highScore) {
        localStorage.setItem(gamename + 'HighScore', score);
        highScore = score;
    }
    resetGame();
}

function resetGame() {
    birdY = canvas.height / 2;
    velocity = 0;
    score = 0;
    obstacles = [];
    updateScore();
}

function updateScore() {
    const scoreElement = document.getElementById('score');
    scoreElement.textContent = `Score: ${score}  High Score: ${highScore}`;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBird();
    drawObstacles();
    birdY += velocity;
    velocity += gravity;
    updateObstacles();
    checkCollisions();
    updateScore();
    requestAnimationFrame(gameLoop);
}

gameLoop();