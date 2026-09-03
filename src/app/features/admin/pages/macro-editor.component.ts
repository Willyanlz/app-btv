import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { SelectedDeviceService } from '../../../core/services/selected-device.service';

@Component({
  selector: 'app-macro-editor',
  templateUrl: './macro-editor.component.html',
  styleUrls: ['./catalog.component.scss'],
})
export class MacroEditorComponent implements OnInit {
  macros: any[] = [];
  actions: any[] = [];
  apps: { packageName: string; name: string }[] = [];
  editing: any = null;
  deviceId = '';
  testing = false;
  saving = false;

  constructor(
    private readonly api: ApiService,
    private readonly route: ActivatedRoute,
    private readonly toasts: ToastService,
    private readonly selectedDevice: SelectedDeviceService,
  ) {}

  ngOnInit() {
    this.load();
    this.api.actions().subscribe((actions) => (this.actions = actions));
    this.api.list<any>('devices').subscribe((devices) => {
      const enabledDevices = devices.filter((item) => item.enabled);
      const selectedId = this.selectedDevice.resolve(enabledDevices);
      const device = enabledDevices.find((item) => item.id === selectedId);
      if (!device) return;
      this.deviceId = device.id;
      this.api.deviceApps(device.id).subscribe((apps) => (this.apps = apps));
    });
    const packageName = this.route.snapshot.queryParamMap.get('app');
    if (packageName) {
      this.create();
      this.editing.name = `Abrir ${packageName}`;
      this.editing.steps.push({ type: 'openApp', packageName });
    }
  }

  load() {
    this.api.list<any>('macros').subscribe((rows) => (this.macros = rows));
  }
  create() {
    this.editing = {
      id: '',
      name: '',
      description: '',
      appPackage: '',
      steps: [],
      requiresInput: false,
      inputLabel: 'O que deseja buscar?',
      inputVariable: 'texto',
      enabled: true,
      isNew: true,
    };
  }
  edit(macro: any) {
    this.editing = {
      ...macro,
      steps: macro.steps.map((step: any) => ({ ...step })),
      isNew: false,
    };
  }
  clone(macro: any) {
    this.editing = {
      ...macro,
      id: `${macro.id}-copia`,
      name: `${macro.name} (cópia)`,
      steps: macro.steps.map((step: any) => ({ ...step })),
      isNew: true,
    };
  }
  add(action: any) {
    const step =
      action.type === 'key'
        ? { type: 'key', key: action.key }
        : action.type === 'wait'
          ? { type: 'wait', milliseconds: 800 }
          : action.type === 'text'
            ? { type: 'text', value: `{{${this.editing.inputVariable}}}` }
            : action.type === 'callMacro'
              ? { type: 'callMacro', macroId: '' }
              : { type: 'openApp', packageName: '' };
    this.editing.steps.push(step);
  }
  removeStep(index: number) {
    this.editing.steps.splice(index, 1);
  }
  move(index: number, direction: number) {
    const target = index + direction;
    if (target < 0 || target >= this.editing.steps.length) return;
    [this.editing.steps[index], this.editing.steps[target]] = [
      this.editing.steps[target],
      this.editing.steps[index],
    ];
  }
  label(step: any) {
    return (
      this.actions.find(
        (item) =>
          item.type === step.type && (!step.key || item.key === step.key),
      )?.label ?? step.type
    );
  }
  test(from: number, to: number) {
    if (!this.deviceId) {
      this.toasts.error('Cadastre um dispositivo antes de testar.');
      return;
    }
    if (this.testing) return;
    if (this.editing.isNew) {
      this.toasts.error('Salve a macro antes de testar os passos.');
      return;
    }
    const variables: Record<string, string> = {};
    if (this.editing.requiresInput) {
      const value = prompt(this.editing.inputLabel);
      if (value === null) return;
      variables[this.editing.inputVariable] = value;
    }
    this.testing = true;
    const single = from === to;
    this.toasts.info(`Testando passo ${from + 1}...`);
    this.api
      .testMacro(this.deviceId, this.editing.id, from, to, variables)
      .subscribe({
        next: () => {
          this.testing = false;
          this.toasts.success(
            single ? `Passo ${from + 1} concluído.` : 'Teste concluído.',
          );
        },
        error: (error) => {
          this.testing = false;
          const details = error.error?.stepNumber
            ? `Passo ${error.error.stepNumber}: ${error.error.cause}`
            : error.error?.message;
          this.toasts.error(details ?? `Falha no passo ${from + 1}.`);
        },
      });
  }
  save() {
    if (this.saving) return;
    this.saving = true;
    const value = { ...this.editing };
    const isNew = value.isNew;
    delete value.isNew;
    (isNew
      ? this.api.create('macros', value)
      : this.api.update('macros', value)
    ).subscribe({
      next: () => {
        this.saving = false;
        this.editing = null;
        this.load();
        this.toasts.success('Macro salva.');
      },
      error: () => {
        this.saving = false;
        this.toasts.error('Revise os campos e adicione pelo menos um passo.');
      },
    });
  }
  remove(macro: any) {
    if (confirm(`Excluir "${macro.name}"?`)) {
      this.api.remove('macros', macro.id).subscribe(() => {
        this.load();
        this.toasts.success('Macro excluída.');
      });
    }
  }
}
