import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService, DeviceApp } from '../../../core/services/api.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-device-apps',
  templateUrl: './device-apps.component.html',
  styleUrls: ['./catalog.component.scss'],
})
export class DeviceAppsComponent implements OnInit, OnDestroy {
  devices: any[] = [];
  apps: DeviceApp[] = [];
  iconUrls: Record<string, string> = {};
  deviceId = '';
  loading = false;
  uninstallApp: { packageName: string; name: string } | null = null;
  typedPackage = '';

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly toasts: ToastService,
  ) {}

  ngOnInit() {
    this.api.list<any>('devices').subscribe((devices) => {
      this.devices = devices.filter((device) => device.enabled);
      this.deviceId = this.devices[0]?.id ?? '';
      if (this.deviceId) this.load();
    });
  }

  ngOnDestroy() {
    this.clearIconUrls();
  }

  load() {
    if (!this.deviceId) return;
    this.clearIconUrls();
    this.loading = true;
    this.api.deviceApps(this.deviceId).subscribe({
      next: (apps) => {
        this.apps = apps;
        this.loading = false;
        this.loadIcons(apps);
      },
      error: (error) => {
        this.loading = false;
        this.toasts.error(
          error.error?.message ?? 'Não foi possível listar os aplicativos.',
        );
      },
    });
  }

  private loadIcons(apps: DeviceApp[]) {
    for (const app of apps.filter((item) => item.hasIcon)) {
      this.api.deviceAppIcon(this.deviceId, app.packageName).subscribe({
        next: (icon) => {
          this.iconUrls[app.packageName] = URL.createObjectURL(icon);
        },
      });
    }
  }

  private clearIconUrls() {
    Object.values(this.iconUrls).forEach((url) => URL.revokeObjectURL(url));
    this.iconUrls = {};
  }

  open(packageName: string) {
    this.api.openDeviceApp(this.deviceId, packageName).subscribe({
      next: () => this.toasts.success('Aplicativo aberto.'),
      error: (error) =>
        this.toasts.error(
          error.error?.message ?? 'Não foi possível abrir o aplicativo.',
        ),
    });
  }

  addToMacro(packageName: string) {
    this.router.navigate(['/admin/macros'], {
      queryParams: { app: packageName },
    });
  }

  askUninstall(app: { packageName: string; name: string }) {
    this.uninstallApp = app;
    this.typedPackage = '';
  }

  cancelUninstall() {
    this.uninstallApp = null;
    this.typedPackage = '';
  }

  confirmUninstall() {
    if (
      !this.uninstallApp ||
      this.typedPackage.trim() !== this.uninstallApp.packageName
    ) {
      return;
    }
    const target = this.uninstallApp;
    this.uninstallApp = null;
    this.typedPackage = '';
    this.api.uninstallDeviceApp(this.deviceId, target.packageName).subscribe({
      next: () => {
        this.toasts.success('Aplicativo desinstalado.');
        this.load();
      },
      error: (error) =>
        this.toasts.error(
          error.error?.message ?? 'Não foi possível desinstalar.',
        ),
    });
  }

  upload(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file || !this.deviceId) return;
    if (!file.name.toLowerCase().endsWith('.apk')) {
      this.toasts.error('Selecione um arquivo .apk válido.');
      return;
    }
    this.loading = true;
    this.api.installDeviceApp(this.deviceId, file).subscribe({
      next: () => {
        input.value = '';
        this.loading = false;
        this.toasts.success('APK instalado com sucesso.');
        this.load();
      },
      error: (error) => {
        this.loading = false;
        this.toasts.error(error.error?.message ?? 'A instalação falhou.');
      },
    });
  }
}
