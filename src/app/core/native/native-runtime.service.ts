import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { NativeAdb, NativeAdbTarget } from './native-adb.plugin';
import { LocalStoreService } from './local-store.service';

@Injectable({ providedIn: 'root' })
export class NativeRuntimeService {
  private readonly busyDevices = new Set<string>();

  constructor(private readonly store: LocalStoreService) {}

  get enabled() {
    return Capacitor.getPlatform() === 'android';
  }

  async target(deviceId: string): Promise<NativeAdbTarget> {
    const device = await this.store.get<any>('devices', deviceId);
    if (!device?.host) throw new Error('Aparelho não encontrado');
    return { host: device.host, port: Number(device.port || 5555) };
  }

  async feedback(kind: 'tap' | 'success' | 'error' = 'tap') {
    if (!this.enabled) {
      navigator.vibrate?.(kind === 'tap' ? 18 : kind === 'success' ? [25, 35, 25] : [60, 40, 60]);
      return;
    }
    if (kind === 'tap') await Haptics.impact({ style: ImpactStyle.Light });
    else {
      await Haptics.notification({
        type: kind === 'success' ? NotificationType.Success : NotificationType.Error,
      });
    }
  }

  async status(deviceId: string) {
    const result = await NativeAdb.status(await this.target(deviceId));
    return { device: deviceId, ...result };
  }

  async key(deviceId: string, key: string) {
    await this.feedback();
    await NativeAdb.key({ ...(await this.target(deviceId)), key });
  }

  async text(deviceId: string, text: string) {
    await NativeAdb.text({ ...(await this.target(deviceId)), text });
  }

  async shell(deviceId: string, command: string) {
    return NativeAdb.shell({ ...(await this.target(deviceId)), command });
  }

  async runMacro(
    deviceId: string,
    macroId: string,
    variables: Record<string, string>,
    from = 0,
    to?: number,
    stack: string[] = [],
  ): Promise<{ ok: true; steps: number }> {
    if (this.busyDevices.has(deviceId) && stack.length === 0) {
      throw new Error('Já existe uma macro em execução nesta TV');
    }
    if (stack.includes(macroId)) throw new Error('Uma macro não pode chamar a si mesma');
    const macro = await this.store.get<any>('macros', macroId);
    if (!macro?.enabled) throw new Error('Macro não encontrada ou desativada');
    if (stack.length === 0) this.busyDevices.add(deviceId);
    const steps = macro.steps ?? [];
    const last = Math.min(to ?? steps.length - 1, steps.length - 1);
    try {
      for (let index = Math.max(0, from); index <= last; index += 1) {
        try {
          await this.executeStep(deviceId, steps[index], variables, [...stack, macroId]);
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          throw new Error(`Falha no passo ${index + 1}: ${reason}`);
        }
      }
      await this.store.log(`macro:${macroId}`, 'success', deviceId);
      await this.feedback('success');
      return { ok: true, steps: Math.max(0, last - from + 1) };
    } catch (error) {
      await this.store.log(`macro:${macroId}`, 'failed', String(error));
      await this.feedback('error');
      throw error;
    } finally {
      if (stack.length === 0) this.busyDevices.delete(deviceId);
    }
  }

  private async executeStep(
    deviceId: string,
    step: any,
    variables: Record<string, string>,
    stack: string[],
  ): Promise<void> {
    if (step.type === 'key') await this.key(deviceId, step.key);
    else if (step.type === 'wait') await new Promise((resolve) => setTimeout(resolve, step.milliseconds));
    else if (step.type === 'text') {
      const text = String(step.value ?? '').replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => variables[key] ?? '');
      await this.text(deviceId, text);
    } else if (step.type === 'openApp') {
      await this.shell(deviceId, `monkey -p ${this.safePackage(step.packageName)} -c android.intent.category.LAUNCHER 1`);
    } else if (step.type === 'callMacro') {
      await this.runMacro(deviceId, step.macroId, variables, 0, undefined, stack);
    } else if (step.type === 'screenCondition') {
      const screen = await this.store.get<any>('screens', step.screenId);
      if (!screen) throw new Error('Tela conhecida não encontrada');
      const foreground = await this.foreground(deviceId);
      const matches = foreground.packageName === screen.packageName && foreground.activityName === screen.activityName;
      const condition = step.operator === 'isNot' ? !matches : matches;
      for (const nested of condition ? step.whenTrue ?? [] : step.whenFalse ?? []) {
        await this.executeStep(deviceId, nested, variables, stack);
      }
    } else if (step.type === 'clickFocused') {
      await this.key(deviceId, 'ENTER');
    } else if (step.type === 'clickButton') {
      const button = await this.store.get<any>('buttons', step.buttonId);
      if (!button) throw new Error('Botão conhecido não encontrado');
      await this.shell(deviceId, `input tap ${Number(button.centerX)} ${Number(button.centerY)}`);
    } else if (step.type === 'focusButton') {
      throw new Error('Foco inteligente ainda precisa ser treinado neste aparelho');
    } else {
      throw new Error(`Ação não suportada: ${step.type}`);
    }
  }

  async foreground(deviceId: string) {
    const { output } = await this.shell(deviceId, 'dumpsys window windows');
    const match = output.match(/(?:mCurrentFocus|mFocusedApp).*?\s([\w.]+)\/([\w.$]+)/);
    return {
      packageName: match?.[1] ?? null,
      activityName: match?.[2] ?? null,
    };
  }

  private safePackage(value: string) {
    if (!/^[a-zA-Z0-9._]+$/.test(value ?? '')) throw new Error('Pacote inválido');
    return value;
  }
}
