let canvas;
let ctx;

// Spill-variabler
let gameWidth;
let gameHeight;

// Racket
const racketWidth = 10;
const racketHeight = 80;
const racketSpeed = 6;

let player1Name = 'Spiller 1';
let player2Name = 'Spiller 2';

const player1 = {
    x: 20,
    y: 0,
    width: racketWidth,
    height: racketHeight,
    score: 0,
    isServing: false
};

const player2 = {
    x: 0,
    y: 0,
    width: racketWidth,
    height: racketHeight,
    score: 0,
    isServing: false
};

// Ball
const ball = {
    x: 400,
    y: 200,
    radius: 6,
    speedX: 0,
    speedY: 0,
    maxSpeed: 7
};

// Inngang-kontroll
const keys = {};
const mouse = { x: 400, y: 200 };
const touch = { active: false, y: 200 };

// ============== INITIALIZATION ==============

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    gameWidth = canvas.width;
    gameHeight = canvas.height;
    
    player1.y = gameHeight / 2 - racketHeight / 2;
    player1.x = 20;
    
    player2.y = gameHeight / 2 - racketHeight / 2;
    player2.x = gameWidth - 30;
    
    ball.x = gameWidth / 2;
    ball.y = gameHeight / 2;
    
    // Start game loop
    gameLoop();
}

// ============== SCREEN MANAGEMENT ==============

function startGame() {
    player1Name = document.getElementById('player1Name').value.trim() || 'Spiller 1';
    player2Name = document.getElementById('player2Name').value.trim() || 'Spiller 2';

    // Oppdater navn på skjermen
    document.getElementById('player1NameDisplay').textContent = player1Name;
    document.getElementById('player2NameDisplay').textContent = player2Name;

    // Bytt til game screen
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('historyScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';

    // Reset spillet
    player1.score = 0;
    player2.score = 0;
    document.getElementById('score1').textContent = '0';
    document.getElementById('score2').textContent = '0';
    document.getElementById('winner').innerHTML = '';
    resetBall(1);
}

function showHistory() {
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('historyScreen').style.display = 'flex';

    displayHistory();
}

function backToSetup() {
    document.getElementById('setupScreen').style.display = 'flex';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('historyScreen').style.display = 'none';
}

function gameOver() {
    setTimeout(() => {
        const winner = player1.score === 10 ? player1Name : player2Name;
        const loser = player1.score === 10 ? player2Name : player1Name;
        const score = `${Math.max(player1.score, player2.score)}-${Math.min(player1.score, player2.score)}`;

        // Lagre i historikk
        saveMatchToHistory(winner, loser, score);

        // Vis dialog eller gå tilbake
        setTimeout(() => {
            backToSetup();
        }, 2000);
    }, 3000);
}

// ============== HISTORIKK ==============

function saveMatchToHistory(winner, loser, score) {
    let history = JSON.parse(localStorage.getItem('pongHistory')) || [];
    
    const match = {
        winner: winner,
        loser: loser,
        score: score,
        timestamp: new Date().toLocaleString('no-NO')
    };

    history.unshift(match); // Legg til øverst
    localStorage.setItem('pongHistory', JSON.stringify(history));
}

function displayHistory() {
    const history = JSON.parse(localStorage.getItem('pongHistory')) || [];
    const container = document.getElementById('historyContainer');

    if (history.length === 0) {
        container.innerHTML = '<div class="empty-history">Ingen kamper registrert ennå</div>';
        return;
    }

    let html = '';
    history.forEach((match, index) => {
        html += `
            <div class="history-item">
                <span class="winner-name">🏆 ${match.winner}</span> vant over ${match.loser}
                <div class="score">Resultat: ${match.score}</div>
                <div class="time">${match.timestamp}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function clearHistory() {
    if (confirm('Er du sikker på at du vil slette all kamphistorikk?')) {
        localStorage.removeItem('pongHistory');
        displayHistory();
    }
}

// ============== KEYBOARD / MOUSE EVENTS ==============

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Spiller 2 serve med venstrepil
    if (e.key === 'ArrowLeft' && player2.isServing) {
        serveBall(player2);
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.addEventListener('mousemove', (e) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouse.y = e.clientY - rect.top;
    mouse.x = e.clientX - rect.left;
});

document.addEventListener('click', (e) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    if (clickX >= 0 && clickX < gameWidth && clickY >= 0 && clickY < gameHeight) {
        if (player1.isServing) {
            serveBall(player1);
        }
    }
});

// ============== TOUCH EVENTS ==============

document.addEventListener('touchstart', (e) => {
    if (!canvas) return;
    e.preventDefault();
    const touch_obj = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch_obj.clientX - rect.left;
    const touchY = touch_obj.clientY - rect.top;
    
    if (touchX < 0 || touchX > gameWidth || touchY < 0 || touchY > gameHeight) return;
    
    touch.active = true;
    touch.y = touchY;
    touch.x = touchX;
    
    // Sjekk hvilken side av skjermen som er berørt
    if (touchX < gameWidth / 2) {
        // Venstre side - Spiller 1
        if (player1.isServing) {
            serveBall(player1);
        }
    } else {
        // Høyre side - Spiller 2
        if (player2.isServing) {
            serveBall(player2);
        }
    }
}, false);

document.addEventListener('touchmove', (e) => {
    if (!canvas) return;
    e.preventDefault();
    const touch_obj = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch_obj.clientX - rect.left;
    const touchY = touch_obj.clientY - rect.top;
    
    if (touchX < 0 || touchX > gameWidth || touchY < 0 || touchY > gameHeight) return;
    
    touch.active = true;
    touch.y = touchY;
    touch.x = touchX;
}, false);

document.addEventListener('touchend', (e) => {
    e.preventDefault();
    touch.active = false;
}, false);

// ============== SERVE & RESET ==============

function serveBall(player) {
    const angle = (Math.random() - 0.5) * Math.PI / 4; // -22.5 til 22.5 grader
    ball.speedX = (player === player1 ? 1 : -1) * ball.maxSpeed * Math.cos(angle);
    ball.speedY = ball.maxSpeed * Math.sin(angle);
    player.isServing = false;
}

function resetBall(winner) {
    ball.x = gameWidth / 2;
    ball.y = gameHeight / 2;
    ball.speedX = 0;
    ball.speedY = 0;
    
    if (winner === 1) {
        player1.isServing = true;
    } else {
        player2.isServing = true;
    }
}

// ============== UPDATE LOGIC ==============

function updatePlayerPositions() {
    // Spiller 1 - mus eller touch kontroll (venstre side)
    let player1Target = player1.y;
    
    if (touch.active && touch.x < gameWidth / 2) {
        // Touch på venstre side
        player1Target = Math.max(0, Math.min(touch.y - racketHeight / 2, gameHeight - racketHeight));
    } else if (!touch.active) {
        // Mus kontroll
        if (mouse.y - racketHeight / 2 < gameHeight - racketHeight) {
            player1Target = Math.max(0, Math.min(mouse.y - racketHeight / 2, gameHeight - racketHeight));
        }
    }
    player1.y = player1Target;

    // Spiller 2 - piltaster eller touch kontroll (høyre side)
    if (touch.active && touch.x >= gameWidth / 2) {
        // Touch på høyre side
        player2.y = Math.max(0, Math.min(touch.y - racketHeight / 2, gameHeight - racketHeight));
    } else {
        // Piltast kontroll
        if (keys['ArrowUp']) {
            player2.y = Math.max(0, player2.y - racketSpeed);
        }
        if (keys['ArrowDown']) {
            player2.y = Math.min(gameHeight - racketHeight, player2.y + racketSpeed);
        }
    }
}

function updateBall() {
    if (ball.speedX === 0 && ball.speedY === 0) return; // Ball ikke i spill

    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Spretting på topp og bunn
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.speedY = -ball.speedY;
    }
    if (ball.y + ball.radius > gameHeight) {
        ball.y = gameHeight - ball.radius;
        ball.speedY = -ball.speedY;
    }

    // Kollisjoner med racketer
    checkRacketCollision(player1);
    checkRacketCollision(player2);

    // Scoring
    if (ball.x - ball.radius < 0) {
        // Spiller 2 scorer
        player2.score++;
        resetBall(1);
        checkWinner();
    }
    if (ball.x + ball.radius > gameWidth) {
        // Spiller 1 scorer
        player1.score++;
        resetBall(2);
        checkWinner();
    }
}

function checkRacketCollision(racket) {
    if (
        ball.x - ball.radius < racket.x + racket.width &&
        ball.x + ball.radius > racket.x &&
        ball.y - ball.radius < racket.y + racket.height &&
        ball.y + ball.radius > racket.y
    ) {
        // Kollisjonsdeteksjon
        const racketCenterY = racket.y + racket.height / 2;
        const hitPos = (ball.y - racketCenterY) / (racket.height / 2);
        
        // Sprette ballen
        ball.speedX = -ball.speedX * 1.05; // Litt raskere hver gang
        ball.speedY = hitPos * ball.maxSpeed * 0.75;

        // Sikre at ballen ikke blir stukket i racketen
        if (racket === player1) {
            ball.x = racket.x + racket.width + ball.radius;
        } else {
            ball.x = racket.x - ball.radius;
        }

        // Grense hastigheten
        const speed = Math.sqrt(ball.speedX ** 2 + ball.speedY ** 2);
        if (speed > ball.maxSpeed * 1.1) {
            ball.speedX = (ball.speedX / speed) * (ball.maxSpeed * 1.1);
            ball.speedY = (ball.speedY / speed) * (ball.maxSpeed * 1.1);
        }
    }
}

function checkWinner() {
    document.getElementById('score1').textContent = player1.score;
    document.getElementById('score2').textContent = player2.score;

    if (player1.score === 10) {
        document.getElementById('winner').innerHTML = '<div class="winner">🎉 ' + player1Name + ' vinner! 🎉</div>';
        gameOver();
    } else if (player2.score === 10) {
        document.getElementById('winner').innerHTML = '<div class="winner">🎉 ' + player2Name + ' vinner! 🎉</div>';
        gameOver();
    }
}

// ============== DRAWING ==============

function draw() {
    if (!ctx) return;
    
    // Tegn bakgrunn
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    // Tegn midterlinje
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gameWidth / 2, 0);
    ctx.lineTo(gameWidth / 2, gameHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tegn racketer
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);

    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

    // Tegn ball
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Tegn serve-indikator
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    if (player1.isServing) {
        ctx.fillText('Klikk/berør for å serve', player1.x + 30, player1.y - 10);
    }
    if (player2.isServing) {
        ctx.fillText('← / Berør for å serve', player2.x - 120, player2.y - 10);
    }

    // Tegn touch-områder hint på mobil
    if (touch.active) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, gameWidth / 2, gameHeight);
        ctx.strokeRect(gameWidth / 2, 0, gameWidth / 2, gameHeight);
    }
}

function gameLoop() {
    updatePlayerPositions();
    updateBall();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initGame);