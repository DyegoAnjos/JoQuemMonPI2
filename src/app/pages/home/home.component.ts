import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  // Caminho da foto de perfil (pode ser substituído dinamicamente pelos dados do usuário logado depois)
  fotoPerfil = 'images/perfil/treinador_default.jpg';
}