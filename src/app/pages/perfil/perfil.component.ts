import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

export interface PerfilUsuario {
  id: number;
  email: string;
  nome: string;
  foto: string | null;
  xp: number;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private readonly API_URL = 'http://localhost/joquemmon-api/perfil.php';

  readonly usuarioId = 1;
  readonly FOTO_PADRAO = 'images/perfil/treinador_default.jpg';

  // Imagens exatamente como estão na pasta public/images/
  readonly avataresDisponiveis = [
    { label: 'Treinador Padrão', url: 'images/perfil/treinador_default.jpg' },
    { label: 'Rival Padrão', url: 'images/perfil/rival_default.jpg' },
    { label: 'Pikachu', url: 'images/pokemon/pikachu.png' },
    { label: 'Charizard', url: 'images/pokemon/charizard.png' },
    { label: 'Chandelure', url: 'images/pokemon/chandelure.png' },
  ];

  // Estados reativos
  perfil = signal<PerfilUsuario | null>(null);
  carregando = signal<boolean>(true);
  salvando = signal<boolean>(false);
  editando = signal<boolean>(false); // Controla a exibição das opções de edição
  erroCarregamento = signal<string>('');
  mensagemStatus = signal<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  nivelAtual = computed(() => Math.floor((this.perfil()?.xp ?? 0) / 100) + 1);
  progressoNivel = computed(() => (this.perfil()?.xp ?? 0) % 100);

  perfilForm = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(45)]],
    foto: [this.FOTO_PADRAO, [Validators.required]],
  });

  ngOnInit() {
    this.carregarPerfil();
  }

  // Garante que apenas caminhos locais válidos das pastas images/perfil ou images/pokemon sejam usados
  private resolverFotoLocal(fotoBanco: string | null | undefined): string {
    const caminho = fotoBanco?.trim() ?? '';
    const existeNoProjeto = this.avataresDisponiveis.some((av) => av.url === caminho);
    return existeNoProjeto ? caminho : this.FOTO_PADRAO;
  }

  carregarPerfil() {
    this.carregando.set(true);
    this.erroCarregamento.set('');

    this.http.get<PerfilUsuario>(`${this.API_URL}?id=${this.usuarioId}`).subscribe({
      next: (dados) => {
        const fotoValida = this.resolverFotoLocal(dados.foto);

        this.perfil.set({
          ...dados,
          foto: fotoValida,
        });

        this.perfilForm.patchValue({
          nome: dados.nome,
          foto: fotoValida,
        });

        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar perfil:', err);
        this.erroCarregamento.set(
          'Não foi possível carregar os dados do perfil. Verifique se o Apache e o MySQL estão ligados.'
        );
        this.carregando.set(false);
      },
    });
  }

  abrirEdicao() {
    const atual = this.perfil();
    if (!atual) return;

    this.perfilForm.patchValue({
      nome: atual.nome,
      foto: atual.foto || this.FOTO_PADRAO,
    });
    this.mensagemStatus.set(null);
    this.editando.set(true);
  }

  cancelarEdicao() {
    const atual = this.perfil();
    if (atual) {
      this.perfilForm.patchValue({
        nome: atual.nome,
        foto: atual.foto || this.FOTO_PADRAO,
      });
    }
    this.editando.set(false);
  }

  selecionarAvatar(url: string) {
    this.perfilForm.patchValue({ foto: url });
  }

  salvarAlteracoes() {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    const { nome, foto } = this.perfilForm.getRawValue();
    const fotoFinal = this.resolverFotoLocal(foto);

    this.salvando.set(true);
    this.mensagemStatus.set(null);

    this.http
      .put<{ mensagem: string }>(`${this.API_URL}?id=${this.usuarioId}`, {
        nome: nome.trim(),
        foto: fotoFinal,
      })
      .subscribe({
        next: (res) => {
          this.perfil.update((atual) =>
            atual ? { ...atual, nome: nome.trim(), foto: fotoFinal } : null
          );
          this.salvando.set(false);
          this.editando.set(false); // Fecha o painel de edição após salvar
          this.mensagemStatus.set({
            tipo: 'sucesso',
            texto: res.mensagem || 'Perfil atualizado com sucesso!',
          });

          setTimeout(() => this.mensagemStatus.set(null), 4000);
        },
        error: (err) => {
          console.error('Erro ao salvar perfil:', err);
          this.salvando.set(false);
          this.mensagemStatus.set({
            tipo: 'erro',
            texto: err.error?.erro || 'Erro ao salvar as alterações no banco de dados.',
          });
        },
      });
  }
}