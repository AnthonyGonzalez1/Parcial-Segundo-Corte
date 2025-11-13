"""
VirtualCoffee - API de Bebidas
FastAPI application con validaciones completas y CRUD
Compatible con Pydantic v2
"""
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, ConfigDict
import uvicorn
import logging

# ==================== CONFIGURACIÓN ====================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="VirtualCoffee - Beverages API",
    version="1.0.0",
    description="API para gestión de menú de bebidas"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== MODELOS ====================

class Beverage(BaseModel):
    """Modelo de bebida con validaciones"""
    name: str = Field(..., min_length=1, max_length=100, description="Nombre de la bebida")
    size: str = Field(..., pattern="^(small|medium|large)$", description="Tamaño: small, medium o large")
    price: float = Field(..., gt=0, le=100, description="Precio entre 0.01 y 100")

    @field_validator('name')
    @classmethod
    def name_must_not_be_empty(cls, v):
        if not v or v.strip() == "":
            raise ValueError('El nombre no puede estar vacío')
        return v.strip()

    @field_validator('price')
    @classmethod
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('El precio debe ser mayor a 0')
        if v > 100:
            raise ValueError('El precio debe ser menor o igual a 100')
        return round(v, 2)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Cappuccino",
                "size": "medium",
                "price": 4.5
            }
        }
    )


class BeverageResponse(Beverage):
    id: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "Cappuccino",
                "size": "medium",
                "price": 4.5
            }
        }
    )


class BeverageUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    size: Optional[str] = Field(None, pattern="^(small|medium|large)$")
    price: Optional[float] = Field(None, gt=0, le=100)

# ==================== BASE DE DATOS ====================

beverages_db: List[dict] = []
next_id = 1

def reset_database():
    global next_id
    beverages_db.clear()
    next_id = 1

# ==================== ENDPOINTS ====================

@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "VirtualCoffee Beverages API",
        "version": "1.0.0",
        "endpoints": {
            "menu": "/menu",
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "beverages-api",
        "beverages_count": len(beverages_db)
    }

@app.get("/menu", response_model=List[BeverageResponse], tags=["Menu"])
def get_menu(size: Optional[str] = None, min_price: Optional[float] = None, max_price: Optional[float] = None):
    filtered = beverages_db
    if size:
        filtered = [b for b in filtered if b["size"] == size]
    if min_price is not None:
        filtered = [b for b in filtered if b["price"] >= min_price]
    if max_price is not None:
        filtered = [b for b in filtered if b["price"] <= max_price]
    logger.info(f"GET /menu - Returning {len(filtered)} beverages")
    return filtered

@app.get("/menu/{name}", response_model=BeverageResponse, tags=["Menu"])
def get_beverage_by_name(name: str):
    name_lower = name.lower().strip()
    for beverage in beverages_db:
        if beverage["name"].lower() == name_lower:
            return beverage
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Bebida '{name}' no encontrada")

@app.post("/menu", response_model=BeverageResponse, status_code=status.HTTP_201_CREATED, tags=["Menu"])
def add_beverage(beverage: Beverage):
    global next_id
    name_lower = beverage.name.lower()
    for existing in beverages_db:
        if existing["name"].lower() == name_lower:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ya existe una bebida con el nombre '{beverage.name}'")
    new_beverage = {"id": next_id, "name": beverage.name, "size": beverage.size, "price": beverage.price}
    beverages_db.append(new_beverage)
    next_id += 1
    return new_beverage

@app.put("/menu/{beverage_id}", response_model=BeverageResponse, tags=["Menu"])
def update_beverage(beverage_id: int, beverage: Beverage):
    for i, existing in enumerate(beverages_db):
        if existing["id"] == beverage_id:
            name_lower = beverage.name.lower()
            for other in beverages_db:
                if other["id"] != beverage_id and other["name"].lower() == name_lower:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ya existe otra bebida con el nombre '{beverage.name}'")
            updated = {"id": beverage_id, "name": beverage.name, "size": beverage.size, "price": beverage.price}
            beverages_db[i] = updated
            return updated
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Bebida con ID {beverage_id} no encontrada")

@app.patch("/menu/{beverage_id}", response_model=BeverageResponse, tags=["Menu"])
def partial_update_beverage(beverage_id: int, update: BeverageUpdate):
    for i, existing in enumerate(beverages_db):
        if existing["id"] == beverage_id:
            if update.name is not None:
                existing["name"] = update.name.strip()
            if update.size is not None:
                existing["size"] = update.size
            if update.price is not None:
                existing["price"] = round(update.price, 2)
            return existing
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Bebida con ID {beverage_id} no encontrada")

@app.delete("/menu/{beverage_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Menu"])
def delete_beverage(beverage_id: int):
    for i, beverage in enumerate(beverages_db):
        if beverage["id"] == beverage_id:
            beverages_db.pop(i)
            return
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Bebida con ID {beverage_id} no encontrada")

@app.delete("/menu", include_in_schema=False)
def clear_all_beverages():
    reset_database()
    return {"message": "All beverages deleted"}

# ==================== MAIN ====================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
