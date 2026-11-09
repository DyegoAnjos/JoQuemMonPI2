import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  usuarioService = inject(UsuarioService);

  ngOnInit() {
    if (!this.usuarioService.perfil()) {
      this.usuarioService.carregarPerfil().subscribe();
    }
  }
}