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
let score = 0; // スコア

// ===== スコア表示更新 =====
function updateScore() {
  if (scoreElem) {
    scoreElem.textContent = `スコア：${score}`;
  }
}

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
