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
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}
  submit() {
    if (this.auth.login(this.password)) {
      this.router.navigateByUrl('/inicio');
    } else {
      this.error = true;
      this.password = '';
    }
  }
}
