import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';


export interface PerfilUsuario {
  id: number;
  email: string;
  nome: string;
  foto: string;
  xp: number;
}

interface AuthResponse {
  mensagem: string;
  usuario: PerfilUsuario;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private readonly API_PERFIL = 'http://localhost/joquemmon-api/perfil.php';
  private readonly API_AUTH = 'http://localhost/joquemmon-api/auth.php';
  private readonly STORAGE_KEY = 'joquemmon_usuario_id';

  private _usuarioId = signal<number>(this.lerIdSalvo());
  perfil = signal<PerfilUsuario | null>(null);

  get usuarioId(): number {
    return this._usuarioId();
  }

  estaLogado = computed(() => this._usuarioId() > 0);
  nomeTreinador = computed(() => this.perfil()?.nome || 'Treinador');
  fotoTreinador = computed(() => this.perfil()?.foto || 'images/perfil/treinador_default.jpg');
  xpTreinador = computed(() => this.perfil()?.xp ?? 0);

  private lerIdSalvo(): number {
    if (isPlatformBrowser(this.platformId)) {
      const salvo = localStorage.getItem(this.STORAGE_KEY);
      if (salvo && Number(salvo) > 0) {
        return Number(salvo);
      }
    }
    return 1; // Mantém fallback para o usuário 1 enquanto você testa
  }

  private definirSessao(usuario: PerfilUsuario) {
    this._usuarioId.set(usuario.id);
    this.perfil.set(usuario);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, String(usuario.id));
    }
  }

  login(email: string, senha: string) {
    return this.http
      .post<AuthResponse>(this.API_AUTH, { acao: 'login', email, senha })
      .pipe(tap((res) => this.definirSessao(res.usuario)));
  }

  cadastrar(nome: string, email: string, senha: string) {
    return this.http
      .post<AuthResponse>(this.API_AUTH, { acao: 'cadastro', nome, email, senha })
      .pipe(tap((res) => this.definirSessao(res.usuario)));
  }

  logout() {
    this._usuarioId.set(0);
    this.perfil.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  carregarPerfil() {
    return this.http
      .get<PerfilUsuario>(`${this.API_PERFIL}?id=${this.usuarioId}`)
      .pipe(tap((dados) => this.perfil.set(dados)));
  }

  atualizarPerfil(nome: string, foto: string) {
    return this.http
      .put<{ mensagem: string }>(`${this.API_PERFIL}?id=${this.usuarioId}`, { nome, foto })
      .pipe(
        tap(() => {
          this.perfil.update((atual) => (atual ? { ...atual, nome, foto } : null));
        })
      );
  }

  adicionarXp(ganhoXp: number) {
    return this.http
      .put<{ mensagem: string; xp: number }>(`${this.API_PERFIL}?id=${this.usuarioId}`, {
        ganho_xp: ganhoXp,
      })
      .pipe(
        tap((res) => {
          this.perfil.update((atual) => (atual ? { ...atual, xp: res.xp } : null));
        })
      );
  }
}