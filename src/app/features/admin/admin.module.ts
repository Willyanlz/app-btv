import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AdminOverviewComponent } from './pages/admin-overview.component';
import { CatalogComponent } from './pages/catalog.component';
import { OperationsComponent } from './pages/operations.component';
import { MacroEditorComponent } from './pages/macro-editor.component';
import { DeviceAppsComponent } from './pages/device-apps.component';
import { SettingsComponent } from './pages/settings.component';
const routes: Routes = [
  { path: '', component: AdminOverviewComponent },
  {
    path: 'dispositivos',
    component: CatalogComponent,
    data: {
      kind: 'devices',
      title: 'Dispositivos',
      subtitle: 'Gerencie as TVs e os drivers de conexão.',
    },
  },
  {
    path: 'aplicativos',
    component: DeviceAppsComponent,
  },
  {
    path: 'comandos',
    component: CatalogComponent,
    data: {
      kind: 'commands',
      title: 'Comandos',
      subtitle: 'Dicionário de texto amigável para teclas ADB.',
    },
  },
  {
    path: 'macros',
    component: MacroEditorComponent,
  },
  {
    path: 'execucoes',
    component: OperationsComponent,
    data: { kind: 'executions', title: 'Execuções' },
  },
  {
    path: 'diagnostico',
    component: OperationsComponent,
    data: { kind: 'diagnostics', title: 'Diagnóstico' },
  },
  {
    path: 'configuracoes',
    component: SettingsComponent,
  },
];
@NgModule({
  declarations: [
    AdminOverviewComponent,
    CatalogComponent,
    OperationsComponent,
    MacroEditorComponent,
    DeviceAppsComponent,
    SettingsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
})
export class AdminModule {}
