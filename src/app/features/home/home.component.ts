import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { DeviceService } from '../../core/services/device.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  macros: any[] = [];
  devices: any[] = [];
  selectedMacro: any = null;
  inputValue = '';
  running = false;
  runningName = '';
  online = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly api: ApiService,
    private readonly device: DeviceService,
    private readonly toasts: ToastService,
  ) {}

  ngOnInit() {
    forkJoin({
      macros: this.api.list<any>('macros'),
      devices: this.api.list<any>('devices'),
    }).subscribe(({ macros, devices }) => {
      this.macros = macros.filter((macro) => macro.enabled);
      this.devices = devices.filter((device) => device.enabled);
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
    if (!this.devices.length) return;
    this.device.status(this.devices[0].id).subscribe({
      next: (status) => (this.online = status.connection === 'device'),
      error: () => (this.online = false),
    });
  }

  choose(macro: any) {
    if (!this.devices.length) {
      this.toasts.error(
        'Cadastre um dispositivo antes de executar uma macro.',
      );
      return;
    }
    if (macro.requiresInput) {
      this.selectedMacro = macro;
      this.inputValue = '';
      return;
    }
    this.execute(macro);
  }

  confirmInput() {
    if (!this.inputValue.trim()) return;
    const macro = this.selectedMacro;
    this.selectedMacro = null;
    this.execute(macro, { [macro.inputVariable]: this.inputValue.trim() });
  }

  private execute(macro: any, variables: Record<string, string> = {}) {
    this.running = true;
    this.runningName = macro.name;
    this.api.runMacro(this.devices[0].id, macro.id, variables).subscribe({
      next: () => {
        this.running = false;
        this.toasts.success(`${macro.name} concluída.`);
      },
      error: (error) => {
        this.running = false;
        this.toasts.error(
          error.error?.message ?? `Não foi possível executar ${macro.name}.`,
        );
      },
    });
  }
}
