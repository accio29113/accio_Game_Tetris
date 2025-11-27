// スマホのダブルタップや連打で画面が動くのを防ぐ
document.addEventListener("touchmove", function (e) {
  e.preventDefault();
}, { passive: false });

// ===== 基本設定 =====
const COLS = 10;
const ROWS = 20;

const boardElem = document.getElementById("board");
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const leftBtn = document.getElementById("left");
const rightBtn = document.getElementById("right");
const downBtn = document.getElementById("down");

// 盤面データ（0: 空, 1: ブロックあり）
let board = [];
// 今落ちているブロック
let current = null;
// ゲームの状態
let intervalId = null;
let gameRunning = false;

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
  current = null; // 新しくスタートしたら現在のブロックはリセット
}

// ===== 描画 =====
function draw() {
  boardElem.innerHTML = "";

  // 盤面 + 現在のブロックを合成した状態で描画する用のコピー
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

  // DOMとして描画
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

        // 盤面外
        if (bx < 0 || bx >= COLS || by >= ROWS) {
          return true;
        }
        // すでに埋まっているマス
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
  let cleared = 0;

  for (let y = 0; y < ROWS; y++) {
    if (board[y].every(cell => cell === 1)) {
      cleared++;
    } else {
      newBoard.push(board[y]);
    }
  }

  // 消した行数だけ上から空行を追加
  while (newBoard.length < ROWS) {
    const empty = new Array(COLS).fill(0);
    newBoard.unshift(empty);
  }

  board = newBoard;
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

  // いきなり詰んでたらゲームオーバー
  if (collide(current.x, current.y)) {
    alert("ゲームオーバー！");
    stopGame();
    initBoard();
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
    // ぶつかったので固定
    merge();
    clearLines();
    newPiece();
  }
  draw();
}

// ===== スタート（再開） =====
function startGame() {
  if (gameRunning) return;

  // まだブロックがないときは作る
  if (!current) {
    newPiece();
  }

  intervalId = setInterval(drop, 600); // 0.6秒ごとに1マス落下
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
    return; // 二重描画防止
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

// ===== 最初の準備 =====
initBoard();
draw();

// ボタンにイベントをつなぐ
startBtn.addEventListener("click", startGame);
stopBtn.addEventListener("click", stopGame);

