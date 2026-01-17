/**
 * モグラ・パニック（コミカル・ボム・エディション）
 * ゲーム初期化ファイル
 *
 * このファイルはゲームの起動とサウンドの初期化を行います。
 * 各機能は以下のファイルに分割されています:
 * - js/config.js: ゲーム定数
 * - js/StorageManager.js: LocalStorage管理
 * - js/SoundManager.js: サウンド管理
 * - js/scenes/StartScene.js: スタートシーン
 * - js/scenes/MainScene.js: メインゲームシーン
 * - js/scenes/ResultScene.js: リザルトシーン
 */

// サウンドマネージャーのインスタンス作成
const soundManager = new SoundManager();

// Phaser ゲーム設定
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

// カスタムサウンド登録（プレースホルダ音）
// 各サウンドはSoundManagerのメソッドを呼び出します
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
