export type RemoteKey =
  | 'HOME'
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'ENTER'
  | 'BACK'
  | 'PLAY_PAUSE'
  | 'VOLUME_UP'
  | 'VOLUME_DOWN'
  | 'MUTE';
// As setas do componente visual são convertidas para DPAD_* antes do envio.
export interface DeviceStatus {
  device: string;
  connection: 'device' | 'unauthorized' | 'offline' | 'unreachable' | 'unknown';
  details: string;
}
export interface ExecutionLog {
  id: number;
  action: string;
  status: string;
  message: string;
  created_at: string;
}
