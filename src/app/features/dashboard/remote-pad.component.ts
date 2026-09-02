import { Component,EventEmitter,Output } from '@angular/core';import { RemoteKey } from '../../core/models/device.models';@Component({selector:'app-remote-pad',templateUrl: './remote-pad.component.html',styleUrls: ['./remote-pad.component.scss']})
export class RemotePadComponent{@Output()pressed=new EventEmitter<RemoteKey>();send(k:RemoteKey){this.pressed.emit(k)}}
