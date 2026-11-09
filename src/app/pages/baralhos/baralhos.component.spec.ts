import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaralhosComponent } from './baralhos.component';

describe('BaralhosComponent', () => {
  let component: BaralhosComponent;
  let fixture: ComponentFixture<BaralhosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaralhosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BaralhosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
