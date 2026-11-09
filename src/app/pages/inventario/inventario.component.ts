import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartaComponent } from '../carta/carta.component';
import { CartaPokemon } from '../carta/carta.model';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [RouterLink, CartaComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost/joquemmon-api/cartas.php';

  // ID do usuário logado (será substituído pela sessão de login futuramente)
  get usuarioId(): number {
    return this.usuarioService.usuarioId;
  }

  // Estados reativos do Inventário
  minhasCartas = signal<CartaPokemon[]>([]);
  carregando = signal<boolean>(true);
  erroCarregamento = signal<string>('');

  ngOnInit() {
    this.carregarInventario();
  }

  carregarInventario() {
    this.carregando.set(true);
    this.erroCarregamento.set('');

    this.http
      .get<CartaPokemon[]>(`${this.API_URL}?usuario_id=${this.usuarioId}`)
      .subscribe({
        next: (cartas) => {
          this.minhasCartas.set(cartas);
          this.carregando.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar inventário:', err);
          this.erroCarregamento.set(
            'Não foi possível carregar suas cartas. Verifique se o Apache e o MySQL estão ligados.'
          );
          this.carregando.set(false);
        },
      });
  }
}