import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartaComponent } from './carta.component';

describe('CartaComponent', () => {
  let component: CartaComponent;
  let fixture: ComponentFixture<CartaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CartaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
