/**
 * LocalStorage管理クラス
 *
 * ハイスコアの保存・取得を管理します。
 */
class StorageManager {
    /**
     * ハイスコアを取得
     * @returns {number} 保存されているハイスコア（初回は0）
     */
    static getHighScore() {
        const score = localStorage.getItem(GAME_CONFIG.HIGH_SCORE_KEY);
        return score ? parseInt(score) : 0;
    }

    /**
     * ハイスコアを設定（既存の記録より高い場合のみ保存）
     * @param {number} score 今回のスコア
     * @returns {boolean} 新記録の場合true
     */
    static setHighScore(score) {
        const currentHigh = this.getHighScore();
        if (score > currentHigh) {
            localStorage.setItem(GAME_CONFIG.HIGH_SCORE_KEY, score.toString());
            return true; // 新記録
        }
        return false;
    }
}
