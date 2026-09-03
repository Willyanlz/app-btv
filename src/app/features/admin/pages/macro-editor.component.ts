import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-macro-editor',
  templateUrl: './macro-editor.component.html',
  styleUrls: ['./catalog.component.scss'],
})
export class MacroEditorComponent implements OnInit {
  macros: any[] = [];
  actions: any[] = [];
  editing: any = null;
  error = '';

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.load();
    this.api.actions().subscribe((actions) => (this.actions = actions));
  }
  load() {
    this.api.list<any>('macros').subscribe((rows) => (this.macros = rows));
  }
  create() {
    this.editing = {
      id: '',
      name: '',
      description: '',
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
  add(action: any) {
    const step =
      action.type === 'key'
        ? { type: 'key', key: action.key }
        : action.type === 'wait'
          ? { type: 'wait', milliseconds: 800 }
          : action.type === 'text'
            ? { type: 'text', value: `{{${this.editing.inputVariable}}}` }
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
        (x) => x.type === step.type && (!step.key || x.key === step.key),
      )?.label ?? step.type
    );
  }
  save() {
    const value = { ...this.editing };
    const isNew = value.isNew;
    delete value.isNew;
    const request = isNew
      ? this.api.create('macros', value)
      : this.api.update('macros', value);
    request.subscribe({
      next: () => {
        this.editing = null;
        this.load();
      },
      error: () =>
        (this.error = 'Revise os campos e adicione pelo menos um passo.'),
    });
  }
  remove(macro: any) {
    if (confirm(`Excluir “${macro.name}”?`))
      this.api.remove('macros', macro.id).subscribe(() => this.load());
  }
}
