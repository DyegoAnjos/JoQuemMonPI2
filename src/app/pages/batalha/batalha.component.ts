import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartaComponent } from '../carta/carta.component';
import { CartaPokemon } from '../carta/carta.model';
import cartasMock from '../../data/cartas-mock.json';

type FaseBatalha = 'ESCOLHER_CARTA' | 'ESCOLHER_ACAO' | 'ANIMANDO_COMBATE' | 'RESULTADO_RODADA' | 'FIM_DE_JOGO';
type AtributoAcao = 'atq' | 'def' | 'vel';
type EstadoAnimacao = 'neutro' | 'atacando-j1' | 'atacando-j2' | 'sofrendo-dano' | 'derrotada' | 'empate';

@Component({
  selector: 'app-batalha',
  standalone: true,
  imports: [RouterLink, CartaComponent],
  templateUrl: './batalha.component.html',
  styleUrl: './batalha.component.scss',
})
export class BatalhaComponent implements OnInit, OnDestroy {
  // Perfis
  fotoJogador1 = 'images/perfil/treinador_default.jpg';
  fotoJogador2 = 'images/perfil/rival_default.jpg';

  // Mãos (Signals para atualizar barra de vida e contagem em tempo real)
  maoJogador1 = signal<CartaPokemon[]>([]);
  maoJogador2 = signal<CartaPokemon[]>([]);

  // Cartas no campo (Signals com imutabilidade para atualizar o PV dentro do <app-carta>)
  cartaCampoJogador1 = signal<CartaPokemon | null>(null);
  cartaCampoJogador2 = signal<CartaPokemon | null>(null);
  cartaRivalRevelada = signal<boolean>(false);

  // Controle de Turnos e Seleções Pendentes
  faseAtual = signal<FaseBatalha>('ESCOLHER_CARTA');
  indexCartaPreSelecionada = signal<number | null>(null);
  acaoSelecionadaJ1 = signal<AtributoAcao | null>(null);
  acaoSelecionadaJ2 = signal<AtributoAcao | null>(null);

  // Estados de Animação dos Slots
  animacaoSlot1 = signal<EstadoAnimacao>('neutro');
  animacaoSlot2 = signal<EstadoAnimacao>('neutro');

  // Caixa de descrição
  logBatalha = signal<string>('Fase de Preparação: Selecione uma carta da sua mão e clique em Confirmar.');

  // Vida total de cada jogador (cartas na mão + carta ativa em campo)
  vidaJogador1 = computed(() => this.maoJogador1().length + (this.cartaCampoJogador1() ? 1 : 0));
  vidaJogador2 = computed(() => this.maoJogador2().length + (this.cartaCampoJogador2() ? 1 : 0));

  // Temporizador reativo com Signal
  readonly TEMPO_MAXIMO = 100;
  tempoRestante = signal<number>(this.TEMPO_MAXIMO);
  tempoFormatado = computed(() => {
    const total = this.tempoRestante();
    const minutos = Math.floor(total / 60);
    const segundos = total % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  });

  private intervaloTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    const gerarBaralho = (): CartaPokemon[] => {
      const lista = [...cartasMock, ...cartasMock].slice(0, 4);
      return lista.map((c) => ({ ...c }));
    };

    this.maoJogador1.set(gerarBaralho());
    this.maoJogador2.set(gerarBaralho());

    this.reiniciarTemporizador();
  }

  ngOnDestroy() {
    this.pararTemporizador();
  }

  // =========================================================
  // CONTROLE DO TEMPORIZADOR
  // =========================================================
  private pararTemporizador() {
    if (this.intervaloTimer) {
      clearInterval(this.intervaloTimer);
      this.intervaloTimer = null;
    }
  }

  private reiniciarTemporizador() {
    this.pararTemporizador();
    this.tempoRestante.set(this.TEMPO_MAXIMO);

    this.intervaloTimer = setInterval(() => {
      if (this.faseAtual() === 'FIM_DE_JOGO') {
        this.pararTemporizador();
        return;
      }

      if (this.tempoRestante() > 0) {
        this.tempoRestante.update((t) => t - 1);
      } else {
        this.pararTemporizador();
        this.faseAtual.set('FIM_DE_JOGO');
        this.logBatalha.set('Tempo esgotado! O duelo terminou por inatividade.');
      }
    }, 1000);
  }

  // =========================================================
  // TURNO 1: Pré-selecionar e Confirmar Carta
  // =========================================================
  selecionarCartaDaMao(index: number) {
    if (this.faseAtual() !== 'ESCOLHER_CARTA') return;

    this.indexCartaPreSelecionada.set(index);
    const carta = this.maoJogador1()[index];
    this.logBatalha.set(`Carta pré-selecionada: ${carta.nome} (PV: ${carta.pv}). Clique em "Confirmar Carta" para enviá-la.`);
  }

  confirmarEscolhaCarta() {
    const idxSelecionado = this.indexCartaPreSelecionada();
    if (this.faseAtual() !== 'ESCOLHER_CARTA' || idxSelecionado === null) return;

    this.reiniciarTemporizador();

    // Move carta selecionada da mão para o campo do Jogador 1
    const novaMaoJ1 = [...this.maoJogador1()];
    const cartaEscolhidaJ1 = novaMaoJ1.splice(idxSelecionado, 1)[0];
    this.maoJogador1.set(novaMaoJ1);
    this.cartaCampoJogador1.set({ ...cartaEscolhidaJ1 });
    this.indexCartaPreSelecionada.set(null);

    // Se o rival não tem carta em campo, escolhe uma aleatória da mão dele
    if (!this.cartaCampoJogador2() && this.maoJogador2().length > 0) {
      const novaMaoJ2 = [...this.maoJogador2()];
      const idxRival = Math.floor(Math.random() * novaMaoJ2.length);
      const cartaEscolhidaJ2 = novaMaoJ2.splice(idxRival, 1)[0];
      this.maoJogador2.set(novaMaoJ2);
      this.cartaCampoJogador2.set({ ...cartaEscolhidaJ2 });
    }

    this.cartaRivalRevelada.set(true);
    this.acaoSelecionadaJ1.set(null);
    this.acaoSelecionadaJ2.set(null);
    this.animacaoSlot1.set('neutro');
    this.animacaoSlot2.set('neutro');
    this.faseAtual.set('ESCOLHER_ACAO');

    this.logBatalha.set(
      `${this.cartaCampoJogador1()?.nome} vs ${this.cartaCampoJogador2()?.nome}! Escolha ATQ, DEF ou VEL e clique em "Confirmar Ação".`
    );
  }

  // =========================================================
  // TURNO 2: Pré-selecionar Ação (ATQ, DEF, VEL) e Confirmar
  // =========================================================
  aoEscolherAtributo(evento: { atributo: AtributoAcao; valor: number }) {
    if (this.faseAtual() !== 'ESCOLHER_ACAO') return;

    this.acaoSelecionadaJ1.set(evento.atributo);
    this.logBatalha.set(`Ação selecionada: ${evento.atributo.toUpperCase()} (${evento.valor}). Clique em "Confirmar Ação" para duelar!`);
  }

  confirmarEscolhaAcao() {
    if (
      this.faseAtual() !== 'ESCOLHER_ACAO' ||
      !this.acaoSelecionadaJ1() ||
      !this.cartaCampoJogador1() ||
      !this.cartaCampoJogador2()
    ) {
      return;
    }

    this.reiniciarTemporizador();

    const opcoes: AtributoAcao[] = ['atq', 'def', 'vel'];
    this.acaoSelecionadaJ2.set(opcoes[Math.floor(Math.random() * opcoes.length)]);

    this.resolverCombate();
  }

  // =========================================================
  // TURNO 3: 1º Investida + Dano -> 2º Morte (se PV <= 0)
  // =========================================================
  private resolverCombate() {
    const c1 = this.cartaCampoJogador1()!;
    const c2 = this.cartaCampoJogador2()!;
    const a1 = this.acaoSelecionadaJ1()!;
    const a2 = this.acaoSelecionadaJ2()!;

    const nomeAcao = { atq: 'ATQ', def: 'DEF', vel: 'VEL' };

    this.faseAtual.set('ANIMANDO_COMBATE');
    this.animacaoSlot1.set('neutro');
    this.animacaoSlot2.set('neutro');

    // Caso de Empate
    if (a1 === a2) {
      this.animacaoSlot1.set('empate');
      this.animacaoSlot2.set('empate');
      this.logBatalha.set(`Empate! Ambos escolheram ${nomeAcao[a1]}. Nenhuma carta sofreu dano!`);

      setTimeout(() => {
        this.animacaoSlot1.set('neutro');
        this.animacaoSlot2.set('neutro');
        this.faseAtual.set('RESULTADO_RODADA');
      }, 550);
      return;
    }

    const j1Venceu =
      (a1 === 'atq' && a2 === 'vel') ||
      (a1 === 'vel' && a2 === 'def') ||
      (a1 === 'def' && a2 === 'atq');

    if (j1Venceu) {
      const dano = c1[a1];
      const novoPv = Math.max(0, c2.pv - dano);

      // Atualiza o Signal com novo objeto para o <app-carta> re-renderizar o PV imediatamente
      this.cartaCampoJogador2.set({ ...c2, pv: novoPv });

      // Passo 1: Jogador 1 avança e Jogador 2 balança tomando dano
      this.animacaoSlot1.set('atacando-j1');
      this.animacaoSlot2.set('sofrendo-dano');
      this.logBatalha.set(`Você escolheu ${nomeAcao[a1]} (${dano}) e acertou ${c2.nome}!`);

      this.executarPosImpacto(false, novoPv <= 0, () => {
        this.logBatalha.set(
          novoPv <= 0
            ? `${c2.nome} chegou a 0 PV e foi derrotado!`
            : `Você venceu com ${nomeAcao[a1]} (${dano})! ${c2.nome} ficou com ${novoPv} PV.`
        );
      });
    } else {
      const dano = c2[a2];
      const novoPv = Math.max(0, c1.pv - dano);

      // Atualiza o Signal com novo objeto para o <app-carta> re-renderizar o PV imediatamente
      this.cartaCampoJogador1.set({ ...c1, pv: novoPv });

      // Passo 1: Jogador 2 avança e Jogador 1 balança tomando dano
      this.animacaoSlot2.set('atacando-j2');
      this.animacaoSlot1.set('sofrendo-dano');
      this.logBatalha.set(`Rival escolheu ${nomeAcao[a2]} (${dano}) e acertou seu ${c1.nome}!`);

      this.executarPosImpacto(novoPv <= 0, false, () => {
        this.logBatalha.set(
          novoPv <= 0
            ? `Seu ${c1.nome} chegou a 0 PV e foi derrotado!`
            : `Rival venceu com ${nomeAcao[a2]} (${dano})! Seu ${c1.nome} ficou com ${novoPv} PV.`
        );
      });
    }
  }

  private executarPosImpacto(j1Morreu: boolean, j2Morreu: boolean, atualizarTextoFinal: () => void) {
    // Aguarda 750ms para a investida e o balanço de dano terminarem totalmente
    setTimeout(() => {
      // Passo 2: Dispara a animação de morte se o PV zerou
      this.animacaoSlot1.set(j1Morreu ? 'derrotada' : 'neutro');
      this.animacaoSlot2.set(j2Morreu ? 'derrotada' : 'neutro');
      atualizarTextoFinal();

      // Aguarda a animação de queda (650ms) antes de liberar o botão Continuar
      if (j1Morreu || j2Morreu) {
        setTimeout(() => {
          this.faseAtual.set('RESULTADO_RODADA');
        }, 650);
      } else {
        this.faseAtual.set('RESULTADO_RODADA');
      }
    }, 750);
  }

  // =========================================================
  // TURNO 4: Verificar Nocaute (PV <= 0) ou Próxima Rodada
  // =========================================================
  avancarAposRodada() {
    if (this.faseAtual() !== 'RESULTADO_RODADA') return;

    this.animacaoSlot1.set('neutro');
    this.animacaoSlot2.set('neutro');

    const c1 = this.cartaCampoJogador1();
    const c2 = this.cartaCampoJogador2();
    const c1Derrotada = !c1 || c1.pv <= 0;
    const c2Derrotada = !c2 || c2.pv <= 0;

    if (c1Derrotada) {
      this.cartaCampoJogador1.set(null);
    }
    if (c2Derrotada) {
      this.cartaCampoJogador2.set(null);
    }

    if (this.vidaJogador1() === 0) {
      this.faseAtual.set('FIM_DE_JOGO');
      this.pararTemporizador();
      this.logBatalha.set('Derrota! Todas as suas cartas foram nocauteadas.');
      return;
    }

    if (this.vidaJogador2() === 0) {
      this.faseAtual.set('FIM_DE_JOGO');
      this.pararTemporizador();
      this.logBatalha.set('Vitória! Você derrotou todas as cartas do Rival!');
      return;
    }

    if (c1Derrotada) {
      this.cartaRivalRevelada.set(!!this.cartaCampoJogador2());
      this.faseAtual.set('ESCOLHER_CARTA');
      this.logBatalha.set('Sua carta foi derrotada! Selecione uma nova carta da sua mão e clique em Confirmar.');
      return;
    }

    if (c2Derrotada && this.maoJogador2().length > 0) {
      const novaMaoJ2 = [...this.maoJogador2()];
      const idxRival = Math.floor(Math.random() * novaMaoJ2.length);
      const novaCartaRival = novaMaoJ2.splice(idxRival, 1)[0];
      this.maoJogador2.set(novaMaoJ2);
      this.cartaCampoJogador2.set({ ...novaCartaRival });
      this.cartaRivalRevelada.set(true);

      this.acaoSelecionadaJ1.set(null);
      this.acaoSelecionadaJ2.set(null);
      this.faseAtual.set('ESCOLHER_ACAO');
      this.logBatalha.set(`O Rival enviou ${novaCartaRival.nome} (PV: ${novaCartaRival.pv})! Escolha sua próxima ação.`);
      return;
    }

    this.acaoSelecionadaJ1.set(null);
    this.acaoSelecionadaJ2.set(null);
    this.faseAtual.set('ESCOLHER_ACAO');
    this.logBatalha.set('Nova rodada! Escolha entre ATQ, DEF ou VEL e clique em Confirmar Ação.');
  }
}