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
        let moleTexture = '';

        if (this.finalScore < 500) {
            message = 'もっと頑張れ！';
            moleTexture = 'mole-happy';
        } else if (this.finalScore < 1500) {
            message = 'なかなかの腕前！';
            moleTexture = 'mole-surprised';
        } else {
            message = 'モグラマスター！';
            moleTexture = 'mole-defeated';
        }

        const evalText = this.add.text(width / 2, height * 0.6, message, {
            fontSize: '40px',
            fontWeight: 'bold',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 5
        });
        evalText.setOrigin(0.5);

        // モグラの画像を表示
        const moleImage = this.add.image(width / 2, height * 0.7, moleTexture);
        moleImage.setDisplaySize(120, 120);
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
