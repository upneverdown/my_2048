// 游戏状态变量
let grid = [];
let score = 0;
let bestScore = 0;
let isGameRunning = true;
let hasWon = false; 
let previousState = null;
let moveCount = 0; // 记录移动次数，用于切换文案

// 《小王子》经典语录
const quotes = [
    "| 真正重要的东西，用眼睛是看不见的 |",
    "| 所有的大人都曾经是小孩，虽然，只有少数的人记得 |",
    "| 星星发亮是为了让每一个人有一天都能找到属于自己的星星 |",
    "| 你在你的玫瑰花身上耗费的时间，使得你的玫瑰花变得如此重要 |",
    "| 使沙漠显得美丽的，是它在什么地方藏着一口水井 |",
    "| 只有用心才能看得清，实质性的东西，用眼睛是看不见的 |",
    "| 如果你爱上了某个星球的一朵花，那么只要仰望星空，就会觉得漫天的繁星就像一朵朵盛开的花 |"
];

// 文艺歌词/名言 (陈绮贞风格)
const lyrics = [
    "漫步在荒原，我想找一棵栖身的树",
    "我坐在角落，看着时间流过",
    "让该来的来，让该去的去",
    "我们赖以生存的，那些微不足道的瞬间",
    "穿过遥远的时光，只为与你相遇",
    "你离开我，就是旅行的意义"
];

// 常量配置
const GRID_SIZE = 4;
const CELL_SIZE = 100;
const GAP = 15;

// DOM 元素
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const tileContainer = document.getElementById('tile-container');
const gameMessageEl = document.getElementById('game-message');
const messageTitle = document.getElementById('message-title');
const messageScore = document.getElementById('message-score');
const keepPlayingBtn = document.getElementById('keep-playing-btn');
const gridContainer = document.getElementById('grid-container');
const quoteEl = document.getElementById('quote-text');
const lyricEl = document.getElementById('lyric-text');

const restartBtn = document.getElementById('restart-btn');
const tryAgainBtn = document.getElementById('try-again-btn');
const undoBtn = document.getElementById('undo-btn');

// 初始化游戏
function init() {
    grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    score = 0;
    hasWon = false;
    previousState = null;
    isGameRunning = true;
    moveCount = 0;
    
    bestScore = parseInt(localStorage.getItem('bestScore2048')) || 0;
    
    gameMessageEl.style.display = 'none';
    gameMessageEl.classList.remove('win');
    
    updateQuotes(); // 初始化文案
    
    addRandomTile();
    addRandomTile();
    
    updateScore();
    render();
}

// 更新文案 (带淡入淡出效果)
function updateQuotes() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const randomLyric = lyrics[Math.floor(Math.random() * lyrics.length)];
    
    quoteEl.style.opacity = 0;
    lyricEl.style.opacity = 0;
    
    setTimeout(() => {
        quoteEl.textContent = randomQuote;
        lyricEl.textContent = randomLyric;
        quoteEl.style.opacity = 1;
        lyricEl.style.opacity = 1;
    }, 300);
}

function addRandomTile() {
    let emptyCells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === 0) emptyCells.push({ r, c });
        }
    }
    if (emptyCells.length > 0) {
        let randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    }
}

function slideAndMerge(row) {
    let filtered = row.filter(val => val !== 0);
    let merged = [];
    let scoreGain = 0;
    
    for (let i = 0; i < filtered.length; i++) {
        if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
            let newVal = filtered[i] * 2;
            merged.push(newVal);
            scoreGain += newVal;
            i++; 
        } else {
            merged.push(filtered[i]);
        }
    }
    
    while (merged.length < GRID_SIZE) merged.push(0);
    return { newRow: merged, scoreGain };
}

function transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

function move(direction) {
    if (!isGameRunning) return;

    let oldGrid = grid.map(row => [...row]);
    let totalScoreGain = 0;

    if (direction === 'left') {
        for (let i = 0; i < GRID_SIZE; i++) {
            let res = slideAndMerge(grid[i]);
            grid[i] = res.newRow;
            totalScoreGain += res.scoreGain;
        }
    } else if (direction === 'right') {
        for (let i = 0; i < GRID_SIZE; i++) {
            let res = slideAndMerge([...grid[i]].reverse());
            grid[i] = res.newRow.reverse();
            totalScoreGain += res.scoreGain;
        }
    } else if (direction === 'up') {
        let transposed = transpose(grid);
        for (let i = 0; i < GRID_SIZE; i++) {
            let res = slideAndMerge(transposed[i]);
            transposed[i] = res.newRow;
            totalScoreGain += res.scoreGain;
        }
        grid = transpose(transposed);
    } else if (direction === 'down') {
        let transposed = transpose(grid);
        for (let i = 0; i < GRID_SIZE; i++) {
            let res = slideAndMerge([...transposed[i]].reverse());
            transposed[i] = res.newRow.reverse();
            totalScoreGain += res.scoreGain;
        }
        grid = transpose(transposed);
    }

    let hasMoved = false;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (oldGrid[r][c] !== grid[r][c]) {
                hasMoved = true;
                break;
            }
        }
        if (hasMoved) break;
    }

    if (hasMoved) {
        previousState = { grid: oldGrid, score: score };

        score += totalScoreGain;
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('bestScore2048', bestScore);
        }
        
        moveCount++;
        
        addRandomTile();
        updateScore();
        render();
        
        // 每移动 3 步切换一次文案
        if (moveCount % 3 === 0) {
            updateQuotes();
        }
        
        if (!hasWon && checkWin()) {
            hasWon = true;
            showMessage('you win', score, true);
            return; 
        }

        if (isGameOver()) {
            showMessage('game over', score, false);
        }
    }
}

function checkWin() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === 2048) return true;
        }
    }
    return false;
}

function isGameOver() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === 0) return false;
            if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
            if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
        }
    }
    return true;
}

function undo() {
    if (previousState) {
        grid = previousState.grid.map(row => [...row]);
        score = previousState.score;
        previousState = null; 
        
        updateScore();
        render();
        
        gameMessageEl.style.display = 'none';
        isGameRunning = true;
    }
}

function showMessage(title, finalScore, isWin) {
    messageTitle.textContent = title;
    messageScore.textContent = `score: ${finalScore}`;
    keepPlayingBtn.style.display = isWin ? 'inline-block' : 'none';
    
    if (isWin) {
        gameMessageEl.classList.add('win');
    } else {
        gameMessageEl.classList.remove('win');
    }
    
    isGameRunning = false;
    gameMessageEl.style.display = 'flex';
}

function render() {
    tileContainer.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            let val = grid[r][c];
            if (val !== 0) {
                let tile = document.createElement('div');
                let tileClass = val <= 2048 ? `tile-${val}` : 'tile-super';
                tile.className = `tile ${tileClass}`;
                tile.textContent = val;
                
                tile.style.left = `${c * (CELL_SIZE + GAP)}px`;
                tile.style.top = `${r * (CELL_SIZE + GAP)}px`;
                
                tileContainer.appendChild(tile);
            }
        }
    }
}

function updateScore() {
    scoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;
}

// 事件监听
document.addEventListener('keydown', (e) => {
    if (e.key === 'z' || e.key === 'Z') {
        undo();
        return;
    }

    if (!isGameRunning) return;
    
    switch (e.key) {
        case 'ArrowLeft': move('left'); e.preventDefault(); break;
        case 'ArrowRight': move('right'); e.preventDefault(); break;
        case 'ArrowUp': move('up'); e.preventDefault(); break;
        case 'ArrowDown': move('down'); e.preventDefault(); break;
    }
});

let touchStartX = 0;
let touchStartY = 0;

gridContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

gridContainer.addEventListener('touchmove', (e) => {
    e.preventDefault(); 
}, { passive: false });

gridContainer.addEventListener('touchend', (e) => {
    if (!isGameRunning) return;
    
    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;
    
    let deltaX = touchEndX - touchStartX;
    let deltaY = touchEndY - touchStartY;
    
    let minSwipeDistance = 30; 
    
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        return;
    }
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) move('right');
        else move('left');
    } else {
        if (deltaY > 0) move('down');
        else move('up');
    }
});

restartBtn.addEventListener('click', init);
tryAgainBtn.addEventListener('click', init);
undoBtn.addEventListener('click', undo);

keepPlayingBtn.addEventListener('click', () => {
    gameMessageEl.style.display = 'none';
    isGameRunning = true;
});

init();