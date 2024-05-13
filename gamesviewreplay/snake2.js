(async () => {    
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
    let replayuser = await (async () => {
        let leaderboard = await fetchLeaderboard();
        return leaderboard.find(u => u.name === username);
    })();

    let currentReplay = JSON.parse(replayuser.replay);

    let replayframeindex = 0;

    const scoreElement = document.getElementById('score');
    
    let randomNumberGenerator = isaacCSPRNG(currentReplay.randomSeed);

    function getRandomInt(min, max) {
        return Math.floor(randomNumberGenerator.random() * (max - min)) + min;
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

    placeApple();

    function resetGame() {

        replayframeindex = 0;
        randomNumberGenerator = isaacCSPRNG(currentReplay.randomSeed);
        score = 0;
        snake.x = 160;
        snake.y = 160;
        snake.cells = [];
        snake.maxCells = 4;
        snake.dx = gridSize;
        snake.dy = 0;
        placeApple(); // Place a new apple when resetting the game
        updateScore(); // Update score and highScore display

       window.location.href = window.location.href;
    }

    function update() {
        if (currentReplay.replayCode[replayframeindex] === "r") {
            snake.dx = gridSize;
            snake.dy = 0;
        }
        if (currentReplay.replayCode[replayframeindex] === "l") {
            snake.dx = -gridSize;
            snake.dy = 0;
        }
        if (currentReplay.replayCode[replayframeindex] === "u") {
            snake.dx = 0;
            snake.dy = -gridSize;
        }
        if (currentReplay.replayCode[replayframeindex] === "d") {
            snake.dx = 0;
            snake.dy = gridSize;
        }

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

        replayframeindex++;
    }

    function updateScore() {
        scoreElement.textContent = `Score: ${score}`;
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        update();
    }

    updateScore();

    setInterval(() => {
        gameLoop();
    }, 1000 / 15);
})();