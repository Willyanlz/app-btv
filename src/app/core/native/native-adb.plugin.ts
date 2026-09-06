import { registerPlugin } from '@capacitor/core';

export interface NativeAdbTarget {
  host: string;
  port: number;
}

export interface NativeAdbPlugin {
  status(options: NativeAdbTarget): Promise<{ connection: string; details: string }>;
  shell(options: NativeAdbTarget & { command: string }): Promise<{ output: string; exitCode: number }>;
  key(options: NativeAdbTarget & { key: string }): Promise<void>;
  text(options: NativeAdbTarget & { text: string }): Promise<void>;
  screenshot(options: NativeAdbTarget): Promise<{ data: string; mimeType: string }>;
  install(options: NativeAdbTarget & { path: string }): Promise<{ success: boolean; message: string }>;
  uninstall(options: NativeAdbTarget & { packageName: string }): Promise<{ success: boolean; message: string }>;
}

export const NativeAdb = registerPlugin<NativeAdbPlugin>('NativeAdb');
