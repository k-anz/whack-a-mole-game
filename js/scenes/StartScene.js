/**
 * スタートシーン
 *
 * タイトル画面を表示し、ゲームを開始します。
 * ハイスコアも表示されます。
 */
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

    /**
     * 背景を作成（青空と草原）
     */
    createBackground(width, height) {
        // 青空（グラデーション風）
        const skyRect = this.add.rectangle(0, 0, width, height * 0.7, 0x87CEEB);
        skyRect.setOrigin(0, 0);

        // 草原
        const grassRect = this.add.rectangle(0, height * 0.7, width, height * 0.3, 0x228B22);
        grassRect.setOrigin(0, 0);
    }

    /**
     * タイトルロゴとサブタイトルを作成
     */
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

    /**
     * ハイスコアを表示
     */
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

    /**
     * スタートボタンを作成
     */
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
