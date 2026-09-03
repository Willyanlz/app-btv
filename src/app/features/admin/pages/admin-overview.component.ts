import { Component } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
@Component({
  selector: 'app-admin-overview',
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss'],
})
export class AdminOverviewComponent {
  metrics: any[] = [];
  executions: any[] = [];
  constructor(private readonly api: ApiService) { forkJoin({ devices: api.list<any>('devices'), macros: api.list<any>('macros'), automations: api.list<any>('automations') }).subscribe(({devices, macros, automations}) => this.metrics = [{label:'Dispositivos cadastrados',value:devices.length,icon:'bi-hdd-network'},{label:'Macros ativas',value:macros.filter(x=>x.enabled).length,icon:'bi-lightning'},{label:'Automações ativas',value:automations.filter(x=>x.enabled).length,icon:'bi-clock'}]); }
}
