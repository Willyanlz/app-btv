import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DiagnosticCheck } from '../../../core/models/device.models';

@Component({
  selector: 'app-operations',
  templateUrl: './operations.component.html',
  styleUrls: ['./operations.component.scss'],
})
export class OperationsComponent implements OnInit {
  executions: any[] = [];
  kind = '';
  title = '';
  descriptions: any = {
    executions: 'Histórico detalhado das ações realizadas.',
    diagnostics:
      'Verifique a rede, o aparelho e o ADB para descobrir o que está acontecendo.',
  };
  checks: DiagnosticCheck[] = [];
  devices: any[] = [];
  deviceId = '';
  diagnosing = false;
  verdict = '';

  constructor(
    private route: ActivatedRoute,
    private readonly deviceSvc: DeviceService,
    private readonly api: ApiService,
    private readonly toasts: ToastService,
  ) {}

  ngOnInit() {
    this.route.data.subscribe((d) => {
      this.kind = d['kind'];
      this.title = d['title'];
    });
    this.deviceSvc.logs().subscribe((logs) => (this.executions = logs));
    this.api.list<any>('devices').subscribe((rows) => {
      this.devices = rows.filter((device) => device.enabled);
      this.deviceId = this.devices[0]?.id ?? '';
    });
  }

  diagnose() {
    if (!this.deviceId) {
      this.toasts.error('Cadastre um dispositivo antes de diagnosticar.');
      return;
    }
    this.diagnosing = true;
    this.checks = [];
    this.verdict = '';
    this.deviceSvc.diagnose(this.deviceId).subscribe({
      next: (result) => {
        this.diagnosing = false;
        this.checks = result.checks;
        this.verdict = result.online
          ? 'Tudo certo — a TV está pronta para receber comandos.'
          : 'Encontramos um problema. Veja as instruções de cada etapa abaixo.';
      },
      error: () => {
        this.diagnosing = false;
        this.toasts.error('Não foi possível concluir o diagnóstico.');
      },
    });
  }

  guidance(check: DiagnosticCheck): string {
    switch (check.id) {
      case 'tailscale':
        return check.ok
          ? ''
          : 'Confira se a TV está ligada e com internet. Depois de religar, aguarde 1 minuto e teste de novo.';
      case 'online':
        return check.ok
          ? ''
          : 'A TV pode estar desligada ou sem energia. Verifique a tomada, o cabo e o botão liga/desliga.';
      case 'adb':
        return check.ok
          ? ''
          : 'Nas configurações de desenvolvedor da TV, confirme "Depuração USB" com "Sempre permitir neste computador" e tente novamente.';
      default:
        return '';
    }
  }

  allOk(): boolean {
    return this.checks.length > 0 && this.checks.every((check) => check.ok);
  }

  hasProblem(): boolean {
    return this.checks.length > 0 && !this.allOk();
  }
}
