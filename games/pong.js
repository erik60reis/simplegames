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
    
    const scoreElement = document.getElementById('score');

    // Obtendo referência ao canvas e ao contexto 2D
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Definições iniciais do jogo
    let score = 0;
    let highScore = parseInt(webstorage.getItem(gamename + "HighScore")) || 0;
    let gameOver = false;

    // Configurações do paddle
    const paddleWidth = 10;
    const paddleHeight = 60;
    let paddleY = (canvas.height - paddleHeight) / 2; // Posição inicial do paddle
    const paddleSpeed = 24;

    // Configurações da bola
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballDirectionX = 1;
    let ballDirectionY = 1;
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
        ballX += ballDirectionX * ballSpeedX;
        ballY += ballDirectionY * ballSpeedY;

        ballSpeedX = Math.min(ballSpeedX + 0.01, 10);
        ballSpeedY = Math.min(ballSpeedY + 0.01, 10);

        // Verificar colisão com o paddle
        if (
            ballX - ballRadius <= 5 + paddleWidth &&
            ballY >= paddleY && ballY <= paddleY + paddleHeight
        ) {
            ballDirectionX = Math.abs(ballDirectionX);
            let deltaY = ballY - (paddleY + paddleHeight / 2);
            ballSpeedY = deltaY * 0.2;
        }

        if (ballX + ballRadius >= canvas.width) {
            ballDirectionX = -ballDirectionX;
            score += 1;
        }

        if (ballY + ballRadius >= canvas.height || ballY - ballRadius <= 0) {
            ballDirectionY = -ballDirectionY;
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
            webstorage.setItem(gamename + "HighScore", highScore.toString());
        }
        score = 0;
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = 5;
        ballSpeedY = 5;
        ballDirectionX = 1;
        ballDirectionY = 1;
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