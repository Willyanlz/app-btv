import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { DeviceService } from '../../core/services/device.service';
import { SelectedDeviceService } from '../../core/services/selected-device.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  macros: any[] = [];
  devices: any[] = [];
  deviceId = '';
  selectedMacro: any = null;
  inputValue = '';
  running = false;
  runningName = '';
  checkingMacro = false;
  online = false;
  appConfirmation: {
    macro: any;
    variables: Record<string, string>;
    appName: string;
  } | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly api: ApiService,
    private readonly device: DeviceService,
    private readonly selectedDevice: SelectedDeviceService,
    private readonly toasts: ToastService,
  ) {}

  ngOnInit() {
    forkJoin({
      macros: this.api.list<any>('macros'),
      devices: this.api.list<any>('devices'),
    }).subscribe(({ macros, devices }) => {
      this.macros = macros.filter((macro) => macro.enabled);
      this.devices = devices.filter((device) => device.enabled);
      this.deviceId = this.selectedDevice.resolve(this.devices);
      this.checkStatus();
    });
    interval(15000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.checkStatus());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkStatus() {
    if (!this.deviceId) return;
    this.device.status(this.deviceId).subscribe({
      next: (status) => (this.online = status.connection === 'device'),
      error: () => (this.online = false),
    });
  }

  onDeviceChange() {
    this.selectedDevice.select(this.deviceId);
    this.online = false;
    this.checkStatus();
  }

  choose(macro: any) {
    if (this.running || this.checkingMacro || this.selectedMacro) return;
    if (!this.deviceId) {
      this.toasts.error('Cadastre um dispositivo antes de executar uma macro.');
      return;
    }
    if (macro.requiresInput) {
      this.selectedMacro = macro;
      this.inputValue = '';
      return;
    }
    this.prepareExecution(macro);
  }

  confirmInput() {
    if (!this.inputValue.trim()) return;
    const macro = this.selectedMacro;
    this.selectedMacro = null;
    this.prepareExecution(macro, {
      [macro.inputVariable]: this.inputValue.trim(),
    });
  }

  confirmOpenApp() {
    const confirmation = this.appConfirmation;
    if (!confirmation) return;
    this.appConfirmation = null;
    this.execute(confirmation.macro, confirmation.variables, true);
  }

  private prepareExecution(macro: any, variables: Record<string, string> = {}) {
    this.checkingMacro = true;
    this.api.preflightMacro(this.deviceId, macro.id).subscribe({
      next: (result) => {
        this.checkingMacro = false;
        if (!result.ready && result.requiredApp) {
          this.appConfirmation = {
            macro,
            variables,
            appName: result.requiredApp.name,
          };
          return;
        }
        this.execute(macro, variables);
      },
      error: (error) => {
        this.checkingMacro = false;
        this.toasts.error(
          error.error?.message ?? 'Não foi possível verificar a TV.',
        );
      },
    });
  }

  private execute(
    macro: any,
    variables: Record<string, string> = {},
    openRequiredApp = false,
  ) {
    this.running = true;
    this.runningName = macro.name;
    this.api
      .runMacro(this.deviceId, macro.id, variables, openRequiredApp)
      .subscribe({
        next: () => {
          this.running = false;
          this.toasts.success(`${macro.name} concluída.`);
        },
        error: (error) => {
          this.running = false;
          const details = error.error?.stepNumber
            ? `Passo ${error.error.stepNumber}: ${error.error.cause}`
            : error.error?.message;
          this.toasts.error(
            details ?? `Não foi possível executar ${macro.name}.`,
          );
        },
      });
  }
}
