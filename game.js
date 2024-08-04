var canvasBg = document.getElementById("canvasBg"),
    ctxBg = canvasBg.getContext("2d"),
    canvasEntities = document.getElementById("canvasEntities"),
    ctxEntities = canvasEntities.getContext("2d"),
    canvasWidth = canvasBg.width,
    canvasHeight = canvasBg.height,
    player1 = new Player(),
    enemies = [],
    numEnemies = 4,
    obstacles = [],
    isPlaying = false,
    isGameOver = false,
    requestAnimFrame =  window.requestAnimationFrame ||
                        window.webkitRequestAnimationFrame ||
                        window.mozRequestAnimationFrame ||
                        window.oRequestAnimationFrame ||
                        window.msRequestAnimationFrame ||
                        function(callback) {
                            window.setTimeout(callback, 1000 / 60);
                        },
    imgSprite = new Image();
imgSprite.src = "images/sprite.png";
imgSprite.addEventListener("load", init, false);

// Initialize the game and set up event listeners
function init() {
    document.addEventListener("keydown", function(e) {checkKey(e, true);}, false);
    document.addEventListener("keyup", function(e) {checkKey(e, false);}, false);
    defineObstacles();
    initEnemies();
    document.getElementById("startGameButton").addEventListener("click", startGame);
    document.getElementById("restartButton").addEventListener("click", restartGame);
    document.getElementById("gameOver").style.display = "none";
}

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('startGameButton').addEventListener('click', function() {
        document.getElementById('startScreen').classList.add('hidden');
        startGame(); // Call your game start function here
    });

});


// Start the game
function startGame() {
    if (isPlaying) return; // Prevent starting a new game if one is already in progress
    isPlaying = true;
    isGameOver = false;
    document.getElementById("gameOver").style.display = "none";
    document.getElementById("restartButton").style.display = "none";
    begin();
}



// Restart the game
function restartGame() {
    // Reset game state
    player1 = new Player();
    enemies = [];
    totalEnemies = numEnemies; // Reset the total enemies count
    initEnemies();
    isPlaying = true;
    isGameOver = false;
    document.getElementById("gameOver").style.display = "none";
    document.getElementById("restartButton").style.display = "none";
    begin();
}


// Main game loop
function loop() {
    if (isPlaying && !isGameOver) {
        update();
        draw();
        requestAnimFrame(loop);
    }
}


// Begin the game animation
function begin() {
    ctxBg.drawImage(imgSprite, 0, 0, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight);
    requestAnimFrame(loop);
}

// Global variables
var totalEnemies = numEnemies; // To keep track of the total number of enemies
var maxLevels = 3; // Define the total number of levels

// Update game state
function update() {
    if (isGameOver) return;
    clearCtx(ctxEntities);
    updateAllEnemies();
    player1.update();
    checkGameOver();
}

// Draw game elements
function draw() {
    drawAllEnemies();
    player1.draw();
}


// Check for game over conditions
function checkGameOver() {
    // Example condition: game over if the player collides with any enemy
    var allEnemiesDead = true;
    for (var i = 0; i < enemies.length; i++) {
        if (!enemies[i].isDead) {
            allEnemiesDead = false;
            break;
        }
    }

    if (allEnemiesDead) {
        nextLevel(); // Go to the next level if all enemies are dead
        return;
    }

    // Example condition: game over if the player collides with any enemy
    for (var i = 0; i < enemies.length; i++) {
        if (collision(player1, enemies[i])) {
            gameOver();
            return;
        }
    }
}



// Game over function
function gameOver() {
    isPlaying = false;
    isGameOver = true;
    document.getElementById("gameOver").style.display = "block";
    document.getElementById("restartButton").style.display = "block";
    document.getElementById("completeLevel").style.display = "none"; // Hide level completion message
}

// Clear the context for entities
function clearCtx(ctx) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
}

// Random number generator within a range
function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Player object constructor
function Player() {
    this.srcX = 0;
    this.srcY = 600;
    this.width = 35;
    this.height = 54;
    this.drawX = 400;
    this.drawY = 300;
    this.centerX = this.drawX + (this.width / 2);
    this.centerY = this.drawY + (this.height / 2);
    this.speed = 2;
    this.isUpKey = false;
    this.isRightKey = false;
    this.isDownKey = false;
    this.isLeftKey = false;
    this.isSpacebar = false;
    this.isShooting = false;
    var numBullets = 10;
    this.bullets = [];
    this.currentBullet = 0;
    for (var i = 0; i < numBullets; i++) {
        this.bullets[this.bullets.length] = new Bullet();
    }
}


// Update player state
Player.prototype.update = function() {
    this.centerX = this.drawX + (this.width / 2);
    this.centerY = this.drawY + (this.height / 2);
    this.checkDirection();
    this.checkShooting();
    this.updateAllBullets();
};


// Draw player and bullets
Player.prototype.draw = function() {
    this.drawAllBullets();
    ctxEntities.drawImage(imgSprite, this.srcX, this.srcY, this.width, this.height, this.drawX, this.drawY, this.width, this.height);
};


// Check player movement direction and handle obstacles
Player.prototype.checkDirection = function() {
    var newDrawX = this.drawX,
        newDrawY = this.drawY,
        obstacleCollision = false;
    if (this.isUpKey) {
        newDrawY -= this.speed;
        this.srcX = 35; // Facing north
    } else if (this.isDownKey) {
        newDrawY += this.speed;
        this.srcX = 0; // Facing south
    } else if (this.isRightKey) {
        newDrawX += this.speed;
        this.srcX = 105; // Facing east
    } else if (this.isLeftKey) {
        newDrawX -= this.speed;
        this.srcX = 70; // Facing west
    }

    obstacleCollision = this.checkObstacleCollide(newDrawX, newDrawY);

    if (!obstacleCollision && !outOfBounds(this, newDrawX, newDrawY)) {
        this.drawX = newDrawX;
        this.drawY = newDrawY;
    }
};

// Check collision with obstacles
Player.prototype.checkObstacleCollide = function (newDrawX, newDrawY) {
    var obstacleCounter = 0,
        newCenterX = newDrawX + (this.width / 2),
        newCenterY = newDrawY + (this.height / 2);
    for (var i = 0; i < obstacles.length; i++) {
        if (obstacles[i].leftX < newCenterX && newCenterX < obstacles[i].rightX && obstacles[i].topY - 20 < newCenterY && newCenterY < obstacles[i].bottomY - 20) {
            obstacleCounter = 0;
        } else {
            obstacleCounter++;
        }
    }

    if (obstacleCounter === obstacles.length) {
        return false;
    } else {
        return true;
    }
};

// Handle shooting mechanics
Player.prototype.checkShooting = function() {
    if (this.isSpacebar && !this.isShooting) {
        this.isShooting = true;
        this.bullets[this.currentBullet].fire(this.centerX, this.centerY);
        this.currentBullet++;
        if (this.currentBullet >= this.bullets.length) {
            this.currentBullet = 0;
        }
    } else if (!this.isSpacebar) {
        this.isShooting = false;
    }
};

// Update all bullets
Player.prototype.updateAllBullets = function() {
    for (var i = 0; i < this.bullets.length; i++) {
        if (this.bullets[i].isFlying) {
            this.bullets[i].update();
        }
    }
};


// Draw all bullets
Player.prototype.drawAllBullets = function() {
    for (var i = 0; i < this.bullets.length; i++) {
        if (this.bullets[i].isFlying) {
            this.bullets[i].draw();
        }
    }
};

// Bullet object constructor
function Bullet() {
    this.radius = 2;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.drawX = 0;
    this.drawY = 0;
    this.isFlying = false;
    this.xVel = 0;
    this.yVel = 0;
    this.speed = 6;
}

// Update bullet state
Bullet.prototype.update = function() {
    this.drawX += this.xVel;
    this.drawY += this.yVel;
    this.checkHitEnemy();
    this.checkHitObstacle();
    this.checkOutOfBounds();
};

// Draw bullet
Bullet.prototype.draw = function() {
    ctxEntities.fillStyle = "yellow";
    ctxEntities.beginPath();
    ctxEntities.arc(this.drawX, this.drawY, this.radius, 0, Math.PI * 2, false);
    ctxEntities.closePath();
    ctxEntities.fill();
};

// Fire a bullet
Bullet.prototype.fire = function(startX, startY) {
    var soundEffect = new Audio("audio/shooting.wav");
    soundEffect.play();
    this.drawX = startX;
    this.drawY = startY;
    if (player1.srcX === 0) { // Facing south
        this.xVel = 0;
        this.yVel = this.speed;
    } else if (player1.srcX === 35) { // Facing north
        this.xVel = 0;
        this.yVel = -this.speed;
    } else if (player1.srcX === 70) { // Facing west
        this.xVel = -this.speed;
        this.yVel = 0;
    } else if (player1.srcX === 105) { // Facing east
        this.xVel = this.speed;
        this.yVel = 0;
    }
    this.isFlying = true;
};

Bullet.prototype.recycle = function() {
    this.isFlying = false;
};

Bullet.prototype.checkHitEnemy = function() {
    for (var i = 0; i < enemies.length; i++) {
        if (collision(this, enemies[i]) && !enemies[i].isDead) {
            this.recycle();
            enemies[i].die();
        }
    }
};

Bullet.prototype.checkHitObstacle = function() {
    for (var i = 0; i < obstacles.length; i++) {
        if (collision(this, obstacles[i])) {
            this.recycle();
        }
    }
};

Bullet.prototype.checkOutOfBounds = function() {
    if (outOfBounds(this, this.drawX, this.drawY)) {
        this.recycle();
    }
};

function Obstacle(x, y, w, h) {
    this.drawX = x;
    this.drawY = y;
    this.width = w;
    this.height = h;
    this.leftX = this.drawX;
    this.rightX = this.drawX + this.width;
    this.topY = this.drawY;
    this.bottomY = this.drawY + this.height;
}

// Define obstacles on the canvas
function defineObstacles() {
    var treeWidth = 65,
        treeHeight = 90,
        rockDimensions = 30,
        bushHeight = 28;

    obstacles = [
        new Obstacle(78, 360, treeWidth, treeHeight),
        new Obstacle(390, 395, treeWidth, treeHeight),
        new Obstacle(415, 102, treeWidth, treeHeight),
        new Obstacle(619, 184, treeWidth, treeHeight),
        new Obstacle(97, 63, rockDimensions, rockDimensions),
        new Obstacle(296, 379, rockDimensions, rockDimensions),
        new Obstacle(295, 25, 150, bushHeight),
        new Obstacle(570, 138, 150, bushHeight),
        new Obstacle(605, 492, 90, bushHeight)
    ];
}

function Enemy() {
    this.srcX = 140;
    this.srcY = 600;
    this.width = 45;
    this.height = 54;
    this.drawX = randomRange(0, canvasWidth - this.width);
    this.drawY = randomRange(0, canvasHeight - this.height);
    this.centerX = this.drawX + (this.width / 2);
    this.centerY = this.drawY + (this.height / 2);
    this.targetX = this.centerX;
    this.targetY = this.centerY;
    this.randomMoveTime = randomRange(4000, 10000);
    this.speed = 1;
    var that = this;
    this.moveInterval = setInterval(function() {that.setTargetLocation();}, that.randomMoveTime);
    this.isDead = false;
}

Enemy.prototype.update = function() {
    this.centerX = this.drawX + (this.width / 2);
    this.centerY = this.drawY + (this.height / 2);
    this.checkDirection();
};

Enemy.prototype.draw = function() {
    ctxEntities.drawImage(imgSprite, this.srcX, this.srcY, this.width, this.height, this.drawX, this.drawY, this.width, this.height);
};

Enemy.prototype.setTargetLocation = function() {
    this.randomMoveTime = randomRange(4000, 10000);
    var minX = this.centerX - 50,
        maxX = this.centerX + 50,
        minY = this.centerY - 50,
        maxY = this.centerY + 50;
    if (minX < 0) {
        minX = 0;
    }
    if (maxX > canvasWidth) {
        maxX = canvasWidth;
    }
    if (minY < 0) {
        minY = 0;
    }
    if (maxY > canvasHeight) {
        maxY = canvasHeight;
    }
    this.targetX = randomRange(minX, maxX);
    this.targetY = randomRange(minY, maxY);
};

Enemy.prototype.checkDirection = function() {
    if (this.centerX < this.targetX) {
        this.drawX += this.speed;
    } else if (this.centerX > this.targetX) {
        this.drawX -= this.speed;
    }
    if (this.centerY < this.targetY) {
        this.drawY += this.speed;
    } else if (this.centerY > this.targetY) {
        this.drawY -= this.speed;
    }
};

Enemy.prototype.die = function() {
    var soundEffect = new Audio("audio/dying.wav");
    soundEffect.play();
    clearInterval(this.moveInterval);
    this.srcX = 185;
    this.isDead = true;

      // Check if all enemies are dead
      var aliveEnemies = enemies.filter(function(enemy) {
        return !enemy.isDead;
    });

    if (aliveEnemies.length === 0) {
        gameOver();
    }
};

// Initialize enemies with level adjustments
function initEnemies() {
    enemies = []; // Clear existing enemies
    numEnemies = currentLevel * 5; // Increase the number of enemies per level
    for (var i = 0; i < numEnemies; i++) {
        enemies.push(new Enemy());
    }
}

// Transition to the next level
function nextLevel() {
    if (currentLevel < maxLevels) {
        currentLevel++;
        restartGame(); // Restart game with new level settings
    } else {
        gameOver(); // If there are no more levels, show game over
    }
}


// Update all enemies
function updateAllEnemies() {
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].update();
    }
}

// Draw all enemies
function drawAllEnemies() {
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].draw();
    }
}

function checkKey(e, value) {
    var keyID = e.keyCode || e.which;
    if (keyID === 38) { // Up arrow
        player1.isUpKey = value;
        e.preventDefault();
    }
    if (keyID === 39) { // Right arrow
        player1.isRightKey = value;
        e.preventDefault();
    }
    if (keyID === 40) { // Down arrow
        player1.isDownKey = value;
        e.preventDefault();
    }
    if (keyID === 37) { // Left arrow
        player1.isLeftKey = value;
        e.preventDefault();
    }
    if (keyID === 32) { // Spacebar
        player1.isSpacebar = value;
        e.preventDefault();
    }
}

// Check if an object is out of bounds
function outOfBounds(a, x, y) {
    var newBottomY = y + a.height,
        newTopY = y,
        newRightX = x + a.width,
        newLeftX = x,
        treeLineTop = 5,
        treeLineBottom = 570,
        treeLineRight = 750,
        treeLineLeft = 65;
    return newBottomY > treeLineBottom ||
        newTopY < treeLineTop ||
        newRightX > treeLineRight ||
        newLeftX < treeLineLeft;
}

function collision(a, b) {
    return a.drawX < b.drawX + b.width &&
           a.drawX + a.width > b.drawX &&
           a.drawY < b.drawY + b.height &&
           a.drawY + a.height > b.drawY;
}



let currentLevel = 1; // Define globally
const totalLevels = 3; // Total number of levels

document.addEventListener('DOMContentLoaded', () => {
    const levelInfo = document.getElementById('level-info');
    const startGameButton = document.getElementById('startGameButton');
    const completeLevelButton = document.getElementById('complete-level');
    const completeLevelMessage = document.getElementById('completeLevel');

    function updateLevelDisplay() {
        if (levelInfo) {
            levelInfo.textContent = `You are on level ${currentLevel}`;
            levelInfo.style.display = 'block';
            setTimeout(() => levelInfo.style.display = 'none', 3000); // Hide after 6 seconds
        } else {
            console.error('Element with ID "level-info" not found.');
        }
    }

    function completeLevel() {
        if (completeLevelMessage) {
            completeLevelMessage.style.display = 'block'; // Show level completion message

            setTimeout(() => {
                completeLevelMessage.style.display = 'none'; // Hide level completion message

                // Increment the level
                if (currentLevel < totalLevels) {
                    currentLevel++;
                    updateLevelDisplay(); // Update level display with the new level
                    nextLevel(); // Move to the next level
                } else {
                    gameOver(); // Handle game completion
                }
            }, 6000); // Adjust the timeout as needed
        } else {
            console.error('Element with ID "completeLevel" not found.');
        }
    }

    function startGame() {
        if (startGameButton) {
            updateLevelDisplay(); // Initialize level info display
            startGameButton.style.display = 'none'; // Hide the start game button
        } else {
            console.error('Element with ID "startGameButton" not found.');
        }
    }

    function nextLevel() {
        // Placeholder for advancing to the next level logic
        console.log('Advancing to the next level');
    }

    function gameOver() {
        // Placeholder for game over logic
        console.log('Game Over');
    }

    // Initialize event listeners
    if (startGameButton) {
        startGameButton.addEventListener('click', startGame);
    } else {
        console.error('Element with ID "startGameButton" not found.');
    }

    if (completeLevelButton) {
        completeLevelButton.addEventListener('click', completeLevel);
    } else {
        console.error('Element with ID "complete-level" not found.');
    }
});





