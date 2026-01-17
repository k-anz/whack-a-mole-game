/**
 * メインゲームシーン
 *
 * モグラ叩きのメインゲームロジックを管理します。
 * - モグラと爆弾の出現管理
 * - スコア計算とコンボシステム
 * - タイマー管理
 * - ゲーム終了判定
 */
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    init() {
        // ゲーム状態の初期化
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

    /**
     * 背景を作成（青空と草原）
     */
    createBackground(width, height) {
        // 青空
        const skyRect = this.add.rectangle(0, 0, width, height * 0.3, 0x87CEEB);
        skyRect.setOrigin(0, 0);

        // 草原（メインゲーム部分）
        const grassRect = this.add.rectangle(0, height * 0.3, width, height * 0.7, 0x228B22);
        grassRect.setOrigin(0, 0);
    }

    /**
     * 穴のグリッド（3x3）を作成
     */
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

    /**
     * UI要素を作成（スコア、タイマー、コンボ）
     */
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

    /**
     * ゲームタイマーを開始
     */
    startGameTimer() {
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * タイマーを更新（1秒ごと）
     */
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

    /**
     * スポーン処理を開始
     */
    startSpawning() {
        this.scheduleNextSpawn();
    }

    /**
     * 次のターゲット出現をスケジュール
     */
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

    /**
     * 現在の難易度を取得（時間経過で変化）
     */
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

    /**
     * ターゲット（モグラまたは爆弾）を出現させる
     */
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

    /**
     * ターゲットを作成（モグラまたは爆弾）
     */
    createTarget(hole, isMole) {
        hole.occupied = true;

        // ターゲット作成（円）
        const radius = 50;
        const color = isMole ? 0x8B4513 : 0x000000; // 茶色 or 黒

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
            // === 可愛いモグラのデザイン ===

            // 耳（顔の後ろに配置するため先に作成）
            const leftEar = this.add.circle(hole.x - 40, hole.y - 35, 18, 0x8B4513);
            leftEar.setStrokeStyle(2, 0x5D3A1A);
            const leftEarInner = this.add.circle(hole.x - 40, hole.y - 35, 10, 0xDEB887);
            const rightEar = this.add.circle(hole.x + 40, hole.y - 35, 18, 0x8B4513);
            rightEar.setStrokeStyle(2, 0x5D3A1A);
            const rightEarInner = this.add.circle(hole.x + 40, hole.y - 35, 10, 0xDEB887);

            // 目（白目 + 黒目 + ハイライト）
            const leftEyeWhite = this.add.circle(hole.x - 18, hole.y - 12, 12, 0xFFFFFF);
            leftEyeWhite.setStrokeStyle(2, 0x000000);
            const leftEyeBlack = this.add.circle(hole.x - 16, hole.y - 10, 6, 0x000000);
            const leftEyeHighlight = this.add.circle(hole.x - 19, hole.y - 14, 3, 0xFFFFFF);

            const rightEyeWhite = this.add.circle(hole.x + 18, hole.y - 12, 12, 0xFFFFFF);
            rightEyeWhite.setStrokeStyle(2, 0x000000);
            const rightEyeBlack = this.add.circle(hole.x + 20, hole.y - 10, 6, 0x000000);
            const rightEyeHighlight = this.add.circle(hole.x + 17, hole.y - 14, 3, 0xFFFFFF);

            // ほっぺ（ピンク）
            const leftCheek = this.add.ellipse(hole.x - 35, hole.y + 5, 16, 10, 0xFFB6C1);
            leftCheek.setAlpha(0.7);
            const rightCheek = this.add.ellipse(hole.x + 35, hole.y + 5, 16, 10, 0xFFB6C1);
            rightCheek.setAlpha(0.7);

            // 鼻（ピンクの楕円）
            const nose = this.add.ellipse(hole.x, hole.y + 8, 14, 10, 0xFF69B4);
            nose.setStrokeStyle(2, 0x000000);

            // 口（にっこり曲線）
            const mouth = this.add.arc(hole.x, hole.y + 18, 12, 0, 180, false);
            mouth.setStrokeStyle(3, 0x000000);
            mouth.setClosePath(false);

            // 前足
            const leftPaw = this.add.ellipse(hole.x - 30, hole.y + 45, 20, 12, 0x8B4513);
            leftPaw.setStrokeStyle(2, 0x5D3A1A);
            const rightPaw = this.add.ellipse(hole.x + 30, hole.y + 45, 20, 12, 0x8B4513);
            rightPaw.setStrokeStyle(2, 0x5D3A1A);

            // データに保存
            target.setData('ears', [leftEar, leftEarInner, rightEar, rightEarInner]);
            target.setData('eyes', [leftEyeWhite, leftEyeBlack, leftEyeHighlight, rightEyeWhite, rightEyeBlack, rightEyeHighlight]);
            target.setData('cheeks', [leftCheek, rightCheek]);
            target.setData('nose', nose);
            target.setData('mouth', mouth);
            target.setData('paws', [leftPaw, rightPaw]);
        }

        // 初期位置（穴の下）
        target.y = hole.y + 200;
        if (target.getData('fuse')) {
            target.getData('fuse').y = target.y - radius;
            target.getData('spark').y = target.y - radius - 20;
        }
        if (target.getData('eyes')) {
            // モグラの全パーツを初期位置に移動
            const offsetY = 200;
            target.getData('ears').forEach(ear => ear.y += offsetY);
            target.getData('eyes').forEach(eye => eye.y += offsetY);
            target.getData('cheeks').forEach(cheek => cheek.y += offsetY);
            target.getData('nose').y += offsetY;
            target.getData('mouth').y += offsetY;
            target.getData('paws').forEach(paw => paw.y += offsetY);
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
                    // 耳
                    const ears = target.getData('ears');
                    ears[0].setPosition(target.x - 40, target.y - 35); // leftEar
                    ears[1].setPosition(target.x - 40, target.y - 35); // leftEarInner
                    ears[2].setPosition(target.x + 40, target.y - 35); // rightEar
                    ears[3].setPosition(target.x + 40, target.y - 35); // rightEarInner

                    // 目
                    const eyes = target.getData('eyes');
                    eyes[0].setPosition(target.x - 18, target.y - 12); // leftEyeWhite
                    eyes[1].setPosition(target.x - 16, target.y - 10); // leftEyeBlack
                    eyes[2].setPosition(target.x - 19, target.y - 14); // leftEyeHighlight
                    eyes[3].setPosition(target.x + 18, target.y - 12); // rightEyeWhite
                    eyes[4].setPosition(target.x + 20, target.y - 10); // rightEyeBlack
                    eyes[5].setPosition(target.x + 17, target.y - 14); // rightEyeHighlight

                    // ほっぺ
                    const cheeks = target.getData('cheeks');
                    cheeks[0].setPosition(target.x - 35, target.y + 5);
                    cheeks[1].setPosition(target.x + 35, target.y + 5);

                    // 鼻と口
                    target.getData('nose').setPosition(target.x, target.y + 8);
                    target.getData('mouth').setPosition(target.x, target.y + 18);

                    // 前足
                    const paws = target.getData('paws');
                    paws[0].setPosition(target.x - 30, target.y + 45);
                    paws[1].setPosition(target.x + 30, target.y + 45);
                }
            }
        });

        // 出現音
        soundManager.playMoleAppear();

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

    /**
     * ターゲットがヒットされた時の処理
     */
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
            soundManager.playMoleHit();

            // スコアポップアップ
            this.showScorePopup(target.x, target.y, `+${GAME_CONFIG.MOLE_SCORE}`, '#00FF00');

            // 叩かれたアニメーション（目が×になる）
            const eyes = target.getData('eyes');
            if (eyes) {
                eyes.forEach(eye => eye.destroy());
            }
            // ×目を描画（左）
            const crossL1 = this.add.line(target.x - 18, target.y - 12, -8, -8, 8, 8, 0x000000, 1);
            crossL1.setLineWidth(3);
            crossL1.setOrigin(0, 0);
            const crossL2 = this.add.line(target.x - 18, target.y - 12, -8, 8, 8, -8, 0x000000, 1);
            crossL2.setLineWidth(3);
            crossL2.setOrigin(0, 0);
            // ×目を描画（右）
            const crossR1 = this.add.line(target.x + 18, target.y - 12, -8, -8, 8, 8, 0x000000, 1);
            crossR1.setLineWidth(3);
            crossR1.setOrigin(0, 0);
            const crossR2 = this.add.line(target.x + 18, target.y - 12, -8, 8, 8, -8, 0x000000, 1);
            crossR2.setLineWidth(3);
            crossR2.setOrigin(0, 0);

            // 口を残念な表情に変更
            const mouth = target.getData('mouth');
            if (mouth) mouth.destroy();
            const sadMouth = this.add.arc(target.x, target.y + 25, 10, 180, 360, false);
            sadMouth.setStrokeStyle(3, 0x000000);
            sadMouth.setClosePath(false);

            // 星を表示
            this.showStars(target.x, target.y - 80);

        } else {
            // 爆弾をヒット
            this.score += GAME_CONFIG.BOMB_PENALTY_SCORE;
            this.timeRemaining = Math.max(0, this.timeRemaining - GAME_CONFIG.BOMB_PENALTY_TIME);
            this.combo = 0; // コンボリセット

            // 効果音
            soundManager.playBombHit();

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

    /**
     * ターゲットを隠す（沈むアニメーション）
     */
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
                if (target.getData('ears')) {
                    // 耳
                    const ears = target.getData('ears');
                    if (ears[0] && ears[0].active) {
                        ears[0].setPosition(target.x - 40, target.y - 35);
                        ears[1].setPosition(target.x - 40, target.y - 35);
                        ears[2].setPosition(target.x + 40, target.y - 35);
                        ears[3].setPosition(target.x + 40, target.y - 35);
                    }

                    // 目
                    const eyes = target.getData('eyes');
                    eyes.forEach(eye => {
                        if (eye && eye.active) eye.y = target.y - 12;
                    });

                    // ほっぺ
                    const cheeks = target.getData('cheeks');
                    if (cheeks[0] && cheeks[0].active) {
                        cheeks[0].setPosition(target.x - 35, target.y + 5);
                        cheeks[1].setPosition(target.x + 35, target.y + 5);
                    }

                    // 鼻と口
                    const nose = target.getData('nose');
                    if (nose && nose.active) nose.setPosition(target.x, target.y + 8);
                    const mouth = target.getData('mouth');
                    if (mouth && mouth.active) mouth.setPosition(target.x, target.y + 18);

                    // 前足
                    const paws = target.getData('paws');
                    if (paws[0] && paws[0].active) {
                        paws[0].setPosition(target.x - 30, target.y + 45);
                        paws[1].setPosition(target.x + 30, target.y + 45);
                    }
                }
            },
            onComplete: () => {
                // クリーンアップ
                if (target.getData('fuse')) {
                    target.getData('fuse').destroy();
                    target.getData('spark').destroy();
                }
                if (target.getData('ears')) {
                    target.getData('ears').forEach(ear => { if (ear && ear.active) ear.destroy(); });
                    target.getData('eyes').forEach(eye => { if (eye && eye.active) eye.destroy(); });
                    target.getData('cheeks').forEach(cheek => { if (cheek && cheek.active) cheek.destroy(); });
                    const nose = target.getData('nose');
                    if (nose && nose.active) nose.destroy();
                    const mouth = target.getData('mouth');
                    if (mouth && mouth.active) mouth.destroy();
                    target.getData('paws').forEach(paw => { if (paw && paw.active) paw.destroy(); });
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

    /**
     * スコアポップアップを表示
     */
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

    /**
     * コンボ表示
     */
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

    /**
     * 星のエフェクトを表示
     */
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

    /**
     * スコアを更新
     */
    updateScore() {
        this.scoreText.setText(`スコア: ${this.score}`);
    }

    /**
     * ゲーム終了処理
     */
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
        soundManager.playTimeUp();

        // リザルトシーンへ
        this.time.delayedCall(1000, () => {
            this.scene.start('ResultScene', { score: this.score });
        });
    }
}
