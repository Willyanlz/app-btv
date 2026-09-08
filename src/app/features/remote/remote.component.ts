import { Component, OnDestroy, OnInit } from '@angular/core';
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
  private lastAction = '';
  private lastActionAt = 0;

  constructor(
    private readonly api: ApiService,
    private readonly device: DeviceService,
    private readonly toasts: ToastService,
    private readonly selectedDevice: SelectedDeviceService,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.api.list<any>('devices').subscribe((rows) => {
      this.devices = rows.filter((item) => item.enabled);
      this.deviceId = this.selectedDevice.resolve(this.devices);
      this.test();
    });
  }

  ngOnDestroy() {
    this.stopMirror();
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
  }

  toggleMirror(enabled: boolean) {
    if (enabled) {
      this.startMirror();
      return;
    }
    this.stopMirror();
  }

  private isAccidentalRepeat(key: RemoteKey) {
    const now = Date.now();
    const accidental = this.lastAction === key && now - this.lastActionAt < 180;
    this.lastAction = key;
    this.lastActionAt = now;
    return accidental;
  }
}
