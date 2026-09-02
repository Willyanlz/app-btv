import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DeviceService } from '../../core/services/device.service';
import { AuthService } from '../../core/services/auth.service';
import {
  DeviceStatus,
  ExecutionLog,
  RemoteKey,
} from '../../core/models/device.models';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  status?: DeviceStatus;
  text = '';
  foreground = '';
  imageUrl = '';
  logs: ExecutionLog[] = [];
  message = '';
  error = false;
  constructor(
    private devices: DeviceService,
    private auth: AuthService,
    private router: Router,
  ) {}
  ngOnInit() {
    this.refresh();
  }
  refresh() {
    this.devices.status().subscribe((x) => (this.status = x));
    this.devices
      .foreground()
      .subscribe({
        next: (x) => (this.foreground = x.foreground || ''),
        error: () => {},
      });
    this.devices.logs().subscribe((x) => (this.logs = x));
    this.refreshScreenshot();
  }
  press(k: RemoteKey) {
    this.devices
      .key(k)
      .subscribe({
        next: () => this.notice(`${k} enviado`),
        error: () => this.notice('Falha ao enviar comando', true),
      });
  }
  typeText() {
    if (!this.text) return;
    this.devices.type(this.text).subscribe({
      next: () => {
        this.text = '';
        this.notice('Texto enviado');
      },
      error: () => this.notice('Falha ao enviar texto', true),
    });
  }
  refreshScreenshot() {
    this.devices.screenshot().subscribe({
      next: (b) => {
        if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
        this.imageUrl = URL.createObjectURL(b);
      },
      error: () => (this.imageUrl = ''),
    });
  }
  notice(m: string, e = false) {
    this.message = m;
    this.error = e;
    setTimeout(() => (this.message = ''), 2500);
  }
  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
