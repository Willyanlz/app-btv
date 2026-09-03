import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  macros: any[] = [];
  devices: any[] = [];
  selectedMacro: any = null;
  inputValue = '';
  message = '';
  running = false;

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    forkJoin({
      macros: this.api.list<any>('macros'),
      devices: this.api.list<any>('devices'),
    }).subscribe(({ macros, devices }) => {
      this.macros = macros.filter((macro) => macro.enabled);
      this.devices = devices.filter((device) => device.enabled);
    });
  }

  choose(macro: any) {
    if (!this.devices.length) {
      this.message = 'Cadastre um dispositivo antes de executar uma macro.';
      return;
    }
    if (macro.requiresInput) {
      this.selectedMacro = macro;
      this.inputValue = '';
      return;
    }
    this.execute(macro);
  }

  confirmInput() {
    if (!this.inputValue.trim()) return;
    const macro = this.selectedMacro;
    this.selectedMacro = null;
    this.execute(macro, { [macro.inputVariable]: this.inputValue.trim() });
  }

  private execute(macro: any, variables: Record<string, string> = {}) {
    this.running = true;
    this.message = `Executando ${macro.name}...`;
    this.api.runMacro(this.devices[0].id, macro.id, variables).subscribe({
      next: () => {
        this.running = false;
        this.message = `${macro.name} executada.`;
      },
      error: (error) => {
        this.running = false;
        this.message =
          error.error?.message ?? 'Não foi possível executar a macro.';
      },
    });
  }
}
