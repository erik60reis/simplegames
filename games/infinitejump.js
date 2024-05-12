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
const context = canvas.getContext('2d');

let playerImage = new Image();
playerImage.src = "/assets/impossiblejumpassets/player.png";

let groundImage = new Image();
groundImage.src = "/assets/impossiblejumpassets/ground.png";

let score = 0;
let highScore = parseInt(webstorage.getItem(gamename + "HighScore")) || 0; 

// width and height of each platform and where platforms start
const platformWidth = 65;
const platformHeight = 20;
const platformStart = canvas.height - 50;

// player physics
const gravity = 0.33;
const drag = 0.3;
const bounceVelocity = -12.5;

// minimum and maximum vertical space between each platform
let minPlatformSpace = 20;
let maxPlatformSpace = 30;

// information about each platform. the first platform starts in the
// bottom middle of the screen
let platforms = [{
  x: canvas.width / 2 - platformWidth / 2,
  y: platformStart
}];

// get a random number between the min (inclusive) and max (exclusive)
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// fill the initial screen with platforms
let y = platformStart;
while (y > 0) {
  // the next platform can be placed above the previous one with a space
  // somewhere between the min and max space
  y -= platformHeight + random(minPlatformSpace, maxPlatformSpace);

  // a platform can be placed anywhere 25px from the left edge of the canvas
  // and 25px from the right edge of the canvas (taking into account platform
  // width).
  // however the first few platforms cannot be placed in the center so
  // that the player will bounce up and down without going up the screen
  // until they are ready to move
  let x;
  do {
    x = random(25, canvas.width - 25 - platformWidth);
  } while (
    y > canvas.height / 2 &&
    x > canvas.width / 2 - platformWidth * 1.5 &&
    x < canvas.width / 2 + platformWidth / 2
  );

  let isMovingPlatform = Math.random() <= 0.3;
  let isCrackable = !isMovingPlatform && Math.random() <= 0.2;
  platforms.push({ x, y, isMovingPlatform, isCrackable });
}

// the doodle jumper
const doodle = {
  width: 40,
  height: 60,
  x: canvas.width / 2 - 20,
  y: platformStart - 60,

  dx: 0,
  dy: 0
};

// keep track of player direction and actions
let playerDir = 0;
let keydown = false;
let prevDoodleY = doodle.y;

// game loop
function loop() {
    requestAnimationFrame(loop);
    context.clearRect(0,0,canvas.width,canvas.height);

    // apply gravity to doodle
    doodle.dy += gravity;

    // if doodle reaches the middle of the screen, move the platforms down
    // instead of doodle up to make it look like doodle is going up
    if (doodle.y < canvas.height / 2 && doodle.dy < 0) {
        platforms.forEach(function(platform, platformindex) {
            platform.y += -doodle.dy;
            score += -Math.round(doodle.dy / 10);


            if (platform.isMovingPlatform) {
                if (platform.x <= 0) {
                    platform.moveDirection = 'right'; // Change direction to right if at left edge
                } else if (platform.x + platformWidth >= canvas.width) {
                    platform.moveDirection = 'left'; // Change direction to left if at right edge
                }
            
                // Move platform based on current direction
                if (platform.moveDirection === 'right') {
                    platform.x += 3; // Move right
                } else {
                    platform.x -= 3; // Move left
                }

                // Draw platform
                context.fillStyle = 'green';
                context.drawImage(groundImage, platform.x, platform.y, platformWidth, platformHeight);
            }
        });

    

        // add more platforms to the top of the screen as doodle moves up
        while (platforms[platforms.length - 1].y > 0) {
            let isMovingPlatform = Math.random() <= 0.3;
            let isCrackable = !isMovingPlatform && Math.random() <= 0.2;
            platforms.push({
                x: random(25, canvas.width - 25 - platformWidth),
                y: platforms[platforms.length - 1].y - (platformHeight + random(minPlatformSpace, maxPlatformSpace)),
                isMovingPlatform,
                isCrackable
            })

            // add a bit to the min/max platform space as the player goes up
            minPlatformSpace += 0.5;
            maxPlatformSpace += 0.5;

            // cap max space
            maxPlatformSpace = Math.min(maxPlatformSpace, (canvas.height / 2) - 15);
        }
    }
    else {
        doodle.y += doodle.dy;

        if (doodle.y - doodle.height >= canvas.height) {
            resetGame();
        }
    }

    // only apply drag to horizontal movement if key is not pressed
    if (!keydown) {
        if (playerDir < 0) {
            doodle.dx += drag;

            // don't let dx go above 0
            if (doodle.dx > 0) {
                doodle.dx = 0;
                playerDir = 0;
        }
        }
        else if (playerDir > 0) {
            doodle.dx -= drag;

            if (doodle.dx < 0) {
                doodle.dx = 0;
                playerDir = 0;
            }
        }
    }

    doodle.x += doodle.dx;

    // make doodle wrap the screen
    if (doodle.x + doodle.width < 0) {
        doodle.x = canvas.width;
    }
    else if (doodle.x > canvas.width) {
        doodle.x = -doodle.width;
    }

    // draw platforms
    context.fillStyle = 'green';
    platforms.forEach(function(platform, platformindex) {
        context.drawImage(groundImage, platform.x, platform.y, platformWidth, platformHeight);

        // make doodle jump if it collides with a platform from above
        if (
            // doodle is falling
            doodle.dy > 0 &&

            // doodle was previous above the platform
            prevDoodleY + doodle.height <= platform.y &&

            // doodle collides with platform
            // (Axis Aligned Bounding Box [AABB] collision check)
            doodle.x < platform.x + platformWidth &&
            doodle.x + doodle.width > platform.x &&
            doodle.y < platform.y + platformHeight &&
            doodle.y + doodle.height > platform.y
        ) {
            // reset doodle position so it's on top of the platform
            doodle.y = platform.y - doodle.height;
            doodle.dy = bounceVelocity;

            if (platform.isCrackable) {
                platforms.splice(platformindex, 1);
            }
        }
    });

  // draw doodle
  context.fillStyle = 'yellow';
  context.drawImage(playerImage, doodle.x, doodle.y, doodle.width, doodle.height);

  prevDoodleY = doodle.y;

  // remove any platforms that have gone offscreen
  platforms = platforms.filter(function(platform) {
    return platform.y < canvas.height;
  })
}

// listen to keyboard events to move doodle
document.addEventListener('keydown', function(e) {
  // left arrow key
  if (["ArrowLeft", "a"].includes(e.key)) {
    keydown = true;
    playerDir = -1;
    doodle.dx = -3;

  }
  // right arrow key
  else if (["ArrowRight", "d"].includes(e.key)) {
    keydown = true;
    playerDir = 1;
    doodle.dx = 3;
  }
});

document.addEventListener('keyup', function(e) {
  keydown = false;
});

function resetGame() {
    if (score > highScore) {
        highScore = score;
        webstorage.setItem(gamename + "HighScore", highScore.toString());
    }
    score = 0;

    // Reset platform related variables
    platforms = [{
      x: canvas.width / 2 - platformWidth / 2,
      y: platformStart
    }];
  
    minPlatformSpace = 20;
    maxPlatformSpace = 30;
  
    let y = platformStart;
    while (y > 0) {
      y -= platformHeight + random(minPlatformSpace, maxPlatformSpace);
      let x;
      do {
        x = random(25, canvas.width - 25 - platformWidth);
      } while (
        y > canvas.height / 2 &&
        x > canvas.width / 2 - platformWidth * 1.5 &&
        x < canvas.width / 2 + platformWidth / 2
      );
      let isMovingPlatform = Math.random() <= 0.3;
      let isCrackable = !isMovingPlatform && Math.random() <= 0.2;
      platforms.push({ x, y, isMovingPlatform, isCrackable });
    }
  
    // Reset doodle position and velocity
    doodle.x = canvas.width / 2 - 20;
    doodle.y = platformStart - 60;
    doodle.dx = 0;
    doodle.dy = 0;
  
    // Reset player direction and key state
    playerDir = 0;
    keydown = false;
  
    // Reset platform space parameters
    minPlatformSpace = 15;
    maxPlatformSpace = 20;
  
    // Restart the game loop
}  

// start the game
requestAnimationFrame(loop);


function updateScore() {
    const scoreElement = document.getElementById('score');
    scoreElement.textContent = `Score: ${score}  High Score: ${highScore}`;
    requestAnimationFrame(updateScore);
}

updateScore();

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