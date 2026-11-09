export interface CartaPokemon {
  id: number;
  nome: string;
  pv: number;
  imagem: string;
  tipo1: string;
  tipo2?: string;
  atq: number;
  def: number;
  vel: number;
}