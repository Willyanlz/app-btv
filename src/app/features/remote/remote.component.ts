import { Component, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, interval, Subject, timer } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ApiService, CurrentScreen, FocusedNode } from '../../core/services/api.service';
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
  screenshotUrl = '';
  screenState: 'idle' | 'loading' | 'ok' | 'error' = 'idle';
  autoRefresh = false;
  screenshotEnabled = false;
  busy = false;
  currentScreen: CurrentScreen | null = null;
  identifyingScreen = false;
  showScreenInfo = false;
  newScreenName = '';
  focusNode: FocusedNode | null = null;
  focusLoading = false;
  newButtonName = '';
  private lastAction = '';
  private lastActionAt = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly api: ApiService,
    private readonly device: DeviceService,
    private readonly toasts: ToastService,
    private readonly selectedDevice: SelectedDeviceService,
  ) {}

  ngOnInit() {
    this.api.list<any>('devices').subscribe((rows) => {
      this.devices = rows.filter((item) => item.enabled);
      this.deviceId = this.selectedDevice.resolve(this.devices);
      this.test();
    });
    interval(5000)
      .pipe(
        takeUntil(this.destroy$),
        filter(
          () =>
            this.autoRefresh &&
            this.screenshotEnabled &&
            document.visibilityState === 'visible' &&
            !!this.deviceId &&
            !this.busy,
        ),
      )
      .subscribe(() => this.refreshScreen(true));
    fromEvent(document, 'visibilitychange')
      .pipe(
        takeUntil(this.destroy$),
        filter(
          () =>
            document.visibilityState === 'visible' &&
            this.autoRefresh &&
            this.screenshotEnabled &&
            !!this.deviceId &&
            !this.busy,
        ),
      )
      .subscribe(() => this.refreshScreen(true));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.revokeScreen();
  }

  onDeviceChange() {
    this.selectedDevice.select(this.deviceId);
    this.revokeScreen();
    this.screenState = 'idle';
    this.currentScreen = null;
    this.showScreenInfo = false;
    this.focusNode = null;
    this.newButtonName = '';
    this.test();
    if (this.screenshotEnabled) this.refreshScreen();
  }

  press(key: RemoteKey) {
    if (!this.deviceId || (this.screenshotEnabled && this.busy)) return;
    if (this.isAccidentalRepeat(key)) return;
    const aliases: Record<string, string> = {
      UP: 'DPAD_UP',
      DOWN: 'DPAD_DOWN',
      LEFT: 'DPAD_LEFT',
      RIGHT: 'DPAD_RIGHT',
    };
    if (this.screenshotEnabled) this.busy = true;
    this.device
      .key(this.deviceId, (aliases[key] ?? key) as RemoteKey)
      .subscribe({
        next: () => {
          this.connection = 'device';
          if (this.screenshotEnabled) this.refreshAfterCommand();
        },
        error: (error) => {
          this.busy = false;
          this.toasts.error(
            error.error?.message ?? 'Não foi possível enviar o comando.',
          );
          this.refreshScreen();
        },
      });
  }

  sendText() {
    if (!this.deviceId || !this.text || (this.screenshotEnabled && this.busy)) {
      return;
    }
    const value = this.text;
    if (this.screenshotEnabled) this.busy = true;
    this.device.type(this.deviceId, value).subscribe({
      next: () => {
        this.text = '';
        this.toasts.success('Texto enviado');
        if (this.screenshotEnabled) this.refreshAfterCommand();
      },
      error: (error) => {
        this.busy = false;
        this.toasts.error(
          error.error?.message ?? 'Não foi possível enviar o texto.',
        );
        this.refreshScreen();
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
        this.focusNode = null;
        this.newButtonName = '';
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

  identifyFocus() {
    if (
      !this.deviceId ||
      this.focusLoading ||
      !this.currentScreen?.screen ||
      !this.currentScreen.packageName
    ) {
      return;
    }
    this.focusLoading = true;
    this.api
      .screenFocus(
        this.deviceId,
        this.currentScreen.packageName,
        this.currentScreen.screen.id,
      )
      .subscribe({
        next: ({ node }) => {
          this.focusLoading = false;
          this.focusNode = node;
          if (!node) this.toasts.error('Nenhum elemento focado encontrado.');
        },
        error: (error) => {
          this.focusLoading = false;
          this.toasts.error(
            error.error?.message ?? 'Não foi possível ler o foco.',
          );
        },
      });
  }

  saveFocusedButton() {
    if (
      !this.deviceId ||
      !this.currentScreen?.screen ||
      !this.currentScreen.packageName ||
      !this.newButtonName.trim() ||
      !this.focusNode
    ) {
      return;
    }
    this.focusLoading = true;
    this.api
      .captureFocusedButton(
        this.deviceId,
        this.currentScreen.packageName,
        this.currentScreen.screen.id,
        this.newButtonName.trim(),
      )
      .subscribe({
        next: () => {
          this.focusLoading = false;
          this.newButtonName = '';
          this.toasts.success('Botão salvo na tela.');
        },
        error: (error) => {
          this.focusLoading = false;
          this.toasts.error(
            error.error?.message ?? 'Não foi possível salvar o botão.',
          );
        },
      });
  }

  toggleScreenshot(enabled: boolean) {
    this.screenshotEnabled = enabled;
    if (enabled) {
      this.refreshScreen();
      return;
    }
    this.autoRefresh = false;
    this.busy = false;
    this.screenState = 'idle';
    this.revokeScreen();
  }

  refreshScreen(quiet = false, completed?: () => void) {
    if (
      !this.screenshotEnabled ||
      !this.deviceId ||
      document.visibilityState === 'hidden'
    ) {
      completed?.();
      return;
    }
    this.screenState = 'loading';
    this.device.screenshot(this.deviceId).subscribe({
      next: (url) => {
        this.revokeScreen();
        this.screenshotUrl = url;
        this.screenState = 'ok';
        completed?.();
      },
      error: (error) => {
        this.screenState = 'error';
        if (!quiet) {
          this.toasts.error(
            error.error?.message ?? 'Não foi possível capturar a tela.',
          );
        }
        completed?.();
      },
    });
  }

  private revokeScreen() {
    if (this.screenshotUrl) {
      URL.revokeObjectURL(this.screenshotUrl);
      this.screenshotUrl = '';
    }
  }

  private refreshAfterCommand() {
    timer(180)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshScreen(false, () => (this.busy = false)));
  }

  private isAccidentalRepeat(key: RemoteKey) {
    const now = Date.now();
    const accidental = this.lastAction === key && now - this.lastActionAt < 180;
    this.lastAction = key;
    this.lastActionAt = now;
    return accidental;
  }
}
