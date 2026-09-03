import { Component } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  message = '';
  error = false;
  apps: any[] = [];
  commands: any[] = [];

  constructor(private readonly api: ApiService) {
    this.api.list<any>('apps').subscribe((apps) => (this.apps = apps));
    this.api.list<any>('commands').subscribe((commands) => (this.commands = commands));
  }

  open(name: string) {
    this.message = `${name}: aguardando conexão com a BTV`;
    setTimeout(() => (this.message = ''), 2500);
  }

  runCommand(commandId: string, label: string) {
    this.api.runCommand(commandId).subscribe({
      next: () => this.notice(`${label} enviado`),
      error: () => this.notice(`Falha ao enviar ${label}. A TV pode estar offline.`, true),
    });
  }

  notice(value: string, withError = false) {
    this.message = value;
    this.error = withError;
    setTimeout(() => (this.message = ''), 2500);
  }
}
