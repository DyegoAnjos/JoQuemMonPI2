import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartaComponent } from '../carta/carta.component';
import { CartaPokemon } from '../carta/carta.model';
import cartasMock from '../../data/cartas-mock.json';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [RouterLink, CartaComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent {
  
  minhasCartas: CartaPokemon[] = cartasMock;
}