// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BeverageService, Beverage } from './services/beverage.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'VirtualCoffee - Menú de Bebidas';
  
  // Datos
  beverages: Beverage[] = [];
  filteredBeverages: Beverage[] = [];
  
  // Estados
  loading = false;
  error = '';
  success = '';
  editMode = false;
  editingId?: number;
  
  // Formularios
  beverageForm: FormGroup;
  filterForm: FormGroup;
  
  // Configuración
  sizes: { value: string, label: string }[] = [];
  
  // Subject para unsubscribe
  private destroy$ = new Subject<void>();

  constructor(
    private beverageService: BeverageService,
    private fb: FormBuilder
  ) {
    // Inicializar formulario principal
    this.beverageForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(100),
        this.noWhitespaceValidator
      ]],
      size: ['medium', [Validators.required]],
      price: [0, [
        Validators.required,
        Validators.min(0.01),
        Validators.max(100)
      ]]
    });

    // Inicializar formulario de filtros
    this.filterForm = this.fb.group({
      size: [''],
      minPrice: [null],
      maxPrice: [null]
    });
  }

  ngOnInit(): void {
    console.log('AppComponent initialized');

    // Inicializar tamaños válidos
    this.sizes = this.beverageService.getValidSizes();

    this.loadBeverages();
    
    // Suscribirse a cambios en el servicio
    this.beverageService.beverages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(beverages => {
        this.beverages = beverages;
        this.applyFilters();
      });
    
    // Suscribirse a estado de carga
    this.beverageService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);
    
    // Aplicar filtros al cambiar el formulario
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Carga el menú de bebidas */
  loadBeverages(): void {
    console.log('Loading beverages...');
    this.error = '';
    
    this.beverageService.getBeverages().subscribe({
      next: (data) => {
        console.log(`Loaded ${data.length} beverages`);
        this.beverages = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading beverages:', err);
        this.error = err?.message || String(err);
        this.showErrorNotification(this.error);
      }
    });
  }

  /** Aplica filtros */
  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredBeverages = this.beverages.filter(beverage => {
      if (filters.size && beverage.size !== filters.size) return false;
      if (filters.minPrice != null && beverage.price < filters.minPrice) return false;
      if (filters.maxPrice != null && beverage.price > filters.maxPrice) return false;
      return true;
    });
    
    console.log(`Filtered: ${this.filteredBeverages.length} of ${this.beverages.length}`);
  }

  clearFilters(): void {
    this.filterForm.reset({ size: '', minPrice: null, maxPrice: null });
  }

  /** Crear o actualizar */
  onSubmit(): void {
    if (this.beverageForm.invalid) {
      this.markFormGroupTouched(this.beverageForm);
      return;
    }

    this.error = '';
    this.success = '';

    const beverage: Beverage = this.beverageForm.value;

    if (this.editMode && this.editingId) {
      this.updateBeverage(this.editingId, beverage);
    } else {
      this.createBeverage(beverage);
    }
  }

  private createBeverage(beverage: Beverage): void {
    console.log('Creating beverage:', beverage);
    
    this.beverageService.addBeverage(beverage).subscribe({
      next: (created) => {
        this.success = `Bebida "${created.name}" agregada exitosamente`;
        this.showSuccessNotification(this.success);
        this.resetForm();
        this.loadBeverages();
      },
      error: (err) => {
        this.error = err?.message || String(err);
        this.showErrorNotification(this.error);
      }
    });
  }

  private updateBeverage(id: number, beverage: Beverage): void {
    console.log('Updating beverage:', id, beverage);
    
    this.beverageService.updateBeverage(id, beverage).subscribe({
      next: (updated) => {
        this.success = `Bebida "${updated.name}" actualizada exitosamente`;
        this.showSuccessNotification(this.success);
        this.resetForm();
        this.loadBeverages();
      },
      error: (err) => {
        this.error = err?.message || String(err);
        this.showErrorNotification(this.error);
      }
    });
  }

  editBeverage(beverage: Beverage): void {
    this.editMode = true;
    this.editingId = beverage.id;
    
    this.beverageForm.patchValue({
      name: beverage.name,
      size: beverage.size,
      price: beverage.price
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteBeverage(beverage: Beverage): void {
    if (!beverage.id) return;
    if (!confirm(`¿Está seguro de eliminar "${beverage.name}"?`)) return;

    this.beverageService.deleteBeverage(beverage.id).subscribe({
      next: () => {
        this.success = `Bebida "${beverage.name}" eliminada exitosamente`;
        this.showSuccessNotification(this.success);
        this.loadBeverages();
      },
      error: (err) => {
        this.error = err?.message || String(err);
        this.showErrorNotification(this.error);
      }
    });
  }

  resetForm(): void {
    this.beverageForm.reset({ name: '', size: 'medium', price: 0 });
    this.editMode = false;
    this.editingId = undefined;
    this.error = '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) this.markFormGroupTouched(control);
    });
  }

  private noWhitespaceValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;
    return (control.value || '').trim().length === 0 ? { whitespace: true } : null;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.beverageForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minlength']) return 'El texto es demasiado corto';
    if (control.errors['maxlength']) return 'El texto es demasiado largo (máx. 100 caracteres)';
    if (control.errors['min']) return 'El precio debe ser mayor a 0';
    if (control.errors['max']) return 'El precio debe ser menor o igual a 100';
    if (control.errors['whitespace']) return 'El campo no puede estar vacío';

    return 'Campo inválido';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.beverageForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  getSizeLabel(size: string): string {
    const sizeObj = this.sizes.find(s => s.value === size);
    return sizeObj ? sizeObj.label : size;
  }

  formatPrice(price: number): string {
    return this.beverageService.formatPrice(price);
  }

  private showSuccessNotification(message: string): void {
    this.success = message;
    setTimeout(() => this.success = '', 5000);
  }

  private showErrorNotification(message: string): void {
    this.error = message;
    setTimeout(() => this.error = '', 7000);
  }

  getMenuStatistics(): any {
    return {
      total: this.beverages.length,
      small: this.beverages.filter(b => b.size === 'small').length,
      medium: this.beverages.filter(b => b.size === 'medium').length,
      large: this.beverages.filter(b => b.size === 'large').length,
      avgPrice: this.beverages.length > 0 
        ? this.beverages.reduce((sum, b) => sum + b.price, 0) / this.beverages.length 
        : 0
    };
  }
}
