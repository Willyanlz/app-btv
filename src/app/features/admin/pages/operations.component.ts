import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
@Component({
  selector: 'app-operations',
  templateUrl: './operations.component.html',
  styleUrls: ['./operations.component.scss'],
})
export class OperationsComponent implements OnInit {
  executions: any[] = [];
  kind = '';
  title = '';
  message = '';
  descriptions: any = {
    executions: 'Histórico detalhado das ações realizadas.',
    queues: 'Uma execução ativa por dispositivo.',
    diagnostics: 'Status técnico da conexão e do dispositivo.',
    screenshots: 'Galeria de capturas associadas às execuções.',
    settings: 'Timeouts, retenção e preferências da aplicação.',
  };
  checks = [
    { label: 'API', value: 'Online', ok: true },
    { label: 'Cloudflare', value: 'Conectado', ok: true },
    { label: 'Tailscale', value: 'Aguardando login', ok: false },
    { label: 'ADB', value: 'Offline', ok: false },
    { label: 'Foreground', value: 'Indisponível', ok: false },
    { label: 'UIAutomator', value: 'Não testado', ok: false },
  ];
  constructor(
    private route: ActivatedRoute,
    private readonly devices: DeviceService,
  ) {}
  ngOnInit() {
    this.route.data.subscribe((d) => {
      this.kind = d['kind'];
      this.title = d['title'];
    });
    this.devices.logs().subscribe((logs) => this.executions = logs);
  }
}
