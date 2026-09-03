import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { DeviceStatus, ExecutionLog, RemoteKey } from '../models/device.models';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly base = `${environment.apiUrl}/api/v1`;
  constructor(private readonly http: HttpClient) {}
  status(deviceId: string) { return this.http.get<DeviceStatus>(`${this.base}/devices/${deviceId}/status`); }
  key(deviceId: string, key: RemoteKey) { return this.http.post(`${this.base}/devices/${deviceId}/key`, { key }); }
  type(deviceId: string, text: string) { return this.http.post(`${this.base}/devices/${deviceId}/text`, { text }); }
  logs() { return this.http.get<ExecutionLog[]>(`${this.base}/logs`); }
}
