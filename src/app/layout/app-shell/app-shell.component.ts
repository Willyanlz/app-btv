import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastsComponent } from '../app-toasts/app-toasts.component';
@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [CommonModule, RouterModule, ToastsComponent],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent {
  menu = false;
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}
  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
