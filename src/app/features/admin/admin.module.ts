import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AdminOverviewComponent } from './pages/admin-overview.component';
import { CatalogComponent } from './pages/catalog.component';
import { OperationsComponent } from './pages/operations.component';
import { MacroEditorComponent } from './pages/macro-editor.component';
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
    component: CatalogComponent,
    data: {
      kind: 'apps',
      title: 'Aplicativos',
      subtitle: 'Pacotes e adapters disponíveis na BTV.',
    },
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
    path: 'intents',
    component: CatalogComponent,
    data: {
      kind: 'intents',
      title: 'Intents',
      subtitle: 'Associe frases naturais às macros permitidas.',
    },
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
];
@NgModule({
  declarations: [
    AdminOverviewComponent,
    CatalogComponent,
    OperationsComponent,
    MacroEditorComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
})
export class AdminModule {}
