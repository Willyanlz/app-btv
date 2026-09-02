import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  password = '';
  error = false;
  loading = false;
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}
  submit() {
    this.loading = true;
    this.error = false;
    this.auth.login(this.password).subscribe(ok => {
      this.loading = false;
      if (ok) this.router.navigateByUrl('/inicio');
      else { this.error = true; this.password = ''; }
    });
  }
}
