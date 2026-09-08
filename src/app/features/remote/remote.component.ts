import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService, CurrentScreen } from '../../core/services/api.service';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
import { SelectedDeviceService } from '../../core/services/selected-device.service';
import { RemoteKey } from '../../core/models/device.models';

@Component({
  selector: 'app-remote',
  templateUrl: './remote.component.html',
  styleUrls: ['./remote.component.scss'],
})
export class RemoteComponent implements OnInit, OnDestroy {
  devices: any[] = [];
  deviceId = '';
  text = '';
  connection = 'não verificado';
  mirrorUrl: SafeResourceUrl | null = null;
  mirrorEnabled = false;
  mirrorLoading = false;
  currentScreen: CurrentScreen | null = null;
  identifyingScreen = false;
  showScreenInfo = false;
  newScreenName = '';
  isFullscreen = false;
  pipSize = 250;
  pipX = 0;
  pipY = 0;

  @ViewChild('liveScreen') private liveScreen?: ElementRef<HTMLElement>;

  private compact = false;
  private destroyed = false;
  private readonly pipMinSize = 150;
  private readonly pipMaxSize = 520;
  private mediaQuery?: MediaQueryList;
  private lastAction = '';
  private lastActionAt = 0;

  constructor(
    private readonly api: ApiService,
    private readonly device: DeviceService,
    private readonly toasts: ToastService,
    private readonly selectedDevice: SelectedDeviceService,
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.api.list<any>('devices').subscribe((rows) => {
      this.devices = rows.filter((item) => item.enabled);
      this.deviceId = this.selectedDevice.resolve(this.devices);
      this.test();
    });
    this.setupPip();
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.stopMirror();
    this.teardownPip();
    this.mediaQuery = undefined;
  }

  onDeviceChange() {
    this.selectedDevice.select(this.deviceId);
    this.stopMirror();
    this.currentScreen = null;
    this.showScreenInfo = false;
    this.test();
  }

  press(key: RemoteKey) {
    if (!this.deviceId) return;
    if (this.isAccidentalRepeat(key)) return;
    const aliases: Record<string, string> = {
      UP: 'DPAD_UP',
      DOWN: 'DPAD_DOWN',
      LEFT: 'DPAD_LEFT',
      RIGHT: 'DPAD_RIGHT',
    };
    this.device
      .key(this.deviceId, (aliases[key] ?? key) as RemoteKey)
      .subscribe({
        next: () => {
          this.connection = 'device';
        },
        error: (error) => {
          this.toasts.error(
            error.error?.message ?? 'Não foi possível enviar o comando.',
          );
        },
      });
  }

  sendText() {
    if (!this.deviceId || !this.text) {
      return;
    }
    const value = this.text;
    this.device.type(this.deviceId, value).subscribe({
      next: () => {
        this.text = '';
        this.toasts.success('Texto enviado');
      },
      error: (error) => {
        this.toasts.error(
          error.error?.message ?? 'Não foi possível enviar o texto.',
        );
      },
    });
  }

  test() {
    if (!this.deviceId || document.visibilityState === 'hidden') return;
    this.device.status(this.deviceId).subscribe((status) => {
      this.connection = status.connection;
    });
  }

  connectionLabel() {
    const labels: Record<string, string> = {
      device: 'Conectada',
      offline: 'TV desconectada',
      unreachable: 'TV desconectada',
      unauthorized: 'Confirme a autorização na TV',
      unknown: 'Não verificada',
    };
    return labels[this.connection] ?? 'Não verificada';
  }

  identifyScreen() {
    if (!this.deviceId || this.identifyingScreen) return;
    this.identifyingScreen = true;
    this.showScreenInfo = true;
    this.api.currentScreen(this.deviceId).subscribe({
      next: (screen) => {
        this.currentScreen = screen;
        this.identifyingScreen = false;
      },
      error: (error) => {
        this.identifyingScreen = false;
        this.toasts.error(
          error.error?.message ?? 'Não foi possível identificar a tela.',
        );
      },
    });
  }

  saveCurrentScreen() {
    if (
      !this.currentScreen?.packageName ||
      !this.newScreenName.trim() ||
      this.identifyingScreen
    ) {
      return;
    }
    this.identifyingScreen = true;
    this.api
      .captureAppScreen(
        this.deviceId,
        this.currentScreen.packageName,
        this.newScreenName.trim(),
      )
      .subscribe({
        next: () => {
          this.newScreenName = '';
          this.identifyingScreen = false;
          this.toasts.success('Tela conhecida salva.');
          this.identifyScreen();
        },
        error: (error) => {
          this.identifyingScreen = false;
          this.toasts.error(
            error.error?.message ?? 'Não foi possível salvar a tela.',
          );
        },
      });
  }

  startMirror() {
    if (!this.deviceId || this.mirrorLoading) return;
    this.mirrorLoading = true;
    this.device.mirrorTicket(this.deviceId).subscribe({
      next: ({ url }) => {
        this.mirrorUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.mirrorEnabled = true;
        this.mirrorLoading = false;
        if (this.compact) this.resetPipPosition();
      },
      error: (error) => {
        this.mirrorLoading = false;
        this.toasts.error(
          error.error?.message ?? error.message ?? 'Não foi possível iniciar o espelhamento.',
        );
      },
    });
  }

  stopMirror() {
    this.mirrorEnabled = false;
    this.mirrorUrl = null;
    this.mirrorLoading = false;
    if (this.isFullscreen) this.closeFullscreen();
  }

  toggleMirror(enabled: boolean) {
    if (enabled) {
      this.startMirror();
      return;
    }
    this.stopMirror();
  }

  displayPip(): boolean {
    return this.compact && this.mirrorEnabled;
  }

  get pipStyle(): Record<string, string> | null {
    if (!this.displayPip()) return null;
    return {
      '--pip-w': `${Math.round(this.pipSize)}px`,
      '--pip-l': `${Math.round(this.pipX)}px`,
      '--pip-t': `${Math.round(this.pipY)}px`,
    };
  }

  openFullscreen(): void {
    const element = this.liveScreen?.nativeElement;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
    type FullscreenRequest = () => Promise<void> | void;
    const webkit = element as HTMLElement & { webkitRequestFullscreen?: FullscreenRequest };
    const request =
      element.requestFullscreen?.() ??
      webkit.webkitRequestFullscreen?.();
    if (!request) {
      this.toasts.error('Este navegador não suporta tela cheia.');
      return;
    }
    void Promise.resolve(request)
      .then(() => this.lockLandscape())
      .catch(() => this.toasts.error('Não foi possível entrar em tela cheia.'));
  }

  closeFullscreen(): void {
    screen.orientation?.unlock?.();
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
    this.isFullscreen = false;
    if (!this.destroyed) this.cdr.detectChanges();
  }

  onPipDragStart(event: PointerEvent): void {
    if (!this.displayPip() || event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('button, label, input, a, select')) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = this.pipX;
    const originY = this.pipY;
    const move = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      this.movePipTo(originX + moveEvent.clientX - startX, originY + moveEvent.clientY - startY);
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }

  onPipResizeStart(event: PointerEvent): void {
    if (!this.displayPip() || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const startPointerX = event.clientX;
    const startSize = this.pipSize;
    const maxWidth = Math.max(this.pipMinSize, window.innerWidth - this.safeAreaMargin());
    const move = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const next = startSize + (moveEvent.clientX - startPointerX);
      const limited = Math.min(Math.max(next, this.pipMinSize), Math.min(this.pipMaxSize, maxWidth));
      this.pipSize = Math.round(limited);
      this.clampPip();
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }

  private movePipTo(x: number, y: number): void {
    const inset = this.safeArea();
    const width = this.pipSize;
    const height = this.pipHeight();
    const maxX = window.innerWidth - inset.right - width;
    const maxY = window.innerHeight - inset.bottom - height;
    this.pipX = Math.min(Math.max(x, inset.left), Math.max(inset.left, maxX));
    this.pipY = Math.min(Math.max(y, inset.top), Math.max(inset.top, maxY));
  }

  private clampPip(): void {
    const inset = this.safeArea();
    const maxX = window.innerWidth - inset.right - this.pipSize;
    const maxY = window.innerHeight - inset.bottom - this.pipHeight();
    this.pipX = Math.min(Math.max(this.pipX, inset.left), Math.max(inset.left, maxX));
    this.pipY = Math.min(Math.max(this.pipY, inset.top), Math.max(inset.top, maxY));
  }

  private resetPipPosition(): void {
    const inset = this.safeArea();
    const viewportWidth = window.innerWidth;
    this.pipSize = Math.min(
      this.pipMaxSize,
      Math.max(this.pipMinSize, viewportWidth - inset.left - inset.right - 24),
    );
    this.pipX = Math.max(inset.left, viewportWidth - inset.right - this.pipSize - 12);
    this.pipY = inset.top + 12;
  }

  private pipHeight(): number {
    return Math.round((this.pipSize * 9) / 16) + 40;
  }

  private safeAreaMargin(): number {
    const inset = this.safeArea();
    return inset.left + inset.right + 24;
  }

  private safeArea(): { top: number; right: number; bottom: number; left: number } {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;width:0;height:0;left:0;top:0;';
    probe.style.paddingTop = 'env(safe-area-inset-top)';
    probe.style.paddingRight = 'env(safe-area-inset-right)';
    probe.style.paddingBottom = 'env(safe-area-inset-bottom)';
    probe.style.paddingLeft = 'env(safe-area-inset-left)';
    document.body.appendChild(probe);
    const computed = window.getComputedStyle(probe);
    const value = (property: string) => {
      const parsed = Number.parseFloat(computed.getPropertyValue(property));
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const result = {
      top: value('padding-top'),
      right: value('padding-right'),
      bottom: value('padding-bottom'),
      left: value('padding-left'),
    };
    probe.remove();
    return result;
  }

  private lockLandscape(): void {
    const orientation = screen.orientation;
    if (!orientation?.lock) return;
    orientation.lock('landscape').catch(() => {
      this.toasts.info('Dica: gire o aparelho para o modo horizontal.');
    });
  }

  private setupPip(): void {
    this.mediaQuery = window.matchMedia('(max-width: 850px)');
    this.compact = this.mediaQuery.matches;
    if (typeof this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', this.onCompactChange);
    } else {
      this.mediaQuery.addListener(this.onCompactChange);
    }
    window.addEventListener('resize', this.onWindowResize);
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.onFullscreenChange as EventListener);
    document.addEventListener('fullscreenerror', this.onFullscreenError);
    document.addEventListener('webkitfullscreenerror', this.onFullscreenError as EventListener);
  }

  private teardownPip(): void {
    this.mediaQuery?.removeEventListener?.('change', this.onCompactChange);
    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.onFullscreenChange as EventListener);
    document.removeEventListener('fullscreenerror', this.onFullscreenError);
    document.removeEventListener('webkitfullscreenerror', this.onFullscreenError as EventListener);
  }

  private readonly onCompactChange = (event: MediaQueryListEvent): void => {
    this.compact = event.matches;
    if (this.compact) {
      this.resetPipPosition();
    }
    if (!this.destroyed) this.cdr.detectChanges();
  };

  private readonly onWindowResize = (): void => {
    if (!this.compact) return;
    this.clampPip();
    if (!this.destroyed) this.cdr.detectChanges();
  };

  private readonly onFullscreenChange = (): void => {
    const documentWithWebkit = document as Document & { webkitFullscreenElement?: Element | null };
    const fullscreenElement =
      document.fullscreenElement ?? documentWithWebkit.webkitFullscreenElement ?? null;
    this.isFullscreen = fullscreenElement === this.liveScreen?.nativeElement;
    if (!this.isFullscreen) {
      screen.orientation?.unlock?.();
    }
    if (!this.destroyed) this.cdr.detectChanges();
  };

  private readonly onFullscreenError = (): void => {
    this.isFullscreen = false;
    if (!this.destroyed) this.cdr.detectChanges();
    this.toasts.error('Não foi possível entrar em tela cheia.');
  };

  private isAccidentalRepeat(key: RemoteKey) {
    const now = Date.now();
    const accidental = this.lastAction === key && now - this.lastActionAt < 180;
    this.lastAction = key;
    this.lastActionAt = now;
    return accidental;
  }
}
