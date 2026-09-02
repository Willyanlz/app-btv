import { Component } from '@angular/core';
import { MockDataService } from '../../core/services/mock-data.service';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  message = '';
  constructor(public data: MockDataService) {}
  open(name: string) {
    this.message = `${name}: aguardando conexão com a BTV`;
    setTimeout(() => (this.message = ''), 2500);
  }
}
