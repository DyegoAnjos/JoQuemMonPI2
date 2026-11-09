import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { HomeComponent } from './pages/home/home.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { BatalhaComponent } from './pages/batalha/batalha.component';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  //{ path: 'login', component: LoginComponent }, Gael
  //{ path: 'cadastro', component: CadastroComponent }, Gael
  { path: 'home', component: HomeComponent },
  { path: 'batalha', component: BatalhaComponent },
  { path: 'inventario', component: InventarioComponent }, 
  // { path: 'perfil', component: PerfilComponent }, Gael
];