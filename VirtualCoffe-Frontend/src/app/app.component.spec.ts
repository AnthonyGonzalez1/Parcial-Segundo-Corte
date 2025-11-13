// src/app/app.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BeverageService } from './services/beverage.service';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let beverageServiceSpy: jasmine.SpyObj<BeverageService>;

  beforeEach(async () => {
    // Creamos un mock del BeverageService
    const spy = jasmine.createSpyObj('BeverageService', [
      'getBeverages',
      'addBeverage',
      'updateBeverage',
      'deleteBeverage',
      'getValidSizes',
      'formatPrice'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        ReactiveFormsModule,
        FormsModule
      ],
      providers: [
        { provide: BeverageService, useValue: spy },
        provideHttpClientTesting()
      ]
    }).compileComponents();

    beverageServiceSpy = TestBed.inject(BeverageService) as jasmine.SpyObj<BeverageService>;

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;

    // Valores simulados por defecto
    beverageServiceSpy.getBeverages.and.returnValue(of([
      { id: 1, name: 'Café', size: 'small', price: 5 },
      { id: 2, name: 'Té', size: 'medium', price: 4 }
    ]));

    beverageServiceSpy.getValidSizes.and.returnValue([
      { value: 'small', label: 'Pequeño' },
      { value: 'medium', label: 'Mediano' },
      { value: 'large', label: 'Grande' }
    ]);

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load beverages on init', () => {
    expect(beverageServiceSpy.getBeverages).toHaveBeenCalled();
    expect(component.beverages.length).toBeGreaterThan(0);
  });

  it('should filter beverages correctly', () => {
    component.filterForm.patchValue({ size: 'small' });
    component.applyFilters();
    expect(component.filteredBeverages.every(b => b.size === 'small')).toBeTrue();
  });

  it('should format price correctly', () => {
    beverageServiceSpy.formatPrice.and.callFake((price: number) => `$${price.toFixed(2)}`);
    const formatted = component.formatPrice(4.5);
    expect(formatted).toBe('$4.50');
  });

  it('should reset form after creation', () => {
    component.beverageForm.patchValue({ name: 'Latte', size: 'medium', price: 8 });
    component.resetForm();
    expect(component.beverageForm.value.name).toBe('');
    expect(component.beverageForm.value.size).toBe('medium');
    expect(component.beverageForm.value.price).toBe(0);
  });
});
