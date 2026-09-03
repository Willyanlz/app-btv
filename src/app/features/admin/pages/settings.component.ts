import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { DeviceService } from '../../../core/services/device.service';
import { SelectedDeviceService } from '../../../core/services/selected-device.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  devices: any[] = [];
  deviceId = '';
  loading = false;
  saving = false;
  status: {
    enabled: boolean;
    application: string | null;
    lockdown: boolean;
  } | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly device: DeviceService,
    private readonly selectedDevice: SelectedDeviceService,
    private readonly toasts: ToastService,
  ) {}

  ngOnInit() {
    this.api.list<any>('devices').subscribe((devices) => {
      this.devices = devices.filter((item) => item.enabled);
      this.deviceId = this.selectedDevice.resolve(this.devices);
      this.load();
    });
  }

  onDeviceChange() {
    this.selectedDevice.select(this.deviceId);
    this.load();
  }

  load() {
    if (!this.deviceId) return;
    this.loading = true;
    this.status = null;
    this.device.tailscaleAlwaysOn(this.deviceId).subscribe({
      next: (status) => {
        this.status = status;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toasts.error(
          error.error?.message ?? 'Não foi possível consultar a configuração.',
        );
      },
    });
  }

  setEnabled(enabled: boolean) {
    if (!this.deviceId || this.saving) return;
    this.saving = true;
    this.device.setTailscaleAlwaysOn(this.deviceId, enabled).subscribe({
      next: (status) => {
        this.status = status;
        this.saving = false;
        this.toasts.success(
          enabled
            ? 'Tailscale configurado para iniciar com a TV.'
            : 'Inicialização automática do Tailscale desativada.',
        );
      },
      error: (error) => {
        this.saving = false;
        this.toasts.error(error.error?.message ?? 'A TV recusou a alteração.');
      },
    });
  }
}
