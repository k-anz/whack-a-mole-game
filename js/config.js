/**
 * ゲーム定数設定
 *
 * ゲーム全体で使用する定数を定義します。
 * 難易度調整やゲームバランスの変更はここを編集してください。
 */

// ゲーム基本設定
const GAME_CONFIG = {
    // 画面サイズ（縦持ち専用）
    WIDTH: 720,
    HEIGHT: 1280,

    // ゲーム時間
    GAME_DURATION: 30, // 秒

    // モグラ表示時間
    MOLE_SHOW_TIME: 1500, // ミリ秒

    // スコア
    MOLE_SCORE: 100,
    BOMB_PENALTY_SCORE: -200,

    // 爆弾ペナルティ
    BOMB_PENALTY_TIME: 3, // 秒

    // 出現率
    MOLE_SPAWN_RATE: 0.85, // 85%がモグラ、15%が爆弾

    // LocalStorageキー
    HIGH_SCORE_KEY: 'moleGameHighScore'
};

// 難易度設定（時間経過で難易度が変化）
const DIFFICULTY = {
    // 開始時（最初の15秒）
    EASY: {
        interval: 1000,  // 出現間隔（ミリ秒）
        maxActive: 1     // 同時出現最大数
    },

    // 15秒経過後
    MEDIUM: {
        interval: 600,
        maxActive: 2
    },

    // ラスト5秒（ラッシュモード）
    HARD: {
        interval: 400,
        maxActive: 3
    }
};
