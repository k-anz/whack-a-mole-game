/**
 * リザルトシーン
 *
 * ゲーム終了後の結果を表示します。
 * - スコア表示
 * - ハイスコア更新チェック
 * - 評価メッセージとビジュアル
 * - リトライボタン
 */
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

    /**
     * 背景を作成（青空と草原）
     */
    createBackground(width, height) {
        // 青空
        const skyRect = this.add.rectangle(0, 0, width, height * 0.7, 0x87CEEB);
        skyRect.setOrigin(0, 0);

        // 草原
        const grassRect = this.add.rectangle(0, height * 0.7, width, height * 0.3, 0x228B22);
        grassRect.setOrigin(0, 0);
    }

    /**
     * リザルト（スコア、ハイスコア）を表示
     */
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

    /**
     * 評価メッセージとモグラの表情を表示
     */
    createEvaluation(width, height) {
        let message = '';

        if (this.finalScore < 500) {
            message = 'もっと頑張れ！';
        } else if (this.finalScore < 1500) {
            message = 'なかなかの腕前！';
        } else {
            message = 'モグラマスター！';
        }

        const evalText = this.add.text(width / 2, height * 0.6, message, {
            fontSize: '40px',
            fontWeight: 'bold',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 5
        });
        evalText.setOrigin(0.5);

        // === 可愛いモグラの絵 ===
        const moleX = width / 2;
        const moleY = height * 0.72;

        // 耳
        const leftEar = this.add.circle(moleX - 50, moleY - 45, 22, 0x8B4513);
        leftEar.setStrokeStyle(2, 0x5D3A1A);
        const leftEarInner = this.add.circle(moleX - 50, moleY - 45, 12, 0xDEB887);
        const rightEar = this.add.circle(moleX + 50, moleY - 45, 22, 0x8B4513);
        rightEar.setStrokeStyle(2, 0x5D3A1A);
        const rightEarInner = this.add.circle(moleX + 50, moleY - 45, 12, 0xDEB887);

        // 顔
        const moleCircle = this.add.circle(moleX, moleY, 60, 0x8B4513);
        moleCircle.setStrokeStyle(4, 0x5D3A1A);

        // ほっぺ
        const leftCheek = this.add.ellipse(moleX - 42, moleY + 8, 18, 12, 0xFFB6C1);
        leftCheek.setAlpha(0.7);
        const rightCheek = this.add.ellipse(moleX + 42, moleY + 8, 18, 12, 0xFFB6C1);
        rightCheek.setAlpha(0.7);

        // 鼻
        const nose = this.add.ellipse(moleX, moleY + 12, 16, 12, 0xFF69B4);
        nose.setStrokeStyle(2, 0x000000);

        // 表情に応じて目と口を変える
        if (this.finalScore < 500) {
            // にっこり笑顔（モグラが勝ち）
            const leftEyeWhite = this.add.circle(moleX - 22, moleY - 15, 14, 0xFFFFFF);
            leftEyeWhite.setStrokeStyle(2, 0x000000);
            const leftEyeBlack = this.add.circle(moleX - 20, moleY - 13, 7, 0x000000);
            const leftEyeHighlight = this.add.circle(moleX - 23, moleY - 17, 4, 0xFFFFFF);
            const rightEyeWhite = this.add.circle(moleX + 22, moleY - 15, 14, 0xFFFFFF);
            rightEyeWhite.setStrokeStyle(2, 0x000000);
            const rightEyeBlack = this.add.circle(moleX + 24, moleY - 13, 7, 0x000000);
            const rightEyeHighlight = this.add.circle(moleX + 21, moleY - 17, 4, 0xFFFFFF);

            // にっこり口
            const smile = this.add.arc(moleX, moleY + 28, 15, 0, 180, false);
            smile.setStrokeStyle(3, 0x000000);
            smile.setClosePath(false);
        } else if (this.finalScore < 1500) {
            // 驚き顔
            const leftEyeWhite = this.add.circle(moleX - 22, moleY - 15, 16, 0xFFFFFF);
            leftEyeWhite.setStrokeStyle(2, 0x000000);
            const leftEyeBlack = this.add.circle(moleX - 22, moleY - 15, 8, 0x000000);
            const leftEyeHighlight = this.add.circle(moleX - 25, moleY - 19, 4, 0xFFFFFF);
            const rightEyeWhite = this.add.circle(moleX + 22, moleY - 15, 16, 0xFFFFFF);
            rightEyeWhite.setStrokeStyle(2, 0x000000);
            const rightEyeBlack = this.add.circle(moleX + 22, moleY - 15, 8, 0x000000);
            const rightEyeHighlight = this.add.circle(moleX + 19, moleY - 19, 4, 0xFFFFFF);

            // びっくり口
            const mouth = this.add.ellipse(moleX, moleY + 28, 14, 18, 0x000000);
        } else {
            // 降参（×目）- プレイヤーの勝ち
            const crossL1 = this.add.line(moleX - 22, moleY - 15, -10, -10, 10, 10, 0x000000, 1);
            crossL1.setLineWidth(4);
            crossL1.setOrigin(0, 0);
            const crossL2 = this.add.line(moleX - 22, moleY - 15, -10, 10, 10, -10, 0x000000, 1);
            crossL2.setLineWidth(4);
            crossL2.setOrigin(0, 0);
            const crossR1 = this.add.line(moleX + 22, moleY - 15, -10, -10, 10, 10, 0x000000, 1);
            crossR1.setLineWidth(4);
            crossR1.setOrigin(0, 0);
            const crossR2 = this.add.line(moleX + 22, moleY - 15, -10, 10, 10, -10, 0x000000, 1);
            crossR2.setLineWidth(4);
            crossR2.setOrigin(0, 0);

            // 残念口
            const sadMouth = this.add.arc(moleX, moleY + 35, 12, 180, 360, false);
            sadMouth.setStrokeStyle(3, 0x000000);
            sadMouth.setClosePath(false);

            // 汗
            const sweat1 = this.add.circle(moleX - 55, moleY - 35, 10, 0x87CEEB);
            sweat1.setAlpha(0.8);
            const sweat2 = this.add.circle(moleX + 55, moleY - 35, 10, 0x87CEEB);
            sweat2.setAlpha(0.8);
        }
    }

    /**
     * リトライボタンを作成
     */
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
            soundManager.playButtonClick();
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
