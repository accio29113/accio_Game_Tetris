// ===== iPhone向け ズーム・スクロール完全対策 =====

// ダブルタップズーム（iOS Safari）対策
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  function (e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      // 300ms以内に2回タップ → ズームさせない
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false }
);

// ピンチズーム（2本指）対策
document.addEventListener(
  "gesturestart",
  function (e) {
    e.preventDefault();
  },
  { passive: false }
);

// スクロールで画面が動くのを防ぐ
document.addEventListener(
  "touchmove",
  function (e) {
    e.preventDefault();
  },
  { passive: false }
);

// ===== 基本設定 =====
const COLS = 10;
const ROWS = 20;

const boardElem = document.getElementById("board");
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const leftBtn = document.getElementById("left");
const rightBtn = document.getElementById("right");
const downBtn = document.getElementById("down");
const rotateBtn = document.getElementById("rotate");
const scoreElem = document.getElementById("score");


// 盤面データ（0: 空, 1: ブロックあり）
let board = [];
// 今落ちているブロック
let current = null;
// ゲームの状態
let intervalId = null;
let gameRunning = false;
let score = 0;   // ★ スコア

// ===== ブロックの形たち（テトリミノ） =====
// 1: ブロックあり, 0: 何もない
const TETROMINOS = [
  // I
  [
    [1, 1, 1, 1]
  ],
  // O
  [
    [1, 1],
    [1, 1]
  ],
  // T
  [
    [0, 1, 0],
    [1, 1, 1]
  ],
  // L
  [
    [1, 0, 0],
    [1, 1, 1]
  ],
  // J
  [
    [0, 0, 1],
    [1, 1, 1]
  ],
  // S
  [
    [0, 1, 1],
    [1, 1, 0]
  ],
  // Z
  [
    [1, 1, 0],
    [0, 1, 1]
  ]
];

// ===== スコア表示更新 =====
function updateScore() {
  if (scoreElem) {
    scoreElem.textContent = `スコア：${score}`;
  }
}


// ===== ランダムに新しいブロックを作る =====
function createPiece() {
  const shape = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
  const startX = Math.floor(COLS / 2 - shape[0].length / 2);
  return {
    x: startX,
    y: 0,
    shape: shape
  };
}

// ===== 盤面初期化 =====
function initBoard() {
  board = [];
  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
      row.push(0);
    }
    board.push(row);
  }
  current = null;
}

// ===== 描画 =====
function draw() {
  boardElem.innerHTML = "";

  const temp = board.map(row => [...row]);

  if (current) {
    for (let y = 0; y < current.shape.length; y++) {
      for (let x = 0; x < current.shape[y].length; x++) {
        if (current.shape[y][x]) {
          const bx = current.x + x;
          const by = current.y + y;
          if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
            temp[by][bx] = 1;
          }
        }
      }
    }
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (temp[y][x] === 1) {
        cell.classList.add("filled");
      }
      boardElem.appendChild(cell);
    }
  }
}

// ===== 衝突判定 =====
function collide(nx, ny) {
  if (!current) return false;

  for (let y = 0; y < current.shape.length; y++) {
    for (let x = 0; x < current.shape[y].length; x++) {
      if (current.shape[y][x]) {
        const bx = nx + x;
        const by = ny + y;

        if (bx < 0 || bx >= COLS || by >= ROWS) {
          return true;
        }
        if (by >= 0 && board[by][bx] === 1) {
          return true;
        }
      }
    }
  }
  return false;
}

// ===== ブロック固定 =====
function merge() {
  if (!current) return;

  for (let y = 0; y < current.shape.length; y++) {
    for (let x = 0; x < current.shape[y].length; x++) {
      if (current.shape[y][x]) {
        const bx = current.x + x;
        const by = current.y + y;
        if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
          board[by][bx] = 1;
        }
      }
    }
  }
}

// ===== ライン消し =====
function clearLines() {
  let newBoard = [];
  let cleared = 0;  // ★ 何行消したか

  for (let y = 0; y < ROWS; y++) {
    if (board[y].every(cell => cell === 1)) {
      // そろった行は捨てる（つまり消える）
      cleared++;
    } else {
      newBoard.push(board[y]);
    }
  }

  while (newBoard.length < ROWS) {
    const empty = new Array(COLS).fill(0);
    newBoard.unshift(empty);
  }

  board = newBoard;

  // ★ スコア加算（1行100点 × 行数）
  if (cleared > 0) {
    score += cleared * 100;
    updateScore();
  }
}

// ===== ブロック回転 =====
function rotatePiece() {
  if (!current) return;

  const oldShape = current.shape;
  const h = oldShape.length;
  const w = oldShape[0].length;

  // 時計回りに90度回転させた新しいshapeを作る
  const rotated = [];
  for (let x = 0; x < w; x++) {
    const row = [];
    for (let y = h - 1; y >= 0; y--) {
      row.push(oldShape[y][x]);
    }
    rotated.push(row);
  }

  // 一旦差し替えてみる
  current.shape = rotated;

  // もし衝突したら元に戻す
  if (collide(current.x, current.y)) {
    current.shape = oldShape;
  } else {
    draw();
  }
}



// ===== ストップ（ポーズ） =====
function stopGame() {
  if (!gameRunning) return;
  clearInterval(intervalId);
  intervalId = null;
  gameRunning = false;
}

// ===== 新しいブロックを投入 =====
function newPiece() {
  current = createPiece();

  if (collide(current.x, current.y)) {
    alert("ゲームオーバー！");
    stopGame();
    initBoard();
    score = 0;        // ★ スコアリセット
    updateScore();    // ★ 表示も更新
    draw();
  }
}

// ===== 落下処理 =====
function drop() {
  if (!current) {
    newPiece();
  }

  const ny = current.y + 1;
  if (!collide(current.x, ny)) {
    current.y = ny;
  } else {
    merge();
    clearLines();
    newPiece();
  }
  draw();
}

// ===== スタート（再開） =====
function startGame() {
  if (gameRunning) return;

  if (!current) {
    newPiece();
  }

  intervalId = setInterval(drop, 600);
  gameRunning = true;
}

// ===== キーボード操作 =====
document.addEventListener("keydown", (e) => {
  if (!gameRunning || !current) return;

  if (e.key === "ArrowLeft") {
    const nx = current.x - 1;
    if (!collide(nx, current.y)) {
      current.x = nx;
    }
  } else if (e.key === "ArrowRight") {
    const nx = current.x + 1;
    if (!collide(nx, current.y)) {
      current.x = nx;
    }
  } else if (e.key === "ArrowDown") {
    drop();
    return;
  }else if (e.key === "ArrowUp") {
    rotatePiece();
    return;
  }
  draw();
});

// ===== スマホ用ボタン操作 =====
leftBtn.addEventListener("click", () => {
  if (!gameRunning || !current) return;
  const nx = current.x - 1;
  if (!collide(nx, current.y)) {
    current.x = nx;
    draw();
  }
});

rightBtn.addEventListener("click", () => {
  if (!gameRunning || !current) return;
  const nx = current.x + 1;
  if (!collide(nx, current.y)) {
    current.x = nx;
    draw();
  }
});

downBtn.addEventListener("click", () => {
  if (!gameRunning || !current) return;
  drop();
});

rotateBtn.addEventListener("click", () => {
  if (!gameRunning || !current) return;
  rotatePiece();
});


// ===== 初期化 =====
initBoard();
draw();

startBtn.addEventListener("click", startGame);
stopBtn.addEventListener("click", stopGame);

