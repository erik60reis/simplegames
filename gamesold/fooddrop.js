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
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 480;
    canvas.height = 854;

    canvas.style.width = `${480 / 1.5}px`;
    canvas.style.height = `${854 / 1.5}px`;

    const basketWidth = 75;
    const basketHeight = 75;
    const basketSpeed = 8;
    const foodRadius = 15;
    let score = 0;
    let highScore = parseInt(webstorage.getItem(gamename + "HighScore")) || 0;
    let missedFood = 0;
    const maxMissedFood = 1;

    let basketX = (canvas.width - basketWidth) / 2;
    let rightPressed = false;
    let leftPressed = false;

    const usedImages = {};

    const foodArray = [];
    const foodDropSpeed = 2;
    const foodMinFrequency = 20;
    const foodMaxFrequency = 100;
    let remainingFramesToSpawnFood = 1.5;

    function addImage(name, url) {
        usedImages[name] = new Image();
        usedImages[name].src = url;
    }

    addImage('player', '/assets/fooddropgameassets/player.png');

    let foodCount = 104;
    let notFoodCount = 4;

    for (let i = 1; i <= foodCount; i++) {
        addImage('food-' + i, '/assets/fooddropgameassets/food (' + i + ').png');
    }

    for (let i = 1; i <= notFoodCount; i++) {
        addImage('not-food-' + i, '/assets/fooddropgameassets/not-food (' + i + ').png');
    }


    document.addEventListener('keydown', keyDownHandler, false);
    document.addEventListener('keyup', keyUpHandler, false);

    function keyDownHandler(e) {
        if (e.key === 'd' || e.key === 'ArrowRight') {
            rightPressed = true;
        } else if (e.key === 'a' || e.key === 'ArrowLeft') {
            leftPressed = true;
        }
    }

    function keyUpHandler(e) {
        if (e.key === 'd' || e.key === 'ArrowRight') {
            rightPressed = false;
        } else if (e.key === 'a' || e.key === 'ArrowLeft') {
            leftPressed = false;
        }
    }

    // Função para desenhar a cesta
    function drawBasket() {
        ctx.beginPath();
        ctx.drawImage(usedImages['player'], basketX, canvas.height - basketHeight - 25, basketWidth, basketHeight);
        ctx.fillStyle = '#0095DD';
        ctx.fill();
        ctx.closePath();
    }

    function drawFoodObject(foodObject) {
        ctx.beginPath();
        const imageName = foodObject.isFood ? 'food-' + foodObject.type : 'not-food-' + foodObject.type;
        ctx.drawImage(usedImages[imageName], foodObject.x, foodObject.y, 50, 50);
        ctx.fillStyle = foodObject.isFood ? '#FF0000' : '#000000';
        ctx.fill();
        ctx.closePath();
    }

    function generateFood() {
        remainingFramesToSpawnFood--;
        if (remainingFramesToSpawnFood <= 0) {
            remainingFramesToSpawnFood = Math.random() * (foodMaxFrequency - foodMinFrequency + 1) + foodMinFrequency;
            const x = Math.random() * ((canvas.width - 50) - foodRadius * 2) + foodRadius;
            const isFood = Math.random() < 0.85; //85% food | 15% chance not food
            const foodObjectType = isFood ? Math.floor(Math.random() * (foodCount - 1 + 1) + 1) : Math.floor(Math.random() * (notFoodCount - 1 + 1) + 1);
            foodArray.push({ type: foodObjectType, x: x, y: -foodRadius, isFood: isFood });
        }
    }

    function updateFood() {
        for (let i = 0; i < foodArray.length; i++) {
            const foodObject = foodArray[i];
            foodObject.y += foodDropSpeed;

            if (
                foodObject.y + foodRadius > canvas.height - basketHeight &&
                foodObject.x > (basketX - 10) &&
                foodObject.x < (basketX + basketWidth + 10)
            ) {
                if (foodObject.isFood) {
                    score++;
                } else {
                    resetGame();
                }
                foodArray.splice(i, 1);
                i--;
            } else if (foodObject.y > canvas.height) {
                if (foodObject.isFood) {
                    missedFood++;
                    if (missedFood >= maxMissedFood) {
                        resetGame();
                    }
                }
                foodArray.splice(i, 1);
                i--;
            }
        }
    }

    function updateScore() {
        const scoreElement = document.getElementById('score');
        scoreElement.textContent = `Score: ${score}  High Score: ${highScore}`;
    }

    // Função para resetar o jogo
    function resetGame() {
        if (score > highScore) {
            highScore = score;
            webstorage.setItem(gamename + "HighScore", highScore.toString());
        }
        score = 0;
        missedFood = 0;
        foodArray.length = 0; // Limpa o array de comida
        basketX = (canvas.width - basketWidth) / 2; // Reposiciona a cesta
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#CDFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawBasket();
        foodArray.forEach(drawFoodObject);
        updateScore();

        if (rightPressed && basketX < canvas.width - basketWidth) {
            basketX += basketSpeed;
        } else if (leftPressed && basketX > 0) {
            basketX -= basketSpeed;
        }

        generateFood();
        updateFood();

        requestAnimationFrame(draw);
    }

    // Inicia o jogo
    draw();


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