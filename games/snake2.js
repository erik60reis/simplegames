const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 10;
const snake = {
    x: 160,
    y: 160,
    dx: gridSize,
    dy: 0,
    cells: [],
    maxCells: 4
};

let apple = {
    x: 320,
    y: 320
};

let score = 0;
let highScore = localStorage.getItem(gamename + 'HighScore') || 0;

const scoreElement = document.getElementById('score');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function placeApple() {
    apple.x = getRandomInt(1, (canvas.width / gridSize) - 1) * gridSize;
    apple.y = getRandomInt(1, (canvas.height / gridSize) - 1) * gridSize;

    // Ensure the apple does not spawn on the snake
    snake.cells.forEach((cell) => {
        if (apple.x === cell.x && apple.y === cell.y) {
            placeApple(); // Recursively place the apple again
        }
    });
}

function resetGame() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(gamename + 'HighScore', highScore);
    }
    score = 0;
    snake.x = 160;
    snake.y = 160;
    snake.cells = [];
    snake.maxCells = 4;
    snake.dx = gridSize;
    snake.dy = 0;
    placeApple(); // Place a new apple when resetting the game
    updateScore(); // Update score and highScore display
}

function update() {
    snake.x += snake.dx;
    snake.y += snake.dy;

    if (snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
        resetGame();
    }

    snake.cells.unshift({ x: snake.x, y: snake.y });

    if (snake.cells.length > snake.maxCells) {
        snake.cells.pop();
    }

    snake.cells.forEach((cell, index) => {
        if (index === 0) {
            ctx.fillStyle = 'blue';
        } else {
            ctx.fillStyle = 'lightblue';
        }
        ctx.fillRect(cell.x, cell.y, gridSize - 1, gridSize - 1);

        // Check collision with snake's own body
        if (cell.x === snake.x && cell.y === snake.y && index > 0) {
            resetGame();
        }
    });

    // Draw apple
    ctx.fillStyle = 'red';
    ctx.fillRect(apple.x, apple.y, gridSize - 1, gridSize - 1);

    // Check if snake eats the apple
    if (snake.x === apple.x && snake.y === apple.y) {
        snake.maxCells++;
        score++;
        placeApple(); // Place a new apple when eaten
        updateScore(); // Update score display
    }
}

function updateScore() {
    scoreElement.textContent = `Score: ${score}  High Score: ${highScore}`;
}

function keyDownHandler(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (snake.dx === 0) {
            snake.dx = -gridSize;
            snake.dy = 0;
        }
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        if (snake.dx === 0) {
            snake.dx = gridSize;
            snake.dy = 0;
        }
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
        if (snake.dy === 0) {
            snake.dy = -gridSize;
            snake.dx = 0;
        }
    } else if (e.key === 'ArrowDown' || e.key === 's') {
        if (snake.dy === 0) {
            snake.dy = gridSize;
            snake.dx = 0;
        }
    }
}

document.addEventListener('keydown', keyDownHandler);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
}

updateScore();

setInterval(() => {
    gameLoop();
}, 1000 / 15);