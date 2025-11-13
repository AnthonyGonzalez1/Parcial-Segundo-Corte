import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BeverageService, Beverage } from './beverage.service';

describe('BeverageService', () => {
  let service: BeverageService;
  let httpMock: HttpTestingController;

  const mockBeverages: Beverage[] = [
    { id: 1, name: 'Espresso', size: 'small', price: 2.5 },
    { id: 2, name: 'Latte', size: 'medium', price: 3.5 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BeverageService]
    });

    service = TestBed.inject(BeverageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ===================================================
  // 🧪 TESTS: GET BEVERAGES
  // ===================================================
  it('should fetch all beverages', () => {
    service.getBeverages().subscribe(beverages => {
      expect(beverages.length).toBe(2);
      expect(beverages).toEqual(mockBeverages);
    });

    const req = httpMock.expectOne('http://localhost:8000/menu');
    expect(req.request.method).toBe('GET');
    req.flush(mockBeverages);
  });

  // ===================================================
  // 🧪 TEST: GET BEVERAGE BY NAME
  // ===================================================
  it('should fetch a beverage by name', () => {
    const beverageName = 'Espresso';
    service.getBeverageByName(beverageName).subscribe(beverage => {
      expect(beverage.name).toBe('Espresso');
      expect(beverage.price).toBe(2.5);
    });

    const req = httpMock.expectOne(`http://localhost:8000/menu/${beverageName}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBeverages[0]);
  });

  // ===================================================
  // 🧪 TEST: ADD BEVERAGE
  // ===================================================
  it('should add a new beverage', () => {
    const newBeverage: Beverage = { name: 'Mocha', size: 'large', price: 4.0 };

    service.addBeverage(newBeverage).subscribe(response => {
      expect(response.name).toBe('Mocha');
      expect(response.price).toBe(4.0);
    });

    const req = httpMock.expectOne('http://localhost:8000/menu');
    expect(req.request.method).toBe('POST');
    req.flush({ ...newBeverage, id: 3 });
  });

  // ===================================================
  // 🧪 TEST: UPDATE BEVERAGE
  // ===================================================
  it('should update a beverage', () => {
    const updatedBeverage: Beverage = { id: 1, name: 'Espresso', size: 'medium', price: 3.0 };

    service.updateBeverage(1, updatedBeverage).subscribe(response => {
      expect(response.size).toBe('medium');
      expect(response.price).toBe(3.0);
    });

    const req = httpMock.expectOne('http://localhost:8000/menu/1');
    expect(req.request.method).toBe('PUT');
    req.flush(updatedBeverage);
  });

  // ===================================================
  // 🧪 TEST: DELETE BEVERAGE
  // ===================================================
  it('should delete a beverage', () => {
    service.deleteBeverage(1).subscribe(response => {
      expect(response).toBeUndefined(); // DELETE devuelve vacío
    });

    const req = httpMock.expectOne('http://localhost:8000/menu/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  // ===================================================
  // 🧪 TEST: HEALTH CHECK
  // ===================================================
  it('should perform a health check', () => {
    const mockResponse = { status: 'healthy', service: 'Beverages API' };

    service.healthCheck().subscribe(response => {
      expect(response.status).toBe('healthy');
      expect(response.service).toBe('Beverages API');
    });

    const req = httpMock.expectOne('http://localhost:8000/health');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  // ===================================================
  // 🧪 TEST: HANDLE ERROR
  // ===================================================
  it('should handle HTTP errors gracefully', () => {
    service.getBeverages().subscribe({
      next: () => fail('Should have failed with a 500 error'),
      error: error => {
        expect(error.message).toContain('Error interno del servidor');
      }
    });

    const req = httpMock.expectOne('http://localhost:8000/menu');
    req.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
  });
});
