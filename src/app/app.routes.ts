import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { HomeComponent } from './pages/home/home.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { BatalhaComponent } from './pages/batalha/batalha.component';
import { PerfilComponent } from './pages/perfil/perfil.component';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent }, 
  { path: 'cadastro', component: CadastroComponent }, 
  { path: 'home', component: HomeComponent },
  { path: 'batalha', component: BatalhaComponent },
  { path: 'inventario', component: InventarioComponent },
  { path: 'baralhos', loadComponent: () => import('./pages/baralhos/baralhos.component').then(m => m.BaralhosComponent) }, 
  { path: 'perfil', component: PerfilComponent }, 
];