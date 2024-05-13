(() => {
    let masterseed = 'qwertyuiopzxcvbnm';
    let localstoragekeypassword = 'password---password';
    let localstoragevaluepassword = 'mnbvcxzpoiuytrewq';
    let webstorage = {
        setItem: (key, value) => {
            let chiper = isaacCSPRNG(masterseed);
            window.localStorage.setItem(chiper.encipher(localstoragekeypassword, key), chiper.encipher(localstoragevaluepassword, value));
        },
        getItem: (key) => {
            let chiper = isaacCSPRNG(masterseed);
            let itemEncryptedValue = window.localStorage.getItem(chiper.encipher(localstoragekeypassword, key));
            if (itemEncryptedValue) {
                return chiper.decipher(localstoragevaluepassword, itemEncryptedValue);
            }
        }
    };

    let currentReplay = {
        randomSeed: Math.random(),
        replayCode: ""
    };
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let canMove = true;

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
    let highScore = parseInt(webstorage.getItem(gamename + "HighScore")) || 0;
    let highScoreReplay = JSON.parse(webstorage.getItem(gamename + "HighScoreReplay") || "{}");

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
        if (score > highScore) {
            highScore = score;
            webstorage.setItem(gamename + "HighScore", highScore.toString());
            highScoreReplay = currentReplay;
            webstorage.setItem(gamename + "HighScoreReplay", JSON.stringify(highScoreReplay));
        }
        currentReplay.randomSeed = Math.random();
        randomNumberGenerator = isaacCSPRNG(currentReplay.randomSeed);
        currentReplay.replayCode = "";
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

        if (snake.dx === gridSize && snake.dy === 0) {
            currentReplay.replayCode += "r";
        }
        if (snake.dx === -gridSize && snake.dy === 0) {
            currentReplay.replayCode += "l";
        }
        if (snake.dx === 0 && snake.dy === gridSize) {
            currentReplay.replayCode += "d";
        }
        if (snake.dx === 0 && snake.dy === -gridSize) {
            currentReplay.replayCode += "u";
        }
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

        canMove = true;
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
    }

    updateScore();

    setInterval(() => {
        gameLoop();
    }, 1000 / 15);

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
                    body: JSON.stringify({ name: playerName, score: currentScore, replay: highScoreReplay })
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