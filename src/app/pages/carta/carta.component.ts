import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CartaPokemon } from './carta.model';

@Component({
  selector: 'app-carta',
  standalone: true,
  templateUrl: './carta.component.html',
  styleUrl: './carta.component.scss',
})
export class CartaComponent {
  @Input() carta: CartaPokemon = {
    id: 509,
    nome: 'Chandelure',
    pv: 4,
    imagem: 'images/pokemon/chandelure.png',
    tipo1: 'Fantasma',
    tipo2: 'Fogo',
    atq: 7,
    def: 5,
    vel: 4,
  };

  @Input() interativo: boolean = false;

  @Output() atributoSelecionado = new EventEmitter<{ atributo: 'atq' | 'def' | 'vel'; valor: number }>();

  selecionarAtributo(atributo: 'atq' | 'def' | 'vel', valor: number) {
    if (this.interativo) {
      this.atributoSelecionado.emit({ atributo, valor });
    }
  }
}