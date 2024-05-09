const scoreElement = document.getElementById('score');

// Obtendo referência ao canvas e ao contexto 2D
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Definições iniciais do jogo
let score = 0;
let highScore = localStorage.getItem(gamename + 'HighScore') || 0;
let gameOver = false;

// Configurações do paddle
const paddleWidth = 10;
const paddleHeight = 60;
let paddleY = (canvas.height - paddleHeight) / 2; // Posição inicial do paddle
const paddleSpeed = 24;

// Configurações da bola
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 5; // Velocidade horizontal da bola
let ballSpeedY = 5; // Velocidade vertical da bola
const ballRadius = 8;

// Função principal de desenho e atualização do jogo
function draw() {
    if (gameOver) return;

    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar paddle
    ctx.fillStyle = 'black';
    ctx.fillRect(5, paddleY, paddleWidth, paddleHeight);

    // Desenhar bola
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.closePath();

    // Movimentar a bola
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Verificar colisão com o paddle
    if (
        ballX - ballRadius <= 5 + paddleWidth &&
        ballY >= paddleY && ballY <= paddleY + paddleHeight
    ) {
        ballSpeedX = -ballSpeedX;
        let deltaY = ballY - (paddleY + paddleHeight / 2);
        ballSpeedY = deltaY * 0.2;
    }

    if (ballX + ballRadius >= canvas.width) {
        ballSpeedX = -ballSpeedX;
        score += 1;
    }

    if (ballY + ballRadius >= canvas.height || ballY - ballRadius <= 0) {
        ballSpeedY = -ballSpeedY;
    }

    if (ballX - ballRadius <= 0) {
        gameOver = true;
        resetGame();
    }

    updateScore();

    // Atualizar a tela
    requestAnimationFrame(draw);
}

// Reseta o jogo para o estado inicial
function resetGame() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(gamename + 'HighScore', highScore);
    }
    score = 0;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = 5;
    ballSpeedY = 5;
    paddleY = (canvas.height - paddleHeight) / 2;
    gameOver = false;
}

// Controles do paddle
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w') {
        if (paddleY > 0) paddleY -= paddleSpeed;
    } else if (e.key === 'ArrowDown' || e.key === 's') {
        if (paddleY < canvas.height - paddleHeight) paddleY += paddleSpeed;
    }
});

// Iniciar o jogo
draw();



function updateScore() {
    scoreElement.textContent = `Score: ${score}  High Score: ${highScore}`;
}