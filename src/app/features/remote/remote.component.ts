import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { DeviceService } from '../../core/services/device.service';
import { RemoteKey } from '../../core/models/device.models';

@Component({ selector: 'app-remote', templateUrl: './remote.component.html', styleUrls: ['./remote.component.scss'] })
export class RemoteComponent implements OnInit {
  devices: any[] = [];
  deviceId = '';
  text = '';
  feedback = '';
  connection = 'não verificado';
  constructor(private readonly api: ApiService, private readonly device: DeviceService) {}
  ngOnInit() { this.api.list<any>('devices').subscribe((rows) => { this.devices = rows.filter((x) => x.enabled); this.deviceId = this.devices[0]?.id ?? ''; }); }
  press(key: RemoteKey) {
    if (!this.deviceId) return this.show('Cadastre e selecione um dispositivo.');
    const aliases: Record<string, string> = { UP: 'DPAD_UP', DOWN: 'DPAD_DOWN', LEFT: 'DPAD_LEFT', RIGHT: 'DPAD_RIGHT' };
    this.device.key(this.deviceId, (aliases[key] ?? key) as RemoteKey).subscribe({ next: () => this.show('Comando enviado'), error: () => this.show('Não foi possível enviar.') });
  }
  sendText() { if (this.deviceId && this.text) this.device.type(this.deviceId, this.text).subscribe({ next: () => { this.text = ''; this.show('Texto enviado'); }, error: () => this.show('Não foi possível enviar.') }); }
  test() { if (this.deviceId) this.device.status(this.deviceId).subscribe((status) => this.connection = status.connection); }
  show(value: string) { this.feedback = value; setTimeout(() => this.feedback = '', 2500); }
}
