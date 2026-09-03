import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-toasts',
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite">
      <div
        *ngFor="let t of toasts.toasts | async"
        class="toast-item"
        [class.success]="t.type === 'success'"
        [class.error]="t.type === 'error'"
        (click)="toasts.dismiss(t.id)"
        role="status"
        title="Clique para fechar"
      >
        <i
          class="bi"
          [ngClass]="
            t.type === 'success'
              ? 'bi-check-circle-fill'
              : t.type === 'error'
                ? 'bi-x-circle-fill'
                : 'bi-info-circle-fill'
          "
        ></i>
        <span>{{ t.message }}</span>
        <i class="bi bi-x-lg toast-x"></i>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-stack {
        position: fixed;
        top: 84px;
        right: 1.25rem;
        z-index: 3000;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        width: min(92vw, 380px);
        pointer-events: none;
      }
      .toast-item {
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.85rem 1rem;
        background: #16233a;
        border: 1px solid var(--line);
        border-left: 4px solid var(--blue);
        color: var(--ink);
        border-radius: 12px;
        box-shadow: 0 12px 40px rgb(0 0 0 / 45%);
        cursor: pointer;
        font-size: 0.92rem;
        animation: toast-in 0.18s ease;
      }
      .toast-item i.bi:first-child {
        font-size: 1.05rem;
        color: var(--blue);
      }
      .toast-item.success {
        border-left-color: var(--accent);
      }
      .toast-item.success i.bi:first-child {
        color: var(--accent);
      }
      .toast-item.error {
        border-left-color: var(--danger);
      }
      .toast-item.error i.bi:first-child {
        color: var(--danger);
      }
      .toast-x {
        margin-left: auto;
        opacity: 0.55;
      }
      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class ToastsComponent {
  constructor(readonly toasts: ToastService) {}
}