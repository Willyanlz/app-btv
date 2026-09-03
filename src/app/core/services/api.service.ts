import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export type Resource =
  | 'devices'
  | 'apps'
  | 'macros'
  | 'intents'
  | 'automations'
  | 'commands';

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
  runMacro(
    deviceId: string,
    macroId: string,
    variables: Record<string, string> = {},
  ) {
    return this.http.post(
      `${this.base}/devices/${deviceId}/macros/${macroId}/run`,
      { variables },
    );
  }
  runCommand(commandId: string) {
    return this.http.post(`${this.base}/commands/${commandId}/run`, {});
  }
  deviceApps(deviceId: string) {
    return this.http.get<{ packageName: string }[]>(
      `${this.base}/devices/${deviceId}/apps`,
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
