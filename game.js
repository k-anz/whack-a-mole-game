// ============================================
// ゲーム定数
// ============================================
const GAME_CONFIG = {
    WIDTH: 720,
    HEIGHT: 1280,
    GAME_DURATION: 30, // 秒
    MOLE_SHOW_TIME: 1500, // ミリ秒
    MOLE_SCORE: 100,
    BOMB_PENALTY_SCORE: -200,
    BOMB_PENALTY_TIME: 3, // 秒
    MOLE_SPAWN_RATE: 0.85, // 85%がモグラ
    HIGH_SCORE_KEY: 'moleGameHighScore'
};

// 難易度設定
const DIFFICULTY = {
    EASY: { interval: 1000, maxActive: 1 }, // 開始時
    MEDIUM: { interval: 600, maxActive: 2 }, // 15秒経過後
    HARD: { interval: 400, maxActive: 3 }    // ラスト5秒
};

// ============================================
// LocalStorage ユーティリティ
// ============================================
class StorageManager {
    static getHighScore() {
        const score = localStorage.getItem(GAME_CONFIG.HIGH_SCORE_KEY);
        return score ? parseInt(score) : 0;
    }

    static setHighScore(score) {
        const currentHigh = this.getHighScore();
        if (score > currentHigh) {
            localStorage.setItem(GAME_CONFIG.HIGH_SCORE_KEY, score.toString());
            return true; // 新記録
        }
        return false;
    }
}

// ============================================
// サウンドマネージャー（プレースホルダ音）
// ============================================
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    playBeep(frequency, duration) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playMoleAppear() {
        this.playBeep(600, 0.1); // ピョコッ
    }

    playMoleHit() {
        this.playBeep(400, 0.15); // ポカッ
    }

    playBombHit() {
        // ドカーン（複数の周波数）
        if (!this.audioContext) return;

        [100, 150, 200].forEach((freq, i) => {
            setTimeout(() => this.playBeep(freq, 0.2), i * 50);
        });
    }

    playTimeUp() {
        this.playBeep(800, 0.3); // ホイッスル音
    }

    playButtonClick() {
        this.playBeep(500, 0.1);
    }
}

// ============================================
// スタートシーン
// ============================================
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // 背景（青空と草原）
        this.createBackground(width, height);

        // タイトルロゴ
        this.createTitle(width, height);

        // ハイスコア表示
        this.createHighScoreDisplay(width, height);

        // スタートボタン
        this.createStartButton(width, height);
    }

    createBackground(width, height) {
        // 青空（グラデーション風）
        const skyRect = this.add.rectangle(0, 0, width, height * 0.7, 0x87CEEB);
        skyRect.setOrigin(0, 0);

        // 草原
        const grassRect = this.add.rectangle(0, height * 0.7, width, height * 0.3, 0x228B22);
        grassRect.setOrigin(0, 0);
    }

    createTitle(width, height) {
        const title = this.add.text(width / 2, height * 0.25, 'モグラ・パニック', {
            fontSize: '64px',
            fontWeight: 'bold',
            color: '#FF6B35',
            stroke: '#000',
            strokeThickness: 8
        });
        title.setOrigin(0.5);

        // 跳ねるアニメーション
        this.tweens.add({
            targets: title,
            y: height * 0.25 - 20,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // サブタイトル
        const subtitle = this.add.text(width / 2, height * 0.35, 'コミカル・ボム・エディション', {
            fontSize: '24px',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 4
        });
        subtitle.setOrigin(0.5);
    }

    createHighScoreDisplay(width, height) {
        const highScore = StorageManager.getHighScore();
        const text = this.add.text(width / 2, height * 0.5, `ハイスコア: ${highScore}`, {
            fontSize: '32px',
            color: '#FFD700',
            stroke: '#000',
            strokeThickness: 4
        });
        text.setOrigin(0.5);
    }

    createStartButton(width, height) {
        const buttonY = height * 0.65;

        // ボタン背景
        const button = this.add.rectangle(width / 2, buttonY, 300, 100, 0xFF6B35);
        button.setStrokeStyle(5, 0x000000);

        // ボタンテキスト
        const buttonText = this.add.text(width / 2, buttonY, 'START', {
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 4
        });
        buttonText.setOrigin(0.5);

        // インタラクティブ設定
        button.setInteractive({ useHandCursor: true });

        button.on('pointerdown', () => {
            this.sound.add('buttonClick').play();
            button.setFillStyle(0xCC5528);
        });

        button.on('pointerup', () => {
            button.setFillStyle(0xFF6B35);
            this.scene.start('MainScene');
        });

        button.on('pointerover', () => {
            button.setFillStyle(0xFF8C55);
        });

        button.on('pointerout', () => {
            button.setFillStyle(0xFF6B35);
        });
    }
}

// ============================================
// メインシーン
// ============================================
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    init() {
        this.score = 0;
        this.timeRemaining = GAME_CONFIG.GAME_DURATION;
        this.combo = 0;
        this.activeTargets = [];
        this.spawnTimer = null;
        this.isGameOver = false;
    }

    create() {
        const { width, height } = this.cameras.main;

        // 背景
        this.createBackground(width, height);

        // 穴を作成（3x3のグリッド）
        this.holes = this.createHoles(width, height);

        // UI作成
        this.createUI(width, height);

        // タイマー開始
        this.startGameTimer();

        // スポーン開始
        this.startSpawning();
    }

    createBackground(width, height) {
        // 青空
        const skyRect = this.add.rectangle(0, 0, width, height * 0.3, 0x87CEEB);
        skyRect.setOrigin(0, 0);

        // 草原（メインゲーム部分）
        const grassRect = this.add.rectangle(0, height * 0.3, width, height * 0.7, 0x228B22);
        grassRect.setOrigin(0, 0);
    }

    createHoles(width, height) {
        const holes = [];
        const startY = height * 0.35;
        const gridWidth = width * 0.8;
        const gridHeight = height * 0.5;
        const cols = 3;
        const rows = 3;
        const cellWidth = gridWidth / cols;
        const cellHeight = gridHeight / rows;
        const offsetX = (width - gridWidth) / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = offsetX + cellWidth * (col + 0.5);
                const y = startY + cellHeight * (row + 0.5);

                // 穴（楕円）
                const hole = this.add.ellipse(x, y, 120, 60, 0x654321);
                hole.setStrokeStyle(3, 0x000000);

                holes.push({
                    x: x,
                    y: y,
                    graphics: hole,
                    occupied: false,
                    target: null
                });
            }
        }

        return holes;
    }

    createUI(width, height) {
        // スコア表示
        this.scoreText = this.add.text(20, 40, `スコア: ${this.score}`, {
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 4
        });

        // タイマー表示
        this.timerText = this.add.text(width - 20, 40, `時間: ${this.timeRemaining}`, {
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 4
        });
        this.timerText.setOrigin(1, 0);

        // コンボ表示（初期非表示）
        this.comboText = this.add.text(width / 2, 120, '', {
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#FFD700',
            stroke: '#000',
            strokeThickness: 6
        });
        this.comboText.setOrigin(0.5);
        this.comboText.setVisible(false);
    }

    startGameTimer() {
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer() {
        if (this.isGameOver) return;

        this.timeRemaining--;
        this.timerText.setText(`時間: ${this.timeRemaining}`);

        // 残り時間で色変更
        if (this.timeRemaining <= 5) {
            this.timerText.setColor('#FF0000');
        } else if (this.timeRemaining <= 10) {
            this.timerText.setColor('#FFA500');
        }

        if (this.timeRemaining <= 0) {
            this.endGame();
        }
    }

    startSpawning() {
        this.scheduleNextSpawn();
    }

    scheduleNextSpawn() {
        if (this.isGameOver) return;

        const difficulty = this.getCurrentDifficulty();

        this.spawnTimer = this.time.addEvent({
            delay: difficulty.interval,
            callback: () => {
                this.spawnTarget(difficulty.maxActive);
                this.scheduleNextSpawn();
            },
            callbackScope: this
        });
    }

    getCurrentDifficulty() {
        const elapsed = GAME_CONFIG.GAME_DURATION - this.timeRemaining;

        if (this.timeRemaining <= 5) {
            return DIFFICULTY.HARD; // ラスト5秒
        } else if (elapsed >= 15) {
            return DIFFICULTY.MEDIUM; // 15秒経過後
        } else {
            return DIFFICULTY.EASY; // 開始時
        }
    }

    spawnTarget(maxActive) {
        // アクティブな数を確認
        if (this.activeTargets.length >= maxActive) return;

        // 空いている穴を探す
        const availableHoles = this.holes.filter(h => !h.occupied);
        if (availableHoles.length === 0) return;

        // ランダムな穴を選択
        const hole = Phaser.Utils.Array.GetRandom(availableHoles);

        // モグラか爆弾かを決定
        const isMole = Math.random() < GAME_CONFIG.MOLE_SPAWN_RATE;

        this.createTarget(hole, isMole);
    }

    createTarget(hole, isMole) {
        hole.occupied = true;

        // ターゲット作成（円）
        const radius = 50;
        const color = isMole ? 0xFF8C00 : 0x000000; // オレンジ or 黒

        const target = this.add.circle(hole.x, hole.y, radius, color);
        target.setStrokeStyle(4, 0x000000);
        target.setData('isMole', isMole);
        target.setData('hole', hole);

        // 爆弾の場合は導火線を追加（白い線）
        if (!isMole) {
            const fuse = this.add.line(hole.x, hole.y, 0, -radius, 0, -radius - 20, 0xFFFFFF, 1);
            fuse.setLineWidth(3);
            fuse.setOrigin(0, 0);
            target.setData('fuse', fuse);

            // 導火線の火花（赤い小さな円）
            const spark = this.add.circle(hole.x, hole.y - radius - 20, 5, 0xFF0000);
            target.setData('spark', spark);

            // 火花を点滅させる
            this.tweens.add({
                targets: spark,
                alpha: 0,
                duration: 300,
                yoyo: true,
                repeat: -1
            });
        } else {
            // モグラの目と鼻を追加
            const leftEye = this.add.circle(hole.x - 15, hole.y - 10, 8, 0x000000);
            const rightEye = this.add.circle(hole.x + 15, hole.y - 10, 8, 0x000000);
            const nose = this.add.circle(hole.x, hole.y + 5, 10, 0xFF0000);

            target.setData('eyes', [leftEye, rightEye]);
            target.setData('nose', nose);
        }

        // 初期位置（穴の下）
        target.y = hole.y + 200;
        if (target.getData('fuse')) {
            target.getData('fuse').y = target.y - radius;
            target.getData('spark').y = target.y - radius - 20;
        }
        if (target.getData('eyes')) {
            target.getData('eyes').forEach(eye => eye.y = target.y - 10);
            target.getData('nose').y = target.y + 5;
        }

        // 出現アニメーション（Back.out イージング）
        this.tweens.add({
            targets: target,
            y: hole.y,
            duration: 300,
            ease: 'Back.out',
            onUpdate: () => {
                // 付属パーツも一緒に移動
                if (target.getData('fuse')) {
                    target.getData('fuse').setPosition(target.x, target.y - radius);
                    target.getData('spark').setPosition(target.x, target.y - radius - 20);
                }
                if (target.getData('eyes')) {
                    const eyes = target.getData('eyes');
                    eyes[0].setPosition(target.x - 15, target.y - 10);
                    eyes[1].setPosition(target.x + 15, target.y - 10);
                    target.getData('nose').setPosition(target.x, target.y + 5);
                }
            }
        });

        // 出現音
        this.sound.add('moleAppear').play();

        // インタラクティブ設定
        target.setInteractive({ useHandCursor: true });
        target.on('pointerdown', () => this.hitTarget(target));

        // 自動的に隠れるタイマー
        const hideTimer = this.time.addEvent({
            delay: GAME_CONFIG.MOLE_SHOW_TIME,
            callback: () => this.hideTarget(target, false),
            callbackScope: this
        });

        target.setData('hideTimer', hideTimer);
        hole.target = target;
        this.activeTargets.push(target);
    }

    hitTarget(target) {
        if (!target.active) return;

        const isMole = target.getData('isMole');
        const hole = target.getData('hole');

        // タイマーをキャンセル
        const hideTimer = target.getData('hideTimer');
        if (hideTimer) hideTimer.remove();

        if (isMole) {
            // モグラをヒット
            this.score += GAME_CONFIG.MOLE_SCORE;
            this.combo++;

            // コンボボーナス
            if (this.combo >= 5 && this.combo % 5 === 0) {
                this.showCombo();
            }

            // 効果音
            this.sound.add('moleHit').play();

            // スコアポップアップ
            this.showScorePopup(target.x, target.y, `+${GAME_CONFIG.MOLE_SCORE}`, '#00FF00');

            // 叩かれたアニメーション（目が×になる）
            const eyes = target.getData('eyes');
            if (eyes) {
                eyes.forEach(eye => eye.destroy());
            }
            // ×を描画
            const cross1 = this.add.line(target.x, target.y - 10, -20, -10, 20, 10, 0x000000, 1);
            cross1.setLineWidth(4);
            cross1.setOrigin(0, 0);
            const cross2 = this.add.line(target.x, target.y - 10, -20, 10, 20, -10, 0x000000, 1);
            cross2.setLineWidth(4);
            cross2.setOrigin(0, 0);

            // 星を表示
            this.showStars(target.x, target.y - 80);

        } else {
            // 爆弾をヒット
            this.score += GAME_CONFIG.BOMB_PENALTY_SCORE;
            this.timeRemaining = Math.max(0, this.timeRemaining - GAME_CONFIG.BOMB_PENALTY_TIME);
            this.combo = 0; // コンボリセット

            // 効果音
            this.sound.add('bombHit').play();

            // 画面フラッシュ
            this.cameras.main.flash(200, 255, 255, 255);

            // スコアポップアップ
            this.showScorePopup(target.x, target.y, `${GAME_CONFIG.BOMB_PENALTY_SCORE}`, '#FF0000');
        }

        // スコア更新
        this.updateScore();

        // ターゲットを隠す
        this.hideTarget(target, true);
    }

    hideTarget(target, wasHit) {
        if (!target.active) return;

        const hole = target.getData('hole');

        // 非アクティブ化
        target.disableInteractive();

        // 沈むアニメーション
        this.tweens.add({
            targets: target,
            y: hole.y + 200,
            duration: wasHit ? 200 : 300,
            ease: 'Power2',
            onUpdate: () => {
                // 付属パーツも一緒に移動
                if (target.getData('fuse')) {
                    const fuse = target.getData('fuse');
                    const spark = target.getData('spark');
                    if (fuse && fuse.active) fuse.setPosition(target.x, target.y - 50);
                    if (spark && spark.active) spark.setPosition(target.x, target.y - 70);
                }
                if (target.getData('eyes')) {
                    const eyes = target.getData('eyes');
                    const nose = target.getData('nose');
                    eyes.forEach(eye => {
                        if (eye.active) eye.setPosition(eye.x, target.y - 10);
                    });
                    if (nose && nose.active) nose.setPosition(target.x, target.y + 5);
                }
            },
            onComplete: () => {
                // クリーンアップ
                if (target.getData('fuse')) {
                    target.getData('fuse').destroy();
                    target.getData('spark').destroy();
                }
                if (target.getData('eyes')) {
                    target.getData('eyes').forEach(eye => eye.destroy());
                    target.getData('nose').destroy();
                }
                target.destroy();

                hole.occupied = false;
                hole.target = null;

                // activeTargetsから削除
                const index = this.activeTargets.indexOf(target);
                if (index > -1) {
                    this.activeTargets.splice(index, 1);
                }
            }
        });

        // ミスの場合はコンボリセット
        if (!wasHit && target.getData('isMole')) {
            this.combo = 0;
            this.comboText.setVisible(false);
        }
    }

    showScorePopup(x, y, text, color) {
        const popup = this.add.text(x, y, text, {
            fontSize: '40px',
            fontWeight: 'bold',
            color: color,
            stroke: '#000',
            strokeThickness: 4
        });
        popup.setOrigin(0.5);

        this.tweens.add({
            targets: popup,
            y: y - 100,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => popup.destroy()
        });
    }

    showCombo() {
        this.comboText.setText(`${this.combo} COMBO!`);
        this.comboText.setVisible(true);
        this.comboText.setScale(1);

        // パルスアニメーション
        this.tweens.add({
            targets: this.comboText,
            scale: 1.3,
            duration: 200,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        // 3秒後に非表示
        this.time.delayedCall(3000, () => {
            this.comboText.setVisible(false);
        });
    }

    showStars(x, y) {
        for (let i = 0; i < 3; i++) {
            const angle = (i * 120 - 90) * Math.PI / 180;
            const star = this.add.star(x, y, 5, 5, 10, 0xFFD700);
            star.setStrokeStyle(2, 0x000000);

            this.tweens.add({
                targets: star,
                x: x + Math.cos(angle) * 60,
                y: y + Math.sin(angle) * 60,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => star.destroy()
            });
        }
    }

    updateScore() {
        this.scoreText.setText(`スコア: ${this.score}`);
    }

    endGame() {
        this.isGameOver = true;

        // タイマー停止
        if (this.gameTimer) this.gameTimer.remove();
        if (this.spawnTimer) this.spawnTimer.remove();

        // すべてのターゲットを削除
        this.activeTargets.forEach(target => {
            if (target.active) {
                const hideTimer = target.getData('hideTimer');
                if (hideTimer) hideTimer.remove();
                this.hideTarget(target, false);
            }
        });

        // 効果音
        this.sound.add('timeUp').play();

        // リザルトシーンへ
        this.time.delayedCall(1000, () => {
            this.scene.start('ResultScene', { score: this.score });
        });
    }
}

// ============================================
// リザルトシーン
// ============================================
class ResultScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ResultScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
    }

    create() {
        const { width, height } = this.cameras.main;

        // 背景
        this.createBackground(width, height);

        // ハイスコア判定
        const isNewRecord = StorageManager.setHighScore(this.finalScore);
        const highScore = StorageManager.getHighScore();

        // リザルト表示
        this.createResults(width, height, isNewRecord, highScore);

        // 評価表示
        this.createEvaluation(width, height);

        // リトライボタン
        this.createRetryButton(width, height);
    }

    createBackground(width, height) {
        // 青空
        const skyRect = this.add.rectangle(0, 0, width, height * 0.7, 0x87CEEB);
        skyRect.setOrigin(0, 0);

        // 草原
        const grassRect = this.add.rectangle(0, height * 0.7, width, height * 0.3, 0x228B22);
        grassRect.setOrigin(0, 0);
    }

    createResults(width, height, isNewRecord, highScore) {
        // タイトル
        const title = this.add.text(width / 2, height * 0.15, 'GAME OVER', {
            fontSize: '56px',
            fontWeight: 'bold',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 6
        });
        title.setOrigin(0.5);

        // 今回のスコア
        const scoreText = this.add.text(width / 2, height * 0.3, `スコア: ${this.finalScore}`, {
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 5
        });
        scoreText.setOrigin(0.5);

        // NEW RECORD表示
        if (isNewRecord) {
            const newRecordText = this.add.text(width / 2, height * 0.4, 'NEW RECORD!', {
                fontSize: '56px',
                fontWeight: 'bold',
                color: '#FFD700',
                stroke: '#FF0000',
                strokeThickness: 6
            });
            newRecordText.setOrigin(0.5);

            // 点滅アニメーション
            this.tweens.add({
                targets: newRecordText,
                alpha: 0.3,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }

        // ハイスコア表示
        const highScoreText = this.add.text(width / 2, height * 0.5, `ハイスコア: ${highScore}`, {
            fontSize: '32px',
            color: '#FFD700',
            stroke: '#000',
            strokeThickness: 4
        });
        highScoreText.setOrigin(0.5);
    }

    createEvaluation(width, height) {
        let message = '';
        let moleEmoji = '';

        if (this.finalScore < 500) {
            message = 'もっと頑張れ！';
            moleEmoji = '😄'; // 笑っている
        } else if (this.finalScore < 1500) {
            message = 'なかなかの腕前！';
            moleEmoji = '😲'; // 驚いている
        } else {
            message = 'モグラマスター！';
            moleEmoji = '🏳️'; // 降参
        }

        const evalText = this.add.text(width / 2, height * 0.6, message, {
            fontSize: '40px',
            fontWeight: 'bold',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 5
        });
        evalText.setOrigin(0.5);

        // モグラの絵（プレースホルダ）
        const moleCircle = this.add.circle(width / 2, height * 0.7, 60, 0xFF8C00);
        moleCircle.setStrokeStyle(4, 0x000000);

        // 表情に応じて目を変える
        if (this.finalScore < 500) {
            // 笑顔
            const leftEye = this.add.circle(width / 2 - 20, height * 0.7 - 15, 8, 0x000000);
            const rightEye = this.add.circle(width / 2 + 20, height * 0.7 - 15, 8, 0x000000);
            const smile = this.add.arc(width / 2, height * 0.7, 30, 0, 180, false, 0x000000);
            smile.setStrokeStyle(4, 0x000000);
        } else if (this.finalScore < 1500) {
            // 驚き
            const leftEye = this.add.circle(width / 2 - 20, height * 0.7 - 15, 12, 0x000000);
            const rightEye = this.add.circle(width / 2 + 20, height * 0.7 - 15, 12, 0x000000);
            const mouth = this.add.circle(width / 2, height * 0.7 + 10, 10, 0x000000);
        } else {
            // 降参（×目）
            const cross1 = this.add.line(width / 2, height * 0.7 - 15, -15, -10, 15, 10, 0x000000, 1);
            cross1.setLineWidth(4);
            cross1.setOrigin(0, 0);
            const cross2 = this.add.line(width / 2, height * 0.7 - 15, -15, 10, 15, -10, 0x000000, 1);
            cross2.setLineWidth(4);
            cross2.setOrigin(0, 0);

            // 汗
            const sweat1 = this.add.circle(width / 2 - 50, height * 0.7 - 30, 8, 0x87CEEB);
            const sweat2 = this.add.circle(width / 2 + 50, height * 0.7 - 30, 8, 0x87CEEB);
        }
    }

    createRetryButton(width, height) {
        const buttonY = height * 0.85;

        // ボタン背景
        const button = this.add.rectangle(width / 2, buttonY, 300, 100, 0xFF6B35);
        button.setStrokeStyle(5, 0x000000);

        // ボタンテキスト
        const buttonText = this.add.text(width / 2, buttonY, 'RETRY', {
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 4
        });
        buttonText.setOrigin(0.5);

        // インタラクティブ設定
        button.setInteractive({ useHandCursor: true });

        button.on('pointerdown', () => {
            this.sound.add('buttonClick').play();
            button.setFillStyle(0xCC5528);
        });

        button.on('pointerup', () => {
            button.setFillStyle(0xFF6B35);
            this.scene.start('StartScene');
        });

        button.on('pointerover', () => {
            button.setFillStyle(0xFF8C55);
        });

        button.on('pointerout', () => {
            button.setFillStyle(0xFF6B35);
        });
    }
}

// ============================================
// ゲーム設定とサウンド初期化
// ============================================
const soundManager = new SoundManager();

// Phaser設定
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [StartScene, MainScene, ResultScene],
    audio: {
        noAudio: false
    }
};

// ゲーム起動
const game = new Phaser.Game(config);

// カスタムサウンド登録（プレースホルダ）
game.sound.add('buttonClick', {
    onPlay: () => soundManager.playButtonClick()
});

game.sound.add('moleAppear', {
    onPlay: () => soundManager.playMoleAppear()
});

game.sound.add('moleHit', {
    onPlay: () => soundManager.playMoleHit()
});

game.sound.add('bombHit', {
    onPlay: () => soundManager.playBombHit()
});

game.sound.add('timeUp', {
    onPlay: () => soundManager.playTimeUp()
});
