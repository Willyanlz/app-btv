import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LocalResource, LocalStoreService } from '../native/local-store.service';
import { NativeAdb } from '../native/native-adb.plugin';
import { NativeRuntimeService } from '../native/native-runtime.service';

export type Resource =
  'devices' | 'apps' | 'macros' | 'intents' | 'automations' | 'commands';

export interface DeviceApp {
  packageName: string;
  name: string;
  hasIcon: boolean;
  icon: string;
  color: string;
  metadataPending: boolean;
}
export interface KnownScreen {
  id: string;
  packageName: string;
  name: string;
  activityName: string;
}
export interface KnownButton {
  id: string;
  screenId: string;
  name: string;
  resourceId: string;
  text: string;
  contentDesc: string;
  className: string;
  centerX: number;
  centerY: number;
  bounds: string;
}
export interface CurrentScreen {
  packageName: string | null;
  appName: string | null;
  activityName: string | null;
  screen: KnownScreen | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = `${environment.apiUrl}/api/v1`;
  constructor(
    private readonly http: HttpClient,
    private readonly native: NativeRuntimeService,
    private readonly localStore: LocalStoreService,
  ) {}

  list<T>(resource: Resource): Observable<T[]> {
    if (this.native.enabled) {
      return from(this.localStore.list<T>(resource as LocalResource));
    }
    return this.http.get<T[]>(`${this.base}/${resource}`);
  }
  create<T>(resource: Resource, value: T): Observable<T> {
    if (this.native.enabled) {
      return from(this.localStore.save(resource as LocalResource, value as any)) as any;
    }
    return this.http.post<T>(`${this.base}/${resource}`, value);
  }
  update<T extends { id: string }>(resource: Resource, value: T): Observable<T> {
    if (this.native.enabled) {
      return from(this.localStore.save(resource as LocalResource, value));
    }
    return this.http.put<T>(`${this.base}/${resource}/${value.id}`, value);
  }
  remove(resource: Resource, id: string): Observable<any> {
    if (this.native.enabled) {
      return from(this.localStore.remove(resource as LocalResource, id));
    }
    return this.http.delete(`${this.base}/${resource}/${id}`);
  }
  actions() {
    if (this.native.enabled) {
      return of([
        { type: 'key', key: 'HOME', label: 'Início' },
        { type: 'key', key: 'BACK', label: 'Voltar' },
        { type: 'key', key: 'DPAD_UP', label: 'Seta para cima' },
        { type: 'key', key: 'DPAD_DOWN', label: 'Seta para baixo' },
        { type: 'key', key: 'DPAD_LEFT', label: 'Seta para esquerda' },
        { type: 'key', key: 'DPAD_RIGHT', label: 'Seta para direita' },
        { type: 'key', key: 'ENTER', label: 'Botão OK' },
        { type: 'key', key: 'PLAY_PAUSE', label: 'Reproduzir/Pausar' },
        { type: 'key', key: 'VOLUME_UP', label: 'Aumentar volume' },
        { type: 'key', key: 'VOLUME_DOWN', label: 'Diminuir volume' },
        { type: 'key', key: 'MUTE', label: 'Silenciar' },
        { type: 'text', label: 'Digitar texto' },
        { type: 'wait', label: 'Aguardar' },
        { type: 'openApp', label: 'Abrir aplicativo' },
        { type: 'callMacro', label: 'Chamar outra macro' },
        { type: 'screenCondition', label: 'Verificar tela' },
        { type: 'clickButton', label: 'Clicar em botão' },
      ]);
    }
    return this.http.get<any[]>(`${this.base}/actions`);
  }
  screens(packageName: string) {
    return this.http.get<{ id: string; name: string }[]>(
      `${this.base}/screens`,
      { params: { packageName } },
    );
  }
  appScreens(packageName: string) {
    return this.http.get<KnownScreen[]>(
      `${this.base}/apps/${packageName}/screens`,
    );
  }
  createAppScreen(
    packageName: string,
    value: { name: string; activityName: string },
  ) {
    return this.http.post<KnownScreen>(
      `${this.base}/apps/${packageName}/screens`,
      value,
    );
  }
  updateAppScreen(id: string, value: { name: string; activityName: string }) {
    return this.http.put<KnownScreen>(`${this.base}/app-screens/${id}`, value);
  }
  deleteAppScreen(id: string) {
    return this.http.delete(`${this.base}/app-screens/${id}`);
  }
  captureAppScreen(deviceId: string, packageName: string, name: string) {
    return this.http.post<KnownScreen>(
      `${this.base}/devices/${deviceId}/apps/${packageName}/screens/capture`,
      { name },
    );
  }
  currentScreen(deviceId: string) {
    return this.http.get<CurrentScreen>(
      `${this.base}/devices/${deviceId}/current-screen`,
    );
  }
  appButtons(packageName: string, screenId: string) {
    return this.http.get<KnownButton[]>(
      `${this.base}/apps/${packageName}/screens/${screenId}/buttons`,
    );
  }
  createAppButton(
    packageName: string,
    screenId: string,
    value: Partial<KnownButton>,
  ) {
    return this.http.post<KnownButton>(
      `${this.base}/apps/${packageName}/screens/${screenId}/buttons`,
      value,
    );
  }
  updateAppButton(id: string, value: Partial<KnownButton>) {
    return this.http.put<KnownButton>(`${this.base}/app-buttons/${id}`, value);
  }
  deleteAppButton(id: string) {
    return this.http.delete(`${this.base}/app-buttons/${id}`);
  }
  captureFocusedButton(
    deviceId: string,
    packageName: string,
    screenId: string,
    name: string,
  ) {
    return this.http.post<KnownButton>(
      `${this.base}/devices/${deviceId}/apps/${packageName}/screens/${screenId}/focus/capture`,
      { name },
    );
  }
  runMacro(
    deviceId: string,
    macroId: string,
    variables: Record<string, string> = {},
    openRequiredApp = false,
  ): Observable<any> {
    if (this.native.enabled) {
      return from(
        (async () => {
          const macro = await this.localStore.get<any>('macros', macroId);
          if (openRequiredApp && macro?.appPackage) {
            await this.native.shell(
              deviceId,
              `monkey -p ${macro.appPackage} -c android.intent.category.LAUNCHER 1`,
            );
            await new Promise((resolve) =>
              setTimeout(resolve, Number(macro.appOpenDelaySeconds ?? 10) * 1000),
            );
          }
          return this.native.runMacro(deviceId, macroId, variables);
        })(),
      );
    }
    return this.http.post(
      `${this.base}/devices/${deviceId}/macros/${macroId}/run`,
      { variables, openRequiredApp },
    );
  }
  preflightMacro(deviceId: string, macroId: string): Observable<any> {
    if (this.native.enabled) {
      return from(
        (async () => {
          const macro = await this.localStore.get<any>('macros', macroId);
          if (!macro?.appPackage) return { ready: true, requiredApp: null };
          const foreground = await this.native.foreground(deviceId);
          return {
            ready: foreground.packageName === macro.appPackage,
            requiredApp: {
              packageName: macro.appPackage,
              name: macro.appPackage,
              delaySeconds: Number(macro.appOpenDelaySeconds ?? 10),
            },
            foregroundPackage: foreground.packageName,
          };
        })(),
      );
    }
    return this.http.get<{
      ready: boolean;
      requiredApp: {
        packageName: string;
        name: string;
        delaySeconds: number;
      } | null;
      foregroundPackage?: string | null;
    }>(`${this.base}/devices/${deviceId}/macros/${macroId}/preflight`);
  }
  runCommand(commandId: string) {
    return this.http.post(`${this.base}/commands/${commandId}/run`, {});
  }
  testMacro(
    deviceId: string,
    macroId: string,
    fromIndex: number,
    to: number,
    variables: Record<string, string> = {},
  ): Observable<any> {
    if (this.native.enabled) {
      return from(this.native.runMacro(deviceId, macroId, variables, fromIndex, to));
    }
    return this.http.post(
      `${this.base}/devices/${deviceId}/macros/${macroId}/test`,
      {
        from: fromIndex,
        to,
        variables,
      },
    );
  }
  deviceApps(deviceId: string): Observable<DeviceApp[]> {
    if (this.native.enabled) {
      return from(
        this.native.shell(deviceId, 'pm list packages -3').then(({ output }) =>
          output
            .split(/\r?\n/)
            .map((line) => line.replace(/^package:/, '').trim())
            .filter(Boolean)
            .sort()
            .map((packageName) => ({
              packageName,
              name: packageName,
              hasIcon: false,
              icon: 'bi-app',
              color: '#64748b',
              metadataPending: false,
            })),
        ),
      );
    }
    return this.http.get<DeviceApp[]>(`${this.base}/devices/${deviceId}/apps`);
  }
  deviceAppIcon(deviceId: string, packageName: string) {
    return this.http.get(
      `${this.base}/devices/${deviceId}/apps/${packageName}/icon`,
      { responseType: 'blob' },
    );
  }
  openDeviceApp(deviceId: string, packageName: string): Observable<any> {
    if (this.native.enabled) {
      return from(
        this.native.shell(
          deviceId,
          `monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`,
        ),
      );
    }
    return this.http.post(
      `${this.base}/devices/${deviceId}/apps/${packageName}/open`,
      {},
    );
  }
  uninstallDeviceApp(deviceId: string, packageName: string): Observable<any> {
    if (this.native.enabled) {
      return from(
        this.native.target(deviceId).then((target) =>
          NativeAdb.uninstall({ ...target, packageName }),
        ),
      );
    }
    return this.http.delete(
      `${this.base}/devices/${deviceId}/apps/${packageName}`,
    );
  }
  installDeviceApp(deviceId: string, file: File) {
    return this.http.post(
      `${this.base}/devices/${deviceId}/apps/install`,
      file,
      {
        headers: { 'Content-Type': 'application/vnd.android.package-archive' },
      },
    );
  }
}
