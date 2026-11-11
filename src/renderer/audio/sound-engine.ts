/**
 * منظومة الصواف للأقمشة — محرك المؤثرات الصوتية التفاعلية (Web Audio API Synthesizer)
 * يعمل محلياً 100% بدون إنترنت وبدون الحاجة لملفات صوتية خارجية.
 * يولد ذبذبات صوتية مريحة ووقورة تتناسب مع بيئة العمل الصعيدية وساعات العمل الطويلة.
 */

export type SoundEvent =
  | 'welcome'           // ترحيب الدخول
  | 'cut_approved'      // اعتماد القص (صوت مقص حاد وسريع)
  | 'cash_drawer'       // دفع نقدي (صوت فتحة درج الخزنة ومعدن)
  | 'credit_stamp'      // دفع آجل (صوت ختم الدفتر الوقور)
  | 'bolt_warning'      // تنبيه فواضل الأتواب (Bolt-Buster)
  | 'supervisor_alert'  // تجاوز صلاحيات / كود المدير
  | 'barcode_error'     // خطأ باركود / صنف غير موجود
  | 'backup_success';   // نجاح النسخ الاحتياطي

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public play(event: SoundEvent): void {
    if (this.isMuted || typeof window === 'undefined') return;

    try {
      const ctx = this.getAudioContext();
      const masterGain = ctx.createGain();
      masterGain.gain.value = this.volume;
      masterGain.connect(ctx.destination);

      switch (event) {
        case 'cut_approved':
          this.playScissorCut(ctx, masterGain);
          break;
        case 'cash_drawer':
          this.playCashDrawer(ctx, masterGain);
          break;
        case 'credit_stamp':
          this.playStampPress(ctx, masterGain);
          break;
        case 'bolt_warning':
          this.playBoltWarning(ctx, masterGain);
          break;
        case 'supervisor_alert':
          this.playSupervisorAlert(ctx, masterGain);
          break;
        case 'barcode_error':
          this.playErrorBeep(ctx, masterGain);
          break;
        case 'welcome':
          this.playWelcomeChord(ctx, masterGain);
          break;
        case 'backup_success':
          this.playBackupSuccess(ctx, masterGain);
          break;
      }
    } catch {
      // التجاهل الصامت إذا كانت البيئة لا تدعم تشغيل الصوت
    }
  }

  /** صوت مقص الأقمشة الحاد (توليد ضوضاء احتكاك + رنين معدني قصير) */
  private playScissorCut(ctx: AudioContext, dest: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  }

  /** صوت درج الخزنة المعدني المبهج (نغمتان متتاليتان برنين معدني) */
  private playCashDrawer(ctx: AudioContext, dest: GainNode): void {
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // كورد C Major بهيج
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.42);
    });
  }

  /** صوت ختم دفتر الآجل الدافئ والوقور (تردد عميق وضربة هادئة) */
  private playStampPress(ctx: AudioContext, dest: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.7, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.23);
  }

  /** تنبيه فواضل الأتواب (نغمة مزدوجة لطيفة غير مزعجة) */
  private playBoltWarning(ctx: AudioContext, dest: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1); // D6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.32);
  }

  /** تنبيه كود المشرف (نغمة تحذير بطيئة ومحترمة) */
  private playSupervisorAlert(ctx: AudioContext, dest: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  }

  /** خطأ في الباركود (نقرتان خفيفتان) */
  private playErrorBeep(ctx: AudioContext, dest: GainNode): void {
    [0, 0.1].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(250, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.08);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.09);
    });
  }

  /** ترحيب افتتاح الوردية */
  private playWelcomeChord(ctx: AudioContext, dest: GainNode): void {
    const freqs = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(dest);

      osc.start();
      osc.stop(ctx.currentTime + 1.25);
    });
  }

  /** نجاح النسخ الاحتياطي */
  private playBackupSuccess(ctx: AudioContext, dest: GainNode): void {
    const freqs = [587.33, 880.00]; // D5, A5
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = i * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.52);
    });
  }
}

export const soundEngine = new SoundEngine();
