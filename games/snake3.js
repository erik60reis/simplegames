(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let canMove = true;

    let isFlippedX = false;
    let isFlippedY = false;

    const gridSize = 10;
    const snake = {
        x: 160,
        y: 160,
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
        
    ]

    let gameFrameRate = 1000 / 15;

    for (let i = 0; i < 400; i++) {
        walls.push({
            x: i,
            y: 200
        })
    }

    let teleporterwalllength = 10;

    for (let i = 0; i < teleporterwalllength; i++) {
        teleporters.push({
            x: 350,
            y: 100 - Math.round(teleporterwalllength * gridSize / 2) + i * gridSize,
            teleportTo: {
                x: 50,
                y: 300 - Math.round(teleporterwalllength * gridSize / 2) + i * gridSize
            }
        });
        teleporters.push({
            x: 50,
            y: 300 - Math.round(teleporterwalllength * gridSize / 2) + i * gridSize,
            teleportTo: {
                x: 350,
                y: 100 - Math.round(teleporterwalllength * gridSize / 2) + i * gridSize
            }
        });
    }

    let apple = {
        x: 320,
        y: 320
    };

    let score = 0;
    let highScore = 0;

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
                placeApple();
            }
        });

        walls.forEach((wall) => {
            if (apple.x === wall.x && apple.y === wall.y) {
                placeApple();
            }
        });
    }

    function resetGame() {
        if (score > highScore) {
            highScore = score;
        }
        score = 0;
        gameFrameRate = 1000 / 15;
        isAppleTeleporting = false;
        applenextteleportcooldown = 25;
        isFlippedX = false;
        isFlippedY = false;
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

        canMove = true;

        ctx.restore();
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
                snake.maxCells = 139;
            }
        }
    }

    function updateScore() {
        scoreElement.textContent = `Score: ${score}  High Score: ${highScore}`;
    }

    function keyDownHandler(e) {
        if (canMove) {
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                if (snake.dx === 0) {
                    snake.dx = -gridSize;
                    snake.dy = 0;
                    canMove = false;
                }
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                if (snake.dx === 0) {
                    snake.dx = gridSize;
                    snake.dy = 0;
                    canMove = false;
                }
            } else if (e.key === 'ArrowUp' || e.key === 'w') {
                if (snake.dy === 0) {
                    snake.dy = -gridSize;
                    snake.dx = 0;
                    canMove = false;
                }
            } else if (e.key === 'ArrowDown' || e.key === 's') {
                if (snake.dy === 0) {
                    snake.dy = gridSize;
                    snake.dx = 0;
                    canMove = false;
                }
            }
        }
    }

    document.addEventListener('keydown', keyDownHandler);

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


    document.getElementById("submithighscore").onclick = async function() {
        const playerName = document.getElementById('playerName').value;
        const currentScore = highScore;
        if (playerName && currentScore > 0) {
            try {
                const response = await fetch(`/games/${gamename}/leaderboard`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: playerName, score: currentScore })
                });
                if (response.ok) {
                    alert('High score submitted successfully!');
                    fetchLeaderboard(); // Refresh leaderboard after submission
                } else {
                    throw new Error('Failed to submit high score');
                }
            } catch (error) {
                console.error('Error submitting high score:', error);
                alert('Failed to submit high score. Please try again.');
            }
        } else {
            alert('Please enter your name and achieve a score greater than 0 to submit.');
        }
    }
})();