import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Baralho } from './baralho.model';
import { CartaPokemon } from '../carta/carta.model';
import cartasMock from '../../data/cartas-mock.json';

type ModoModal = 'CRIAR' | 'EDITAR';
type AbaEdicao = 'REMOVER' | 'ADICIONAR';

@Component({
  selector: 'app-baralhos',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './baralhos.component.html',
  styleUrl: './baralhos.component.scss',
})
export class BaralhosComponent {
  readonly MAX_CARTAS_BARALHO = 8;

  // Cartas disponíveis no inventário do jogador (placeholder)
  cartasInventario: CartaPokemon[] = cartasMock;

  // Lista reativa de baralhos exibida na tela
  baralhos = signal<Baralho[]>([
    {
      id: 1,
      nome: 'Baralho Principal',
      cartas: [...cartasMock, ...cartasMock, ...cartasMock].slice(0, 8),
    },
    {
      id: 2,
      nome: 'Time Veloz',
      cartas: [cartasMock[1], cartasMock[2], cartasMock[0]],
    },
  ]);

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
    this.abaEdicao.set('REMOVER'); // Inicia exibindo as cartas atuais para remover ou alternar para adicionar
    this.baralhoEmEdicaoId.set(baralho.id);
    this.nomeBaralhoForm.set(baralho.nome);
    this.cartasSelecionadas.set(baralho.cartas.map((c) => ({ ...c })));
    this.erroFormulario.set('');
    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
    this.baralhoEmEdicaoId.set(null);
    this.erroFormulario.set('');
  }

  // =========================================================
  // MANIPULAÇÃO DE CARTAS NO MODAL
  // =========================================================
  adicionarCartaAoBaralho(carta: CartaPokemon) {
    if (this.cartasSelecionadas().length >= this.MAX_CARTAS_BARALHO) {
      this.erroFormulario.set(`O baralho já atingiu o limite máximo de ${this.MAX_CARTAS_BARALHO} cartas.`);
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
  // SALVAR (CRIAÇÃO OU EDIÇÃO) E EXCLUIR
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

    const cartasAtualizadas = this.cartasSelecionadas().map((c) => ({ ...c }));

    if (this.modoModal() === 'CRIAR') {
      const novoId =
        this.baralhos().length > 0
          ? Math.max(...this.baralhos().map((b) => b.id)) + 1
          : 1;

      const novoBaralho: Baralho = {
        id: novoId,
        nome,
        cartas: cartasAtualizadas,
      };

      this.baralhos.update((lista) => [...lista, novoBaralho]);
      this.exibirToast(`Baralho "${nome}" criado com sucesso!`);
    } else {
      const idAlvo = this.baralhoEmEdicaoId();
      this.baralhos.update((lista) =>
        lista.map((b) =>
          b.id === idAlvo ? { ...b, nome, cartas: cartasAtualizadas } : b
        )
      );
      this.exibirToast(`Baralho "${nome}" atualizado com sucesso!`);
    }

    this.fecharModal();
  }

  excluirBaralhoAtual() {
    const idAlvo = this.baralhoEmEdicaoId();
    const nomeAlvo = this.nomeBaralhoForm();

    if (idAlvo === null) return;

    const confirmou = confirm(`Tem certeza que deseja excluir o baralho "${nomeAlvo}"?`);
    if (!confirmou) return;

    this.baralhos.update((lista) => lista.filter((b) => b.id !== idAlvo));
    this.fecharModal();
    this.exibirToast(`Baralho "${nomeAlvo}" excluído.`);
  }

  private exibirToast(mensagem: string) {
    this.mensagemStatus.set(mensagem);
    setTimeout(() => {
      this.mensagemStatus.set('');
    }, 4000);
  }
}