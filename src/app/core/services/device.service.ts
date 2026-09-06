import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  DeviceStatus,
  DiagnosticResult,
  ExecutionLog,
  RemoteKey,
} from '../models/device.models';
import { LocalStoreService } from '../native/local-store.service';
import { NativeRuntimeService } from '../native/native-runtime.service';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly base = `${environment.apiUrl}/api/v1`;
  constructor(
    private readonly http: HttpClient,
    private readonly native: NativeRuntimeService,
    private readonly localStore: LocalStoreService,
  ) {}

  status(deviceId: string): Observable<DeviceStatus> {
    if (this.native.enabled) return from(this.native.status(deviceId)) as any;
    return this.http.get<DeviceStatus>(
      `${this.base}/devices/${deviceId}/status`,
    );
  }
  key(deviceId: string, key: RemoteKey): Observable<any> {
    if (this.native.enabled) return from(this.native.key(deviceId, key));
    return this.http.post(`${this.base}/devices/${deviceId}/key`, { key });
  }
  type(deviceId: string, text: string): Observable<any> {
    if (this.native.enabled) return from(this.native.text(deviceId, text));
    return this.http.post(`${this.base}/devices/${deviceId}/text`, { text });
  }
  screenshot(deviceId: string): Observable<string> {
    if (this.native.enabled) return from(this.native.screenshot(deviceId));
    return this.http
      .get(`${this.base}/devices/${deviceId}/screenshot`, {
        responseType: 'blob',
      })
      .pipe(map((blob) => URL.createObjectURL(blob)));
  }
  diagnose(deviceId: string): Observable<DiagnosticResult> {
    if (this.native.enabled) {
      return from(
        this.native.status(deviceId).then((status) => ({
          device: deviceId,
          online: status.connection === 'device',
          checkedAt: new Date().toISOString(),
          checks: [
            {
              id: 'network',
              label: 'Conexão direta com a TV',
              ok: status.connection === 'device',
              detail: status.details,
            },
          ],
        })),
      );
    }
    return this.http.post<DiagnosticResult>(
      `${this.base}/devices/${deviceId}/diagnose`,
      {},
    );
  }
  tailscaleAlwaysOn(deviceId: string): Observable<any> {
    if (this.native.enabled) {
      return from(
        Promise.all([
          this.native.shell(deviceId, 'settings get secure always_on_vpn_app'),
          this.native.shell(deviceId, 'settings get secure always_on_vpn_lockdown'),
        ]).then(([app, lockdown]) => ({
          enabled: app.output.trim() === 'com.tailscale.ipn',
          application: app.output.trim() === 'null' ? null : app.output.trim(),
          lockdown: lockdown.output.trim() === '1',
        })),
      );
    }
    return this.http.get<{
      enabled: boolean;
      application: string | null;
      lockdown: boolean;
    }>(`${this.base}/devices/${deviceId}/settings/tailscale-always-on`);
  }
  setTailscaleAlwaysOn(deviceId: string, enabled: boolean): Observable<any> {
    if (this.native.enabled) {
      return from(
        (async () => {
          await this.native.shell(
            deviceId,
            `settings put secure always_on_vpn_app ${enabled ? 'com.tailscale.ipn' : 'null'}`,
          );
          await this.native.shell(deviceId, 'settings put secure always_on_vpn_lockdown 0');
          return {
            enabled,
            application: enabled ? 'com.tailscale.ipn' : null,
            lockdown: false,
          };
        })(),
      );
    }
    return this.http.put<{
      enabled: boolean;
      application: string | null;
      lockdown: boolean;
    }>(`${this.base}/devices/${deviceId}/settings/tailscale-always-on`, {
      enabled,
    });
  }
  logs(): Observable<ExecutionLog[]> {
    if (this.native.enabled) return from(this.localStore.list<ExecutionLog>('logs'));
    return this.http.get<ExecutionLog[]>(`${this.base}/logs`);
  }
}
