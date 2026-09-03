import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { ApiService } from '../../../core/services/api.service';
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
    diagnostics: 'Status técnico da conexão e do dispositivo.',
  };
  checks: any[] = [];
  deviceId = '';
  constructor(
    private route: ActivatedRoute,
    private readonly devices: DeviceService,
    private readonly api: ApiService,
  ) {}
  ngOnInit() {
    this.route.data.subscribe((d) => {
      this.kind = d['kind'];
      this.title = d['title'];
    });
    this.devices.logs().subscribe((logs) => (this.executions = logs));
    this.api
      .list<any>('devices')
      .subscribe(
        (devices) =>
          (this.deviceId = devices.find((device) => device.enabled)?.id ?? ''),
      );
  }

  diagnose() {
    if (!this.deviceId) {
      this.message = 'Cadastre um dispositivo antes de diagnosticar.';
      return;
    }
    this.message = 'Verificando conexão...';
    this.devices.status(this.deviceId).subscribe({
      next: (status) => {
        this.checks = [
          {
            label: 'ADB',
            value: status.connection,
            ok: status.connection === 'device',
          },
        ];
        this.message = 'Diagnóstico concluído.';
      },
      error: () => {
        this.checks = [{ label: 'ADB', value: 'Falha na consulta', ok: false }];
        this.message = 'Não foi possível diagnosticar o dispositivo.';
      },
    });
  }
}
