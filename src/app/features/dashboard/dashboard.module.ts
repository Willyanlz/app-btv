import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { RemotePadComponent } from './remote-pad.component';
@NgModule({
  declarations: [DashboardComponent, RemotePadComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: DashboardComponent }]),
  ],
  exports: [RemotePadComponent],
})
export class DashboardModule {}
