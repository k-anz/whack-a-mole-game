/**
 * サウンド管理クラス（プレースホルダ音）
 *
 * Web Audio APIを使用して基本的なビープ音を生成します。
 * 実際の音声ファイルに差し替える場合は、このクラスを
 * Phaser.Sound.BaseSoundManagerを使った実装に置き換えてください。
 */
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.initAudioContext();
    }

    /**
     * AudioContextを初期化
     */
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    /**
     * ビープ音を再生
     * @param {number} frequency 周波数（Hz）
     * @param {number} duration 再生時間（秒）
     */
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

    /**
     * モグラ出現音（ピョコッ）
     */
    playMoleAppear() {
        this.playBeep(600, 0.1);
    }

    /**
     * モグラヒット音（ポカッ）
     */
    playMoleHit() {
        this.playBeep(400, 0.15);
    }

    /**
     * 爆弾ヒット音（ドカーン）
     */
    playBombHit() {
        if (!this.audioContext) return;

        // 複数の周波数を重ねて爆発音を表現
        [100, 150, 200].forEach((freq, i) => {
            setTimeout(() => this.playBeep(freq, 0.2), i * 50);
        });
    }

    /**
     * タイムアップ音（ホイッスル）
     */
    playTimeUp() {
        this.playBeep(800, 0.3);
    }

    /**
     * ボタンクリック音
     */
    playButtonClick() {
        this.playBeep(500, 0.1);
    }
}
