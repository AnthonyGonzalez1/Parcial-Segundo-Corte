// src/app/services/beverage.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';

export interface Beverage {
  id?: number;
  name: string;
  size: 'small' | 'medium' | 'large';
  price: number;
}

export interface BeverageFilter {
  size?: string;
  minPrice?: number;
  maxPrice?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BeverageService {
  private apiUrl = 'http://localhost:8000/menu';
  
  // BehaviorSubject para mantener estado de bebidas
  private beveragesSubject = new BehaviorSubject<Beverage[]>([]);
  public beverages$ = this.beveragesSubject.asObservable();
  
  // Subject para loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('BeverageService initialized');
  }

  /**
   * Obtiene el menú completo de bebidas
   */
  getBeverages(filter?: BeverageFilter): Observable<Beverage[]> {
    this.loadingSubject.next(true);
    
    let params = new HttpParams();
    if (filter?.size) {
      params = params.set('size', filter.size);
    }
    if (filter?.minPrice !== undefined) {
      params = params.set('min_price', filter.minPrice.toString());
    }
    if (filter?.maxPrice !== undefined) {
      params = params.set('max_price', filter.maxPrice.toString());
    }

    return this.http.get<Beverage[]>(this.apiUrl, { params })
      .pipe(
        retry(2),
        tap(beverages => {
          console.log(`Fetched ${beverages.length} beverages`);
          this.beveragesSubject.next(beverages);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Busca una bebida por nombre
   */
  getBeverageByName(name: string): Observable<Beverage> {
    const url = `${this.apiUrl}/${encodeURIComponent(name)}`;
    
    return this.http.get<Beverage>(url)
      .pipe(
        tap(beverage => console.log(`Found beverage: ${beverage.name}`)),
        catchError(this.handleError)
      );
  }

  /**
   * Agrega una nueva bebida al menú
   */
  addBeverage(beverage: Beverage): Observable<Beverage> {
    console.log('Adding beverage:', beverage);
    this.loadingSubject.next(true);
    
    return this.http.post<Beverage>(this.apiUrl, beverage)
      .pipe(
        tap(newBeverage => {
          console.log('Beverage added:', newBeverage);
          this.loadingSubject.next(false);
          // Actualizar lista local
          const current = this.beveragesSubject.value;
          this.beveragesSubject.next([...current, newBeverage]);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Actualiza una bebida existente
   */
  updateBeverage(id: number, beverage: Beverage): Observable<Beverage> {
    console.log(`Updating beverage ${id}:`, beverage);
    this.loadingSubject.next(true);
    
    const url = `${this.apiUrl}/${id}`;
    
    return this.http.put<Beverage>(url, beverage)
      .pipe(
        tap(updated => {
          console.log('Beverage updated:', updated);
          this.loadingSubject.next(false);
          // Actualizar lista local
          const current = this.beveragesSubject.value;
          const index = current.findIndex(b => b.id === id);
          if (index !== -1) {
            current[index] = updated;
            this.beveragesSubject.next([...current]);
          }
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Elimina una bebida del menú
   */
  deleteBeverage(id: number): Observable<void> {
    console.log(`Deleting beverage ${id}`);
    this.loadingSubject.next(true);
    
    const url = `${this.apiUrl}/${id}`;
    
    return this.http.delete<void>(url)
      .pipe(
        tap(() => {
          console.log(`Beverage ${id} deleted`);
          this.loadingSubject.next(false);
          // Actualizar lista local
          const current = this.beveragesSubject.value;
          this.beveragesSubject.next(current.filter(b => b.id !== id));
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Verifica la salud del servicio
   */
  healthCheck(): Observable<any> {
    return this.http.get(`http://localhost:8000/health`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Limpia todas las bebidas (solo para testing)
   */
  clearAllBeverages(): Observable<any> {
    return this.http.delete(this.apiUrl)
      .pipe(
        tap(() => {
          console.log('All beverages cleared');
          this.beveragesSubject.next([]);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
      console.error('Client-side error:', error.error.message);
    } else {
      // Error del servidor
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${JSON.stringify(error.error)}`
      );
      
      switch (error.status) {
        case 0:
          errorMessage = 'No se puede conectar con el servidor. Verifique que la API esté corriendo.';
          break;
        case 400:
          errorMessage = error.error?.detail || 'Datos inválidos. Verifique la información ingresada.';
          break;
        case 404:
          errorMessage = error.error?.detail || 'Bebida no encontrada.';
          break;
        case 422:
          errorMessage = 'Error de validación. Verifique los datos ingresados.';
          if (error.error?.detail) {
            // FastAPI devuelve array de errores
            if (Array.isArray(error.error.detail)) {
              const errors = error.error.detail.map((e: any) => 
                `${e.loc?.[e.loc.length - 1] || 'Campo'}: ${e.msg}`
              ).join(', ');
              errorMessage = errors;
            } else {
              errorMessage = error.error.detail;
            }
          }
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intente nuevamente.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Obtiene tamaños válidos
   */
  getValidSizes(): Array<{value: string, label: string}> {
    return [
      { value: 'small', label: 'Pequeño' },
      { value: 'medium', label: 'Mediano' },
      { value: 'large', label: 'Grande' }
    ];
  }

  /**
   * Valida precio
   */
  isValidPrice(price: number): boolean {
    return price > 0 && price <= 100;
  }

  /**
   * Formatea precio con símbolo de moneda
   */
  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
}