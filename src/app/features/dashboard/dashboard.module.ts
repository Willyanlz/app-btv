import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RemotePadComponent } from './remote-pad.component';
@NgModule({
  declarations: [RemotePadComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
  ],
  exports: [RemotePadComponent],
})
export class DashboardModule {}
