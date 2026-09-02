import { Injectable } from '@angular/core';
import {
  Automation,
  Device,
  DictionaryTerm,
  Execution,
  IntentDefinition,
  Macro,
  MetricCard,
  TvApplication,
} from '../../shared/models/product.models';
@Injectable({ providedIn: 'root' })
export class MockDataService {
  devices: Device[] = [
    {
      id: 'btv-sala',
      name: 'BTV Sala',
      host: 'btv-sogra',
      port: 5555,
      driverType: 'adb',
      status: 'OFFLINE',
      enabled: true,
      lastSeen: 'Aguardando POC',
    },
  ];
  apps: TvApplication[] = [
    {
      id: 'iptv-main',
      name: 'BTV',
      packageName: 'A detectar',
      adapterType: 'IptvAdapter',
      enabled: true,
      icon: 'bi-tv',
      color: '#ef5b5b',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      packageName: 'com.google.android.youtube.tv',
      adapterType: 'YouTubeAdapter',
      enabled: true,
      icon: 'bi-youtube',
      color: '#ff0033',
    },
  ];
  macros: Macro[] = [
    {
      id: 'abrir-tv',
      name: 'Abrir TV',
      description: 'Abre o aplicativo principal',
      appId: 'iptv-main',
      version: 1,
      status: 'DRAFT',
      enabled: true,
    },
    {
      id: 'buscar-serie',
      name: 'Buscar série',
      description: 'Pesquisa uma série pelo nome',
      appId: 'iptv-main',
      version: 1,
      status: 'DRAFT',
      enabled: true,
    },
  ];
  executions: Execution[] = [
    {
      id: 'exec-demo',
      device: 'BTV Sala',
      macro: 'Diagnóstico inicial',
      status: 'QUEUED',
      duration: '—',
      createdAt: 'Agora',
    },
  ];
  automations: Automation[] = [
    {
      id: 'morning-tv',
      name: 'Abrir TV de manhã',
      device: 'BTV Sala',
      macro: 'Abrir TV',
      trigger: 'Diário · 08:00',
      nextRun: 'A configurar',
      enabled: false,
    },
  ];
  intents: IntentDefinition[] = [
    {
      id: 'buscar_serie',
      name: 'Buscar conteúdo',
      macro: 'Buscar série',
      priority: 100,
      phrases: ['coloca {query}', 'procura {query}', 'quero assistir {query}'],
      enabled: true,
    },
  ];
  dictionary: DictionaryTerm[] = [
    {
      id: 'buscar',
      canonical: 'buscar',
      aliases: ['procurar', 'achar', 'encontrar'],
      category: 'Ações',
      enabled: true,
    },
    {
      id: 'serie',
      canonical: 'série',
      aliases: ['serie', 'seriado'],
      category: 'Categorias',
      enabled: true,
    },
  ];
  metrics: MetricCard[] = [
    {
      label: 'Dispositivos online',
      value: 0,
      icon: 'bi-wifi',
      tone: 'success',
    },
    {
      label: 'Dispositivos offline',
      value: 1,
      icon: 'bi-wifi-off',
      tone: 'danger',
    },
    {
      label: 'Macros ativas',
      value: 2,
      icon: 'bi-lightning-charge',
      tone: 'info',
    },
    {
      label: 'Automações ativas',
      value: 0,
      icon: 'bi-clock-history',
      tone: 'warning',
    },
  ];
}
