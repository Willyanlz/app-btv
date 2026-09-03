import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-device-apps',
  templateUrl: './device-apps.component.html',
  styleUrls: ['./catalog.component.scss'],
})
export class DeviceAppsComponent implements OnInit {
  devices: any[] = [];
  apps: { packageName: string }[] = [];
  deviceId = '';
  loading = false;
  message = '';
  error = '';

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.api.list<any>('devices').subscribe((devices) => {
      this.devices = devices.filter((device) => device.enabled);
      this.deviceId = this.devices[0]?.id ?? '';
      if (this.deviceId) this.load();
    });
  }

  load() {
    if (!this.deviceId) return;
    this.loading = true;
    this.error = '';
    this.api.deviceApps(this.deviceId).subscribe({
      next: (apps) => {
        this.apps = apps;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.error =
          error.error?.message ?? 'Não foi possível listar os aplicativos.';
      },
    });
  }

  open(packageName: string) {
    this.message = `Abrindo ${packageName}...`;
    this.api.openDeviceApp(this.deviceId, packageName).subscribe({
      next: () => (this.message = 'Aplicativo aberto.'),
      error: (error) =>
        (this.error =
          error.error?.message ?? 'Não foi possível abrir o aplicativo.'),
    });
  }

  uninstall(packageName: string) {
    if (!confirm(`Desinstalar ${packageName} da TV Box?`)) return;
    this.api.uninstallDeviceApp(this.deviceId, packageName).subscribe({
      next: () => {
        this.message = 'Aplicativo desinstalado.';
        this.load();
      },
      error: (error) =>
        (this.error = error.error?.message ?? 'Não foi possível desinstalar.'),
    });
  }

  upload(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file || !this.deviceId) return;
    if (!file.name.toLowerCase().endsWith('.apk')) {
      this.error = 'Selecione um arquivo .apk válido.';
      return;
    }
    this.loading = true;
    this.message = `Instalando ${file.name}...`;
    this.api.installDeviceApp(this.deviceId, file).subscribe({
      next: () => {
        input.value = '';
        this.loading = false;
        this.message = 'APK instalado com sucesso.';
        this.load();
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message ?? 'A instalação falhou.';
      },
    });
  }
}
