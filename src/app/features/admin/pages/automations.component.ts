import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Component({ selector: 'app-automations', templateUrl: './automations.component.html', styleUrls: ['./automations.component.scss'] })
export class AutomationsComponent implements OnInit {
  items: any[] = [];
  devices: any[] = [];
  macros: any[] = [];
  editing: any = null;
  constructor(private readonly api: ApiService) {}
  ngOnInit() { this.load(); }
  load() { forkJoin({ items: this.api.list<any>('automations'), devices: this.api.list<any>('devices'), macros: this.api.list<any>('macros') }).subscribe((data) => Object.assign(this, data)); }
  create() { this.editing = { id: '', name: '', deviceId: '', macroId: '', schedule: 'Diariamente · 08:00', enabled: true, isNew: true }; }
  edit(item: any) { this.editing = { ...item, isNew: false }; }
  save() { const value = {...this.editing}; const isNew=value.isNew; delete value.isNew; (isNew?this.api.create('automations',value):this.api.update('automations',value)).subscribe(()=>{this.editing=null;this.load();}); }
  remove(item: any) { if(confirm(`Excluir “${item.name}”?`)) this.api.remove('automations',item.id).subscribe(()=>this.load()); }
  run(item: any) { this.api.runMacro(item.deviceId,item.macroId).subscribe(); }
  name(rows:any[],id:string){return rows.find(x=>x.id===id)?.name??id;}
}
