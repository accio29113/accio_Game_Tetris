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
const highScoreElem = document.getElementById("highscore");          // ★ 追加
const gameOverElem = document.getElementById("gameOver");
const resetBtn = document.getElementById("reset-btn");
const topResetBtn = document.getElementById("reset-top-btn");
const resetHighScoreBtn = document.getElementById("reset-highscore-btn"); // ★ 追加

// ===== SE（効果音） =====
const seStart = new Audio("sounds/start.mp3");
const seDrop = new Audio("sounds/drop.mp3");
const seClear = new Audio("sounds/clear.mp3");
const seRotate = new Audio("sounds/rotate.mp3");
const seGameOver = new Audio("sounds/gameover.mp3");

let gameOverPlayed = false;

startBtn.addEventListener("click", () => {
  playSE(seStart);   // ← ★最初の1回は必ずボタン内で鳴らす
  startGame();
});
function playSE(se) {
  se.currentTime = 0;
  se.play().catch(() => {});
}





// 盤面データ（0: 空, 1: ブロックあり）
let board = [];
// 今落ちているブロック
let current = null;
// ゲームの状態
let intervalId = null;
let gameRunning = false;
let score = 0; // スコア
let highScore = 0;   // ★ ハイスコア

// ===== ハイスコア読み込み =====
function loadHighScore() {
  const saved = localStorage.getItem("accioTetrisHighScore");
  if (saved !== null) {
    highScore = Number(saved) || 0;
  } else {
    highScore = 0;
  }

  if (highScoreElem) {
    highScoreElem.textContent = `ハイスコア：${highScore}`;
  }
}

// ===== スコア表示更新（ハイスコアも管理） =====
function updateScore() {
  if (scoreElem) {
    scoreElem.textContent = `スコア：${score}`;
  }

  // ハイスコア更新チェック
  if (score > highScore) {
    highScore = score;
    if (highScoreElem) {
      highScoreElem.textContent = `ハイスコア：${highScore}`;
    }
    localStorage.setItem("accioTetrisHighScore", String(highScore));
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
  // ★ ここが大事：盤面に固定したら current は消す
  current = null;
}
// ===== そろった行を探す =====
function findFullLines() {
  const fullLines = [];
  for (let y = 0; y < ROWS; y++) {
    if (board[y].every(cell => cell === 1)) {
      fullLines.push(y);
    }
  }
  return fullLines;
}
// ===== そろった行を光らせる（見た目演出） =====
function highlightLines(lines) {
  // まず通常描画
  draw();

  const cells = boardElem.children;
  lines.forEach((y) => {
    for (let x = 0; x < COLS; x++) {
      const index = y * COLS + x;
      if (cells[index]) {
        cells[index].classList.add("line-clear");
      }
    }
  });
}


// ===== 行を実際に消して、スコアも加算 =====
function clearLinesNow(lines) {
  if (!lines.length) return;

  const removeSet = new Set(lines);
  let newBoard = [];

  for (let y = 0; y < ROWS; y++) {
    if (!removeSet.has(y)) {
      newBoard.push(board[y]);
    }
  }

  const cleared = lines.length;

  // ★ ここ！ ライン消去音
  playSE(seClear);

  while (newBoard.length < ROWS) {
    newBoard.unshift(new Array(COLS).fill(0));
  }

  board = newBoard;

  score += cleared * 100;
  updateScore();
}

// ===== 重力なし（互換用ダミー関数） =====
function applyGravityAnimated(callback) {
  if (callback) callback();
}

// ===== ライン消し＋重力をアニメ付きでやる =====
function clearLinesAnimated(lines, afterAll) {
  if (!lines.length) {
    if (afterAll) afterAll();
    return;
  }

  // ① まず光らせる
  highlightLines(lines);

  // ② 少し待ってから本当に消す
  setTimeout(() => {
    clearLinesNow(lines);

    // ③ さらに重力アニメーション
    applyGravityAnimated(() => {
      if (afterAll) afterAll();
    });
  }, 400); // ← 光ってから消えるまでの時間（お好みで調整OK）
}
// ===== 連鎖処理：揃った行がある限り、消す→落とすを繰り返す =====
function handleLineClears(afterAll) {
  const lines = findFullLines();  // 今の盤面で揃っている行を探す

  if (lines.length === 0) {
    // もう消す行がない → 連鎖おわり
    if (afterAll) afterAll();
    return;
  }

  // ラインがある間は、
  // 光る → 消える → 重力アニメ → 終わったらもう一回チェック
  clearLinesAnimated(lines, () => {
    handleLineClears(afterAll);
  });
}



// ===== 縦方向の重力（ぷよぷよ風） =====
// 各列ごとに、ブロックを下にぎゅっと詰める
function applyGravity() {
  for (let x = 0; x < COLS; x++) {
    const stack = [];

    // 上から下まで見て、「ブロックのある行」だけを集める
    for (let y = 0; y < ROWS; y++) {
      if (board[y][x] === 1) {
        stack.push(1);
      }
    }

    // 下から順番にブロックを詰めていく
    for (let y = ROWS - 1; y >= 0; y--) {
      if (stack.length > 0) {
        board[y][x] = 1;
        stack.pop();
      } else {
        board[y][x] = 0;
      }
    }
  }
}


// ===== ブロック回転 =====
function rotatePiece() {
  if (!current) return;

  const oldShape = current.shape;
  const h = oldShape.length;
  const w = oldShape[0].length;

  const rotated = [];
  for (let x = 0; x < w; x++) {
    const row = [];
    for (let y = h - 1; y >= 0; y--) {
      row.push(oldShape[y][x]);
    }
    row.length && rotated.push(row);
  }

  current.shape = rotated;

  if (collide(current.x, current.y)) {
    current.shape = oldShape;
  } else {
    playSE(seRotate);
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
    stopGame();
    showGameOver();
  }
}

// GAME OVER表示
function showGameOver() {
  if (!gameOverPlayed) {
    playSE(seGameOver);   // ★ 最初の1回だけ
    gameOverPlayed = true;
  }
  gameOverElem.classList.remove("hidden");
}


// 共通リセット処理（途中でもゲームオーバー後でも使える）
function resetGame() {
  stopGame();                              // 途中でも一旦ゲーム止める
  gameOverElem.classList.add("hidden");    // GAME OVER 画面を隠す
  initBoard();                             // 盤面リセット
  score = 0;                               // スコアリセット
  updateScore();                           // スコア表示更新
  draw();                                  // 描画し直し
  startGame();                             // 新しいゲーム開始
}

// GAME OVER画面の「もう一回♡」ボタン
resetBtn.addEventListener("click", resetGame);



function drop() {
  if (!current) {
    newPiece();
  }

  const ny = current.y + 1;

  if (!collide(current.x, ny)) {
    // 普通に1マス落下
    current.y = ny;
    draw();
  } else {
    // ぶつかったので盤面に固定
    merge();

    // ライン消し＆重力アニメの間は自動落下止める
    stopGame();

    // ★ 揃った行がある限り、光る→消える→落ちるを連鎖させる
    handleLineClears(() => {
      // もう揃った行がなくなった → 次のブロックを出す
      applyGravityAnimated(() => {
      newPiece();
      draw();
      startGame();  // 自動落下再開
      });
    });
  }
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
  // 矢印キーのスクロールを完全無効化
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
    e.preventDefault();
  }

  if (!gameRunning || !current) return;

  if (e.key === "ArrowLeft") {
    const nx = current.x - 1;
    if (!collide(nx, current.y)) current.x = nx;

  } else if (e.key === "ArrowRight") {
    const nx = current.x + 1;
    if (!collide(nx, current.y)) current.x = nx;

  } else if (e.key === "ArrowDown") {
    drop();
    return;

  } else if (e.key === "ArrowUp") {
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
updateScore();
draw();

startBtn.addEventListener("click", startGame);
stopBtn.addEventListener("click", stopGame);
topResetBtn.addEventListener("click", resetGame);
resetBtn.addEventListener("click", resetGame);
resetHighScoreBtn.addEventListener("click", () => {
  highScore = 0;
  localStorage.removeItem("accioTetrisHighScore");
  if (highScoreElem) {
    highScoreElem.textContent = "ハイスコア：0";
  }
});



