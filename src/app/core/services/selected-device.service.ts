import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'btv_selected_device';

@Injectable({ providedIn: 'root' })
export class SelectedDeviceService {
  private readonly selectedSubject = new BehaviorSubject<string>(
    localStorage.getItem(STORAGE_KEY) ?? '',
  );

  readonly selectedId$ = this.selectedSubject.asObservable();

  get selectedId() {
    return this.selectedSubject.value;
  }

  select(deviceId: string) {
    this.selectedSubject.next(deviceId);
    if (deviceId) localStorage.setItem(STORAGE_KEY, deviceId);
    else localStorage.removeItem(STORAGE_KEY);
  }

  resolve(devices: { id: string }[]) {
    const selected = devices.some((device) => device.id === this.selectedId)
      ? this.selectedId
      : (devices[0]?.id ?? '');
    this.select(selected);
    return selected;
  }
}
