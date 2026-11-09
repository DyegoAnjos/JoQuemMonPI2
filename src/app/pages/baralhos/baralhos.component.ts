import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Baralho } from './baralho.model';
import { CartaPokemon } from '../carta/carta.model';
import { UsuarioService } from '../../services/usuario.service';

type ModoModal = 'CRIAR' | 'EDITAR';
type AbaEdicao = 'REMOVER' | 'ADICIONAR';

@Component({
  selector: 'app-baralhos',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './baralhos.component.html',
  styleUrl: './baralhos.component.scss',
})
export class BaralhosComponent implements OnInit {
  private http = inject(HttpClient);
  private usuarioService = inject(UsuarioService);

  private readonly API_BARALHOS = 'http://localhost/joquemmon-api/baralhos.php';
  private readonly API_CARTAS = 'http://localhost/joquemmon-api/cartas.php';

  readonly MAX_CARTAS_BARALHO = 8;

  // Cartas disponíveis no inventário do jogador (vindas do MySQL)
  cartasInventario = signal<CartaPokemon[]>([]);

  // Lista reativa de baralhos exibida na tela (vinda do MySQL)
  baralhos = signal<Baralho[]>([]);

  // Estados de carregamento e requisição
  carregando = signal<boolean>(true);
  salvando = signal<boolean>(false);

  // Controle unificado do Pop-up (Criar / Editar)
  modalAberto = signal<boolean>(false);
  modoModal = signal<ModoModal>('CRIAR');
  abaEdicao = signal<AbaEdicao>('REMOVER');
  baralhoEmEdicaoId = signal<number | null>(null);

  // Campos do formulário do modal
  nomeBaralhoForm = signal<string>('');
  cartasSelecionadas = signal<CartaPokemon[]>([]);
  erroFormulario = signal<string>('');

  // Status de feedback na tela de Baralhos
  mensagemStatus = signal<string>('');

  ngOnInit() {
    this.carregarDadosIniciais();
  }

  private get usuarioId(): number {
    return this.usuarioService.usuarioId;
  }

  carregarDadosIniciais() {
    this.carregando.set(true);

    // 1. Carrega cartas do inventário do usuário
    this.http
      .get<CartaPokemon[]>(`${this.API_CARTAS}?usuario_id=${this.usuarioId}`)
      .subscribe({
        next: (cartas) => this.cartasInventario.set(cartas ?? []),
        error: (err) => console.error('Erro ao carregar cartas do inventário:', err),
      });

    // 2. Carrega baralhos do usuário
    this.carregarBaralhos();
  }

  carregarBaralhos() {
    this.http
      .get<Baralho[]>(`${this.API_BARALHOS}?usuario_id=${this.usuarioId}`)
      .subscribe({
        next: (lista) => {
          this.baralhos.set(
            (lista ?? []).map((b) => ({
              ...b,
              cartas: b.cartas ?? [],
            }))
          );
          this.carregando.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar baralhos:', err);
          this.carregando.set(false);
        },
      });
  }

  // =========================================================
  // ABRIR MODAL (CRIAÇÃO OU EDIÇÃO)
  // =========================================================
  abrirModalCriar() {
    this.modoModal.set('CRIAR');
    this.baralhoEmEdicaoId.set(null);
    this.nomeBaralhoForm.set('');
    this.cartasSelecionadas.set([]);
    this.erroFormulario.set('');
    this.modalAberto.set(true);
  }

  abrirModalEditar(baralho: Baralho) {
    this.modoModal.set('EDITAR');
    this.abaEdicao.set('REMOVER');
    this.baralhoEmEdicaoId.set(baralho.id);
    this.nomeBaralhoForm.set(baralho.nome);
    this.cartasSelecionadas.set(baralho.cartas.map((c) => ({ ...c })));
    this.erroFormulario.set('');
    this.modalAberto.set(true);
  }

  fecharModal() {
    if (this.salvando()) return;
    this.modalAberto.set(false);
    this.baralhoEmEdicaoId.set(null);
    this.erroFormulario.set('');
  }

  // =========================================================
  // MANIPULAÇÃO DE CARTAS NO MODAL
  // =========================================================
  adicionarCartaAoBaralho(carta: CartaPokemon) {
    if (this.cartasSelecionadas().length >= this.MAX_CARTAS_BARALHO) {
      this.erroFormulario.set(
        `O baralho já atingiu o limite máximo de ${this.MAX_CARTAS_BARALHO} cartas.`
      );
      return;
    }

    this.erroFormulario.set('');
    this.cartasSelecionadas.update((lista) => [...lista, { ...carta }]);
  }

  removerCartaDoBaralho(index: number) {
    this.erroFormulario.set('');
    this.cartasSelecionadas.update((lista) => lista.filter((_, i) => i !== index));
  }

  // =========================================================
  // SALVAR (CRIAÇÃO OU EDIÇÃO) E EXCLUIR NO MYSQL
  // =========================================================
  salvarBaralho() {
    const nome = this.nomeBaralhoForm().trim();

    if (!nome) {
      this.erroFormulario.set('Digite um nome para o baralho.');
      return;
    }

    if (this.cartasSelecionadas().length === 0) {
      this.erroFormulario.set('O baralho precisa ter pelo menos 1 carta.');
      return;
    }

    const idsCartas = this.cartasSelecionadas().map((c) => c.id);
    this.salvando.set(true);
    this.erroFormulario.set('');

    if (this.modoModal() === 'CRIAR') {
      const payload = {
        usuario_id: this.usuarioId,
        nome,
        cartas: idsCartas,
      };

      this.http.post<{ id: number; mensagem: string }>(this.API_BARALHOS, payload).subscribe({
        next: () => {
          this.salvando.set(false);
          this.fecharModal();
          this.carregarBaralhos();
          this.exibirToast(`Baralho "${nome}" criado com sucesso!`);
        },
        error: (err) => {
          console.error('Erro ao criar baralho:', err);
          this.salvando.set(false);
          this.erroFormulario.set(
            err.error?.erro || 'Erro ao salvar o baralho no banco de dados.'
          );
        },
      });
    } else {
      const idAlvo = this.baralhoEmEdicaoId();
      if (idAlvo === null) {
        this.salvando.set(false);
        return;
      }

      const payload = {
        id: idAlvo,
        usuario_id: this.usuarioId,
        nome,
        cartas: idsCartas,
      };

      this.http
        .put<{ mensagem: string }>(`${this.API_BARALHOS}?id=${idAlvo}`, payload)
        .subscribe({
          next: () => {
            this.salvando.set(false);
            this.fecharModal();
            this.carregarBaralhos();
            this.exibirToast(`Baralho "${nome}" atualizado com sucesso!`);
          },
          error: (err) => {
            console.error('Erro ao atualizar baralho:', err);
            this.salvando.set(false);
            this.erroFormulario.set(
              err.error?.erro || 'Erro ao atualizar o baralho no banco de dados.'
            );
          },
        });
    }
  }

  excluirBaralhoAtual() {
    const idAlvo = this.baralhoEmEdicaoId();
    const nomeAlvo = this.nomeBaralhoForm();

    if (idAlvo === null || this.salvando()) return;

    const confirmou = confirm(`Tem certeza que deseja excluir o baralho "${nomeAlvo}"?`);
    if (!confirmou) return;

    this.salvando.set(true);

    this.http
      .delete<{ mensagem: string }>(`${this.API_BARALHOS}?id=${idAlvo}`)
      .subscribe({
        next: () => {
          this.salvando.set(false);
          this.fecharModal();
          this.carregarBaralhos();
          this.exibirToast(`Baralho "${nomeAlvo}" excluído.`);
        },
        error: (err) => {
          console.error('Erro ao excluir baralho:', err);
          this.salvando.set(false);
          this.erroFormulario.set(
            err.error?.erro || 'Erro ao excluir o baralho no banco de dados.'
          );
        },
      });
  }

  private exibirToast(mensagem: string) {
    this.mensagemStatus.set(mensagem);
    setTimeout(() => {
      this.mensagemStatus.set('');
    }, 4000);
  }
}