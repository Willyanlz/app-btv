import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Toasts sobrepostos à tela (position: fixed), clicáveis para fechar e com
 * desaparecimento automático. Não alteram o layout das páginas.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly subject = new BehaviorSubject<Toast[]>([]);
  readonly toasts = this.subject.asObservable();
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  success(message: string) {
    this.push('success', message, 3500);
  }

  error(message: string) {
    this.push('error', message, 6000);
  }

  info(message: string) {
    this.push('info', message, 3500);
  }

  dismiss(id: number) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.subject.next(this.subject.value.filter((toast) => toast.id !== id));
  }

  private push(type: Toast['type'], message: string, duration: number) {
    const toast: Toast = { id: this.nextId++, message, type };
    this.subject.next([...this.subject.value, toast]);
    this.timers.set(
      toast.id,
      setTimeout(() => this.dismiss(toast.id), duration),
    );
  }
}