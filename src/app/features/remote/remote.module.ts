import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardModule } from '../dashboard/dashboard.module';
import { RemoteComponent } from './remote.component';
@NgModule({
  declarations: [RemoteComponent],
  imports: [
    CommonModule,
    FormsModule,
    DashboardModule,
    RouterModule.forChild([{ path: '', component: RemoteComponent }]),
  ],
})
export class RemoteModule {}
