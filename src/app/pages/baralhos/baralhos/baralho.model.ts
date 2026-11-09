import { CartaPokemon } from '../carta/carta.model';

export interface Baralho {
  id: number;
  nome: string;
  cartas: CartaPokemon[];
}