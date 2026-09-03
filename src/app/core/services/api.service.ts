import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

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
export interface FocusedNode {
  resourceId: string;
  text: string;
  contentDesc: string;
  className: string;
  package: string;
  bounds: string;
  clickable: boolean;
  focused: boolean;
  centerX: number;
  centerY: number;
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
  constructor(private readonly http: HttpClient) {}

  list<T>(resource: Resource) {
    return this.http.get<T[]>(`${this.base}/${resource}`);
  }
  create<T>(resource: Resource, value: T) {
    return this.http.post<T>(`${this.base}/${resource}`, value);
  }
  update<T extends { id: string }>(resource: Resource, value: T) {
    return this.http.put<T>(`${this.base}/${resource}/${value.id}`, value);
  }
  remove(resource: Resource, id: string) {
    return this.http.delete(`${this.base}/${resource}/${id}`);
  }
  actions() {
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
  screenFocus(deviceId: string, packageName: string, screenId: string) {
    return this.http.get<{ node: FocusedNode | null }>(
      `${this.base}/devices/${deviceId}/apps/${packageName}/screens/${screenId}/focus`,
    );
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
  ) {
    return this.http.post(
      `${this.base}/devices/${deviceId}/macros/${macroId}/run`,
      { variables, openRequiredApp },
    );
  }
  preflightMacro(deviceId: string, macroId: string) {
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
    from: number,
    to: number,
    variables: Record<string, string> = {},
  ) {
    return this.http.post(
      `${this.base}/devices/${deviceId}/macros/${macroId}/test`,
      {
        from,
        to,
        variables,
      },
    );
  }
  deviceApps(deviceId: string) {
    return this.http.get<DeviceApp[]>(`${this.base}/devices/${deviceId}/apps`);
  }
  deviceAppIcon(deviceId: string, packageName: string) {
    return this.http.get(
      `${this.base}/devices/${deviceId}/apps/${packageName}/icon`,
      { responseType: 'blob' },
    );
  }
  openDeviceApp(deviceId: string, packageName: string) {
    return this.http.post(
      `${this.base}/devices/${deviceId}/apps/${packageName}/open`,
      {},
    );
  }
  uninstallDeviceApp(deviceId: string, packageName: string) {
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
