export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'WARNING';
export type ExecutionStatus =
  'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export interface Device {
  id: string;
  name: string;
  host: string;
  port: number;
  driverType: 'adb' | 'android-agent';
  status: ConnectionStatus;
  enabled: boolean;
  lastSeen?: string;
}
export interface TvApplication {
  id: string;
  name: string;
  packageName: string;
  adapterType: string;
  enabled: boolean;
  icon: string;
  color: string;
}
export interface Macro {
  id: string;
  name: string;
  description: string;
  appId?: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  enabled: boolean;
  lastRun?: string;
}
export interface Execution {
  id: string;
  device: string;
  macro: string;
  status: ExecutionStatus;
  duration: string;
  createdAt: string;
  error?: string;
}
export interface Automation {
  id: string;
  name: string;
  device: string;
  macro: string;
  trigger: string;
  nextRun: string;
  enabled: boolean;
}
export interface IntentDefinition {
  id: string;
  name: string;
  macro: string;
  priority: number;
  phrases: string[];
  enabled: boolean;
}
export interface DictionaryTerm {
  id: string;
  canonical: string;
  aliases: string[];
  category: string;
  enabled: boolean;
}
export interface MetricCard {
  label: string;
  value: string | number;
  icon: string;
  tone: 'success' | 'danger' | 'info' | 'warning';
}
