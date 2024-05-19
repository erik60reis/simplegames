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
    let highScore = parseInt(webstorage.getItem(gamename + "HighScore")) || 0;
    let highScoreReplay = JSON.parse(webstorage.getItem(gamename + "HighScoreReplay") || "{}");

    const dailyChallengesKey = gamename + 'DailyChallenges';

    function initializeDailyChallenges() {
        const challenges = JSON.parse(webstorage.getItem(dailyChallengesKey) || "{}");
        const currentDate = new Date();
        const lastResetDate = challenges?.lastResetDate ? new Date(challenges.lastResetDate) : null;

        if (!lastResetDate || currentDate.getDate() !== lastResetDate.getDate()) {
            const newChallenges = {
                lastResetDate: currentDate.toISOString(),
                scoreChallenge: 40,
                teleporterChallenge: 25,
                gamesPlayedChallenge: 10
            };
            webstorage.setItem(dailyChallengesKey, JSON.stringify(newChallenges));
        }

        displayChallengeProgress();
    }

    function updateChallengeProgress() {
        const challenges = JSON.parse(webstorage.getItem(dailyChallengesKey) || "{}");

        if (!challenges.lastResetDate) return;

        challenges.scoreChallenge = Math.max(challenges.scoreChallenge - score, 0);

        if (score >= 1) {
            challenges.gamesPlayedChallenge = Math.max(challenges.gamesPlayedChallenge - 1, 0);
        }

        webstorage.setItem(dailyChallengesKey, JSON.stringify(challenges));

        displayChallengeProgress();
    }

    function displayChallengeProgress() {
        document.getElementById("submithighscore").disabled = true;
        const challenges = JSON.parse(webstorage.getItem(dailyChallengesKey) || "{}");

        if (!challenges.lastResetDate) return;

        if (challenges.scoreChallenge === 0 && challenges.teleporterChallenge === 0 && challenges.gamesPlayedChallenge === 0) {
            document.getElementById("submithighscore").disabled = false;
        }

        document.getElementById("DailyChallenges").innerHTML = `
            <h3>Daily Challenges</h3>
            <table id="leaderboardTable">
                <tr>
                    <th id="challenge-scoreChallenge">Eat Apples (${40 - challenges.scoreChallenge}/40)</th>
                </tr>
                <tr>
                    <th id="challenge-teleporterChallenge">Use Teleporters (${25 - challenges.teleporterChallenge}/25)</th>
                </tr>
                <tr>
                    <th  id="challenge-gamesPlayedChallenge">Play games (${10 - challenges.gamesPlayedChallenge}/10)</th>
                </tr>
            </table>
        `;

        if (challenges.scoreChallenge <= 0) {
            document.getElementById("challenge-scoreChallenge").style.textDecoration = "line-through";
        }

        if (challenges.teleporterChallenge <= 0) {
            document.getElementById("challenge-teleporterChallenge").style.textDecoration = "line-through";
        }

        if (challenges.gamesPlayedChallenge <= 0) {
            document.getElementById("challenge-gamesPlayedChallenge").style.textDecoration = "line-through";
        }
    }

    initializeDailyChallenges();

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

        walls.forEach((element) => {
            if (apple.x === element.x && apple.y === element.y) {
                placeApple();
            }
        });

        teleporters.forEach((element) => {
            if (apple.x === element.x && apple.y === element.y) {
                placeApple();
            }
        });
    }

    placeApple();

    function resetGame() {
        updateChallengeProgress();
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

                const challenges = JSON.parse(webstorage.getItem(dailyChallengesKey) || "{}");
    
                if (challenges.lastResetDate) {
                    if (challenges.teleporterChallenge > 0) {
                        challenges.teleporterChallenge -= 1;
                        webstorage.setItem(dailyChallengesKey, JSON.stringify(challenges));
                    }
                }
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
                snake.maxCells = 10000;
            }
        }
    }

    function updateScore() {
        scoreElement.textContent = `🍎${score} 🏆${highScore}`;
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
        highScoreReplay = JSON.parse(webstorage.getItem(gamename + "HighScoreReplay") || "{}");
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