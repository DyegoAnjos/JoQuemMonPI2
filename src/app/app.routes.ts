import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { HomeComponent } from './pages/home/home.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { CartaComponent } from './pages/carta/carta.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: CadastroComponent },
  { path: 'home', component: HomeComponent },
  { path: 'carta', component: CartaComponent },
  // { path: 'batalha', component: BatalhaComponent }, Dyego
  { path: 'inventario', component: InventarioComponent }, 
  // { path: 'perfil', component: PerfilComponent }, Gael
];