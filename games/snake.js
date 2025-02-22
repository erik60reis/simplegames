const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let currentReplay = {
    randomSeed: Math.random(),
    replayCode: ""
};

let randomNumberGenerator = isaacCSPRNG(currentReplay.randomSeed);

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

async function fetchLeaderboard() {
    try {
        const response = await fetch(`/games/${gamename}/leaderboard`);
        const leaderboardData = await response.json();
        const leaderboardTable = document.getElementById('leaderboardTable');
        leaderboardTable.innerHTML = '<tr class="leaderboardfirstrow"><th class="aligncenter">Rank</th><th class="aligncenter">Name</th><th class="aligncenter">Score</th></tr>';
        leaderboardData.forEach((entry, index) => {
            const row = `<tr class="leaderboardOtherRows"><td>#${index + 1}</td><td class="playerName"></td><td class="playerScore"></td></tr>`;
            leaderboardTable.innerHTML += row;
            document.getElementsByClassName("playerName")[document.getElementsByClassName("playerName").length - 1].textContent = entry.name;
            document.getElementsByClassName("playerScore")[document.getElementsByClassName("playerScore").length - 1].textContent = entry.score;
        });
        return leaderboardData;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
    }
}

// Configuração do canvas
canvas.width = 400;
canvas.height = 400;
const gridSize = 20;

// Variáveis do jogo
let snake = {
    x: 160,
    y: 160,
    dx: gridSize,
    dy: 0,
    cells: [],
    maxCells: 4
};

let apple = { x: 320, y: 320 };
let score = 0;
let highScore = parseInt(webstorage.getItem("snakeHighScore") || 0);
let canMove = true;

// Sistema de replay
function recordMovement() {
    if(snake.dx === gridSize) currentReplay.replayCode += 'r';
    if(snake.dx === -gridSize) currentReplay.replayCode += 'l';
    if(snake.dy === gridSize) currentReplay.replayCode += 'd';
    if(snake.dy === -gridSize) currentReplay.replayCode += 'u';
}

// Controles
function handleInput(dx, dy) {
    if(!canMove) return;
    snake.dx = dx;
    snake.dy = dy;
    canMove = false;
}

// Event handlers
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowLeft': case 'a': if(snake.dx === 0) handleInput(-gridSize, 0); break;
        case 'ArrowRight': case 'd': if(snake.dx === 0) handleInput(gridSize, 0); break;
        case 'ArrowUp': case 'w': if(snake.dy === 0) handleInput(0, -gridSize); break;
        case 'ArrowDown': case 's': if(snake.dy === 0) handleInput(0, gridSize); break;
    }
});

// Mobile controls
document.getElementById('upBtn').addEventListener('touchstart', () => handleInput(0, -gridSize));
document.getElementById('downBtn').addEventListener('touchstart', () => handleInput(0, gridSize));
document.getElementById('leftBtn').addEventListener('touchstart', () => handleInput(-gridSize, 0));
document.getElementById('rightBtn').addEventListener('touchstart', () => handleInput(gridSize, 0));

// Game loop
function update() {
    snake.x += snake.dx;
    snake.y += snake.dy;

    // Colisão com bordas
    if(snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
        resetGame();
        return;
    }

    // Atualizar posições
    snake.cells.unshift({x: snake.x, y: snake.y});
    if(snake.cells.length > snake.maxCells) snake.cells.pop();

    // Colisão consigo mesmo
    snake.cells.forEach((cell, index) => {
        if(index > 0 && cell.x === snake.x && cell.y === snake.y) {
            resetGame();
        }
    });

    // Coletar maçã
    if(snake.x === apple.x && snake.y === apple.y) {
        snake.maxCells++;
        score++;
        apple = {
            x: Math.floor(randomNumberGenerator.random() * (canvas.width/gridSize - 2) + 1) * gridSize,
            y: Math.floor(randomNumberGenerator.random() * (canvas.height/gridSize - 2) + 1) * gridSize
        };
    }

    draw();
    canMove = true;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar cobra
    snake.cells.forEach((cell, index) => {
        ctx.fillStyle = index === 0 ? 'green' : 'lightgreen';
        ctx.fillRect(cell.x, cell.y, gridSize-1, gridSize-1);
    });

    // Desenhar maçã
    ctx.fillStyle = 'red';
    ctx.fillRect(apple.x, apple.y, gridSize-1, gridSize-1);

    recordMovement();
    document.getElementById('score').textContent = `🍎${score} 🏆${highScore}`;
}

function resetGame() {
    if(score > highScore) {
        highScore = score;
        webstorage.setItem('snakeHighScore', highScore.toString());
        webstorage.setItem('snakeReplay', JSON.stringify(currentReplay));
    }
    
    score = 0;
    snake = {
        x: 160,
        y: 160,
        dx: gridSize,
        dy: 0,
        cells: [],
        maxCells: 4
    };
    
    currentReplay = {
        randomSeed: Math.random(),
        replayCode: ""
    };
}

// Leaderboard
document.getElementById('submithighscore').onclick = async function() {
    const playerName = document.getElementById('playerName').value;
    if(!playerName) return alert('Please enter your name');
    
    try {
        const response = await fetch(`/games/${gamename}/leaderboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: playerName,
                score: highScore,
                replay: webstorage.getItem('snakeReplay')
            })
        });
        
        if(response.ok) {
            fetchLeaderboard();
            alert('Score submitted!');
        }
    } catch(error) {
        console.error('Submission error:', error);
    }
};

// Atualizar leaderboard
fetchLeaderboard().then(() => setInterval(fetchLeaderboard, 30000));
setInterval(update, 1000/20);