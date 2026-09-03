import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService, Resource } from '../../../core/services/api.service';

@Component({ selector: 'app-catalog', templateUrl: './catalog.component.html', styleUrls: ['./catalog.component.scss'] })
export class CatalogComponent implements OnInit, OnDestroy {
  kind: Resource = 'devices';
  title = '';
  subtitle = '';
  rows: any[] = [];
  editing: any = null;
  error = '';
  private routeSubscription?: Subscription;

  constructor(private readonly route: ActivatedRoute, private readonly api: ApiService) {}
  ngOnInit() {
    this.routeSubscription = this.route.data.subscribe((data) => {
      this.kind = data['kind']; this.title = data['title']; this.subtitle = data['subtitle']; this.load();
    });
  }
  ngOnDestroy() { this.routeSubscription?.unsubscribe(); }
  load() { this.api.list<any>(this.kind).subscribe({ next: (rows) => this.rows = rows, error: () => this.error = 'Falha ao carregar.' }); }
  openForm() {
    if (this.kind === 'devices') {
      this.editing = { id: '', name: '', host: '', port: 5555, enabled: true, isNew: true };
      return;
    }
    if (this.kind === 'apps') {
      this.editing = { id: '', name: '', packageName: '', enabled: true, isNew: true };
      return;
    }
    if (this.kind === 'commands') {
      this.editing = {
        id: '',
        label: '',
        aliasesText: '',
        keysText: '',
        enabled: true,
        isNew: true,
      };
      return;
    }
    this.editing = { id: '', name: '', macroId: '', phrasesText: '', enabled: true, isNew: true };
  }
  edit(row: any) {
    if (this.kind === 'commands') {
      this.editing = {
        ...row,
        aliasesText: row.aliases?.join('\n') ?? '',
        keysText: row.keys?.join('\n') ?? '',
        isNew: false,
      };
      return;
    }
    this.editing = { ...row, phrasesText: row.phrases?.join('\n') ?? '', isNew: false };
  }
  detail(row: any) {
    if (this.kind === 'devices') return `${row.host}:${row.port}`;
    if (this.kind === 'apps') return row.packageName;
    if (this.kind === 'commands') {
      return `${row.aliases?.length ?? 0} aliases · ${row.keys?.length ?? 0} teclas`;
    }
    return `${row.macroId} · ${row.phrases?.length ?? 0} frases`;
  }
  save() {
    const value = { ...this.editing };
    const isNew = value.isNew;
    delete value.isNew;
    if (this.kind === 'intents') {
      value.phrases = value.phrasesText
        .split('\n')
        .map((x: string) => x.trim())
        .filter(Boolean);
      delete value.phrasesText;
    }
    if (this.kind === 'commands') {
      value.aliases = value.aliasesText
        .split('\n')
        .map((x: string) => x.trim())
        .filter(Boolean);
      value.keys = value.keysText
        .split('\n')
        .map((x: string) => x.trim().toUpperCase())
        .filter(Boolean);
      delete value.aliasesText;
      delete value.keysText;
    }
    const request = isNew ? this.api.create(this.kind, value) : this.api.update(this.kind, value);
    request.subscribe({
      next: () => {
        this.editing = null;
        this.load();
      },
      error: () => (this.error = 'Não foi possível salvar. Revise os campos.'),
    });
  }
  remove(row: any) { if (confirm(`Excluir “${row.name}”?`)) this.api.remove(this.kind, row.id).subscribe(() => this.load()); }
}
