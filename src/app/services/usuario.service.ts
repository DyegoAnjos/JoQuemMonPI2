import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface PerfilUsuario {
  id: number;
  email: string;
  nome: string;
  foto: string | null;
  xp: number;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost/joquemmon-api/perfil.php';

  readonly usuarioId = 1;
  readonly FOTO_PADRAO = 'images/perfil/treinador_default.jpg';

  readonly fotosValidas = [
    'images/perfil/treinador_default.jpg',
    'images/perfil/rival_default.jpg',
    'images/pokemon/pikachu.png',
    'images/pokemon/charizard.png',
    'images/pokemon/chandelure.png',
  ];

  // Estado global reativo do treinador logado
  perfil = signal<PerfilUsuario | null>(null);
  carregando = signal<boolean>(false);

  // Atalhos prontos para qualquer componente usar
  nomeTreinador = computed(() => this.perfil()?.nome || 'Treinador');
  fotoTreinador = computed(() => this.resolverFotoLocal(this.perfil()?.foto));
  xpTreinador = computed(() => this.perfil()?.xp ?? 0);
  nivelTreinador = computed(() => Math.floor(this.xpTreinador() / 100) + 1);

  resolverFotoLocal(fotoBanco: string | null | undefined): string {
    const caminho = fotoBanco?.trim() ?? '';
    return this.fotosValidas.includes(caminho) ? caminho : this.FOTO_PADRAO;
  }

  carregarPerfil() {
    this.carregando.set(true);
    return this.http.get<PerfilUsuario>(`${this.API_URL}?id=${this.usuarioId}`).pipe(
      tap({
        next: (dados) => {
          this.perfil.set({
            ...dados,
            foto: this.resolverFotoLocal(dados.foto),
          });
          this.carregando.set(false);
        },
        error: () => {
          this.carregando.set(false);
        },
      })
    );
  }

  atualizarPerfil(nome: string, foto: string) {
    const fotoFinal = this.resolverFotoLocal(foto);
    return this.http
      .put<{ mensagem: string }>(`${this.API_URL}?id=${this.usuarioId}`, {
        nome: nome.trim(),
        foto: fotoFinal,
      })
      .pipe(
        tap(() => {
          this.perfil.update((atual) =>
            atual ? { ...atual, nome: nome.trim(), foto: fotoFinal } : null
          );
        })
      );
  }

  adicionarXp(ganhoXp: number) {
    return this.http
      .put<{ mensagem: string; xp: number }>(`${this.API_URL}?id=${this.usuarioId}`, {
        ganho_xp: ganhoXp,
      })
      .pipe(
        tap((res) => {
          this.perfil.update((atual) =>
            atual ? { ...atual, xp: res.xp } : null
          );
        })
      );
  }
}