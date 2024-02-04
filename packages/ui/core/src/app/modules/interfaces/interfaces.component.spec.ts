import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InterfacesComponent } from './interfaces.component';

describe('InterfacesComponent', () => {
  let component: InterfacesComponent;
  let fixture: ComponentFixture<InterfacesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InterfacesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InterfacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
