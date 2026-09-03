import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ApiService,
  DeviceApp,
  KnownScreen,
} from '../../../core/services/api.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { SelectedDeviceService } from '../../../core/services/selected-device.service';

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
  screensApp: DeviceApp | null = null;
  screens: KnownScreen[] = [];
  screenName = '';
  screenActivity = '';
  editingScreenId = '';
  savingScreen = false;
  private refreshTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly toasts: ToastService,
    private readonly selectedDevice: SelectedDeviceService,
  ) {}

  ngOnInit() {
    this.api.list<any>('devices').subscribe((devices) => {
      this.devices = devices.filter((device) => device.enabled);
      this.deviceId = this.selectedDevice.resolve(this.devices);
      if (this.deviceId) this.load();
    });
  }

  onDeviceChange() {
    this.selectedDevice.select(this.deviceId);
    this.load();
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
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
        if (apps.some((app) => app.metadataPending)) {
          this.refreshTimer = setTimeout(() => this.load(), 5000);
        }
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
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
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

  manageScreens(app: DeviceApp) {
    this.screensApp = app;
    this.resetScreenForm();
    this.loadScreens();
  }

  closeScreens() {
    this.screensApp = null;
    this.screens = [];
    this.resetScreenForm();
  }

  loadScreens() {
    if (!this.screensApp) return;
    this.api.appScreens(this.screensApp.packageName).subscribe({
      next: (screens) => (this.screens = screens),
      error: () => this.toasts.error('Não foi possível carregar as telas.'),
    });
  }

  captureScreen() {
    if (!this.screensApp || !this.screenName.trim() || this.savingScreen)
      return;
    this.savingScreen = true;
    this.api
      .captureAppScreen(
        this.deviceId,
        this.screensApp.packageName,
        this.screenName.trim(),
      )
      .subscribe({
        next: () => {
          this.savingScreen = false;
          this.resetScreenForm();
          this.loadScreens();
          this.toasts.success('Tela atual cadastrada.');
        },
        error: (error) => {
          this.savingScreen = false;
          this.toasts.error(
            error.error?.message ?? 'Não foi possível capturar esta tela.',
          );
        },
      });
  }

  editScreen(screen: KnownScreen) {
    this.editingScreenId = screen.id;
    this.screenName = screen.name;
    this.screenActivity = screen.activityName;
  }

  saveScreen() {
    if (
      !this.screensApp ||
      !this.screenName.trim() ||
      !this.screenActivity.trim() ||
      this.savingScreen
    ) {
      return;
    }
    this.savingScreen = true;
    const value = {
      name: this.screenName.trim(),
      activityName: this.screenActivity.trim(),
    };
    const request = this.editingScreenId
      ? this.api.updateAppScreen(this.editingScreenId, value)
      : this.api.createAppScreen(this.screensApp.packageName, value);
    request.subscribe({
      next: () => {
        this.savingScreen = false;
        this.resetScreenForm();
        this.loadScreens();
        this.toasts.success('Tela salva.');
      },
      error: (error) => {
        this.savingScreen = false;
        this.toasts.error(
          error.error?.message ?? 'Não foi possível salvar a tela.',
        );
      },
    });
  }

  deleteScreen(screen: KnownScreen) {
    if (!confirm(`Excluir a tela "${screen.name}"?`)) return;
    this.api.deleteAppScreen(screen.id).subscribe({
      next: () => {
        this.loadScreens();
        this.toasts.success('Tela excluída.');
      },
      error: (error) =>
        this.toasts.error(error.error?.message ?? 'Não foi possível excluir.'),
    });
  }

  resetScreenForm() {
    this.screenName = '';
    this.screenActivity = '';
    this.editingScreenId = '';
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
