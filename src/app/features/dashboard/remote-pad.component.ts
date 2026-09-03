import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RemoteKey } from '../../core/models/device.models';
@Component({
  selector: 'app-remote-pad',
  templateUrl: './remote-pad.component.html',
  styleUrls: ['./remote-pad.component.scss'],
})
export class RemotePadComponent {
  @Input() disabled = false;
  @Output() pressed = new EventEmitter<RemoteKey>();
  send(k: RemoteKey) {
    if (this.disabled) return;
    this.pressed.emit(k);
  }
}
