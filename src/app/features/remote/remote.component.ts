import { Component } from '@angular/core';
import { DeviceService } from '../../core/services/device.service';
import { RemoteKey } from '../../core/models/device.models';
@Component({
  selector: 'app-remote',
  templateUrl: './remote.component.html',
  styleUrls: ['./remote.component.scss'],
})
export class RemoteComponent {
  text = '';
  feedback = '';
  constructor(private device: DeviceService) {}
  press(key: RemoteKey) {
    this.device
      .key(key)
      .subscribe({
        next: () => this.show('Comando enviado'),
        error: () => this.show('A TV Box está offline.'),
      });
  }
  sendText() {
    if (!this.text) return;
    this.device.type(this.text).subscribe({
      next: () => {
        this.text = '';
        this.show('Texto enviado');
      },
      error: () => this.show('Não foi possível enviar o texto.'),
    });
  }
  capture() {
    this.show('A captura ainda não está disponível.');
  }
  show(v: string) {
    this.feedback = v;
    setTimeout(() => (this.feedback = ''), 2500);
  }
}
