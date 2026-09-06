import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type LocalResource =
  | 'devices'
  | 'apps'
  | 'macros'
  | 'intents'
  | 'automations'
  | 'commands'
  | 'screens'
  | 'buttons'
  | 'logs';

interface LocalDatabase {
  version: number;
  resources: Record<LocalResource, any[]>;
}

const DATABASE_KEY = 'labswill_local_database_v1';

@Injectable({ providedIn: 'root' })
export class LocalStoreService {
  private queue = Promise.resolve();

  async list<T>(resource: LocalResource): Promise<T[]> {
    const database = await this.read();
    return structuredClone(database.resources[resource] ?? []) as T[];
  }

  async get<T extends { id: string }>(resource: LocalResource, id: string) {
    return (await this.list<T>(resource)).find((item) => item.id === id);
  }

  async save<T extends { id: string }>(resource: LocalResource, value: T): Promise<T> {
    await this.mutate((database) => {
      const rows = database.resources[resource];
      const index = rows.findIndex((item) => item.id === value.id);
      if (index >= 0) rows[index] = structuredClone(value);
      else rows.push(structuredClone(value));
    });
    return value;
  }

  async remove(resource: LocalResource, id: string): Promise<void> {
    await this.mutate((database) => {
      database.resources[resource] = database.resources[resource].filter(
        (item) => item.id !== id,
      );
    });
  }

  async log(action: string, status: string, message = '') {
    await this.mutate((database) => {
      database.resources.logs.unshift({
        id: Date.now(),
        action,
        status,
        message,
        created_at: new Date().toISOString(),
      });
      database.resources.logs = database.resources.logs.slice(0, 300);
    });
  }

  private async mutate(change: (database: LocalDatabase) => void) {
    let operation!: Promise<void>;
    this.queue = this.queue.then(async () => {
      const database = await this.read();
      change(database);
      await Preferences.set({ key: DATABASE_KEY, value: JSON.stringify(database) });
    });
    operation = this.queue;
    return operation;
  }

  private async read(): Promise<LocalDatabase> {
    const { value } = await Preferences.get({ key: DATABASE_KEY });
    if (value) return JSON.parse(value) as LocalDatabase;
    return {
      version: 1,
      resources: {
        devices: [],
        apps: [],
        macros: [],
        intents: [],
        automations: [],
        commands: [],
        screens: [],
        buttons: [],
        logs: [],
      },
    };
  }
}
