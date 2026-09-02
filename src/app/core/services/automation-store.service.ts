import { Injectable, signal } from '@angular/core';
import { Automation } from '../../shared/models/product.models';
import { MockDataService } from './mock-data.service';
const KEY = 'universal_remote_automations';
@Injectable({ providedIn: 'root' })
export class AutomationStoreService {
  private readonly state = signal<Automation[]>(this.restore());
  readonly items = this.state.asReadonly();
  constructor(private defaults: MockDataService) {}
  private restore(): Automation[] {
    try {
      const saved = localStorage.getItem(KEY);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'morning-tv',
              name: 'Abrir TV de manhã',
              device: 'BTV Sala',
              macro: 'Abrir TV',
              trigger: 'Diariamente · 08:00',
              nextRun: 'A configurar',
              enabled: false,
            },
          ];
    } catch {
      return [];
    }
  }
  save(item: Automation) {
    const current = this.state();
    this.commit(
      current.some((x) => x.id === item.id)
        ? current.map((x) => (x.id === item.id ? item : x))
        : [...current, item],
    );
  }
  remove(id: string) {
    this.commit(this.state().filter((x) => x.id !== id));
  }
  toggle(id: string, enabled: boolean) {
    this.commit(this.state().map((x) => (x.id === id ? { ...x, enabled } : x)));
  }
  private commit(value: Automation[]) {
    this.state.set(value);
    localStorage.setItem(KEY, JSON.stringify(value));
    this.defaults.automations = value;
  }
}
