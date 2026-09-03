import { Component, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, interval, Subject, timer } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';
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
  busy = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly api: ApiService,
    private readonly device: DeviceService,
    private readonly toasts: ToastService,
  ) {}

  ngOnInit() {
    this.api.list<any>('devices').subscribe((rows) => {
      this.devices = rows.filter((item) => item.enabled);
      this.deviceId = this.devices[0]?.id ?? '';
      this.test();
      this.refreshScreen();
    });
    interval(5000)
      .pipe(
        takeUntil(this.destroy$),
        filter(
          () =>
            this.autoRefresh &&
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
    this.revokeScreen();
    this.screenState = 'idle';
    this.test();
    this.refreshScreen();
  }

  press(key: RemoteKey) {
    if (!this.deviceId || this.busy) return;
    const aliases: Record<string, string> = {
      UP: 'DPAD_UP',
      DOWN: 'DPAD_DOWN',
      LEFT: 'DPAD_LEFT',
      RIGHT: 'DPAD_RIGHT',
    };
    this.busy = true;
    this.device
      .key(this.deviceId, (aliases[key] ?? key) as RemoteKey)
      .subscribe({
        next: () => {
          this.busy = false;
          this.connection = 'device';
          this.refreshAfterCommand();
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
    if (!this.deviceId || !this.text || this.busy) return;
    const value = this.text;
    this.busy = true;
    this.device.type(this.deviceId, value).subscribe({
      next: () => {
        this.busy = false;
        this.text = '';
        this.toasts.success('Texto enviado');
        this.refreshAfterCommand();
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

  refreshScreen(quiet = false) {
    if (!this.deviceId) return;
    this.screenState = 'loading';
    this.device.screenshot(this.deviceId).subscribe({
      next: (url) => {
        this.revokeScreen();
        this.screenshotUrl = url;
        this.screenState = 'ok';
      },
      error: (error) => {
        this.screenState = 'error';
        if (!quiet) {
          this.toasts.error(
            error.error?.message ?? 'Não foi possível capturar a tela.',
          );
        }
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
    timer(450)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshScreen());
  }
}
