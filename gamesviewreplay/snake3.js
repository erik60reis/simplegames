(async () => {    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let isFlippedX = false;
    let isFlippedY = false;

    const gridSize = 8;

    const snake = {
        x: 160,
        y: 80,
        dx: gridSize,
        dy: 0,
        cells: [],
        maxCells: 4
    };

    let isAppleTeleporting = false;
    let applenextteleportcooldown = 25;

    let walls = [

    ];

    let teleporters = [
        
    ];

    let gameFrameRate = 1000 / 15;

    for (let i = 0; i < (canvas.width / gridSize); i++) {
        walls.push({
            x: i * gridSize,
            y: 200
        })
    }

    for (let i = 0; i < (canvas.width / gridSize); i++) {
        walls.push({
            x: 200 + i * gridSize,
            y: 136
        })
    }

    let teleporterwalllength = 10;

    for (let i = 0; i < teleporterwalllength; i++) {
        teleporters.push({
            x: 320,
            y: 40 + i * gridSize,
            teleportTo: {
                x: 40,
                y: 240 + i * gridSize
            }
        });
        teleporters.push({
            x: 40,
            y: 240 + i * gridSize,
            teleportTo: {
                x: 320,
                y: 40 + i * gridSize
            }
        });
    }

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

    const dailyChallengesKey = gamename + 'DailyChallenges';

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
        currentReplay.randomSeed = Math.random();
        randomNumberGenerator = isaacCSPRNG(currentReplay.randomSeed);
        currentReplay.replayCode = "";
        score = 0;
        gameFrameRate = 1000 / 15;
        isAppleTeleporting = false;
        applenextteleportcooldown = 25;
        isFlippedX = false;
        isFlippedY = false;
        snake.x = 160;
        snake.y = 80;
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

        if (isAppleTeleporting) {
            applenextteleportcooldown--;
            if (applenextteleportcooldown <= 0) {
                applenextteleportcooldown = 25;
                placeApple();
            }
        } else {
            applenextteleportcooldown = 25;
        }

        if (snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
            resetGame();
        }

        snake.cells.unshift({ x: snake.x, y: snake.y });

        while (snake.cells.length > snake.maxCells) {
            snake.cells.pop();
        }

        ctx.save();
        ctx.translate((isFlippedX ? canvas.width : 0), (isFlippedY ? canvas.height : 0));
        ctx.scale((isFlippedX ? -1 : 1), (isFlippedY ? -1 : 1));
        
        snake.cells.forEach((cell, index) => {
            if (index === 0) {
                ctx.fillStyle = '#FF00FF';
            } else {
                ctx.fillStyle = 'lightpink';
            }
            ctx.fillRect(cell.x, cell.y, gridSize - 1, gridSize - 1);

            // Check collision with snake's own body
            if (cell.x === snake.x && cell.y === snake.y && index > 0) {
                resetGame();
            }
        });

        walls.forEach((wall) => {
            ctx.fillStyle = 'gray';

            ctx.fillRect(wall.x, wall.y, gridSize - 1, gridSize - 1);

            // Check collision with the wall
            if (wall.x === snake.x && wall.y === snake.y) {
                resetGame();
            }
        });

        for (let teleporter of teleporters) {
            ctx.fillStyle = '#FF00FF';

            ctx.fillRect(teleporter.x, teleporter.y, gridSize - 1, gridSize - 1);

            // Check collision with the wall
            if (teleporter.x === snake.x && teleporter.y === snake.y) {
                snake.x = teleporter.teleportTo.x;
                snake.y = teleporter.teleportTo.y;
                break;
            }
        }

        // Draw apple
        ctx.fillStyle = 'red';
        ctx.fillRect(apple.x, apple.y, gridSize - 1, gridSize - 1);

        // Check if snake eats the apple
        if (snake.x === apple.x && snake.y === apple.y) {
            snake.maxCells++;
            score++;
            placeApple(); // Place a new apple when eaten
            updateScore(); // Update score display
            applyEffect();
        }
        ctx.restore();
    
        replayframeindex++;
    }

    function applyEffect() {
        let effectIndex = (score % 15);

        isFlippedX = false;
        isFlippedY = false;
        isAppleTeleporting = false;

        snake.maxCells = score + 4;

        if (effectIndex === 1) {
            gameFrameRate = 1000 / 5;
        }else if (effectIndex === 2) {
            gameFrameRate = 1000 / 15;
        }else if (effectIndex === 0) {
            gameFrameRate = 1000 / 25;
        }else if (effectIndex === 3) {
            isFlippedX = true;
        }else if (effectIndex === 4) {
            gameFrameRate = 1000 / 20;
        }else if (effectIndex === 5) {
            gameFrameRate = 1000 / 15;
        }else if (effectIndex >= 8 && effectIndex <= 9) {
            isAppleTeleporting = true;
        }else if (effectIndex === 14) {
            if (score <= 135) {
                snake.maxCells = 10000;
            }
        }
    }

    function updateScore() {
        scoreElement.textContent = `Score: ${score}`;
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        update();
        setTimeout(() => {
            gameLoop();
        }, gameFrameRate);
    }

    updateScore();

    setTimeout(() => {
        gameLoop();
    }, gameFrameRate);
})();