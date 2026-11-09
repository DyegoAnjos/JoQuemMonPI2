import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BatalhaComponent } from './batalha.component';

describe('BatalhaComponent', () => {
  let component: BatalhaComponent;
  let fixture: ComponentFixture<BatalhaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatalhaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BatalhaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
