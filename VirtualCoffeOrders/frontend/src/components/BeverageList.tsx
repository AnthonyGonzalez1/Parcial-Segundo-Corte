import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Coffee, RefreshCw, AlertCircle, Plus } from "lucide-react";

interface Beverage {
  id: number;
  name: string;
  size: string;
  price: number;
}

const fetchBeverages = async (): Promise<Beverage[]> => {
  try {
    const response = await fetch(`http://localhost:8000/menu`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error al cargar productos: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // El endpoint /menu retorna directamente un array según main.py
    if (Array.isArray(data)) {
      return data;
    }
    
    // Si es un objeto con una propiedad que contiene el array (por compatibilidad)
    if (data.menu && Array.isArray(data.menu)) {
      return data.menu;
    }
    
    // Si no se encuentra el formato esperado, retornar array vacío
    console.warn("Formato de respuesta inesperado desde /menu:", data);
    return [];
  } catch (error) {
    console.error("Error fetching beverages:", error);
    throw error; // Re-lanzar el error para que React Query lo maneje correctamente
  }
};

interface BeverageListProps {
  onSelectBeverage?: (beverageName: string) => void;
  onAddToOrder?: (beverageName: string) => void;
}

export const BeverageList = ({ onSelectBeverage, onAddToOrder }: BeverageListProps) => {
  const { data: beverages = [], isLoading, error, refetch } = useQuery({
    queryKey: ["beverages-list"],
    queryFn: fetchBeverages,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Cargando productos...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Productos Disponibles</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-7 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Actualizar
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded">
          <AlertCircle className="w-4 h-4" />
          <span>
            No se pudieron cargar los productos desde localhost:8000. Verifica que la API esté disponible.
          </span>
        </div>
      </Card>
    );
  }

  if (beverages.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Productos Disponibles</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-7 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Actualizar
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded">
          <AlertCircle className="w-4 h-4" />
          <span>
            No hay productos disponibles en el menú. Agrega productos desde la API.
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Productos Disponibles ({beverages.length})
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="h-7 text-xs"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {beverages.map((beverage) => (
          <Card
            key={beverage.id}
            className={`p-4 transition-all duration-200 border-l-4 border-l-primary ${
              onAddToOrder ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]' : 'hover:shadow-md'
            }`}
            onClick={() => {
              if (onAddToOrder) {
                onAddToOrder(beverage.name);
              } else if (onSelectBeverage) {
                onSelectBeverage(beverage.name);
              }
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">{beverage.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {beverage.size}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-lg font-bold text-primary">
                ${beverage.price.toFixed(2)}
              </span>
              {onAddToOrder && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Plus className="w-3 h-3" />
                  <span>Click para agregar</span>
                </div>
              )}
              {!onAddToOrder && onSelectBeverage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBeverage(beverage.name);
                  }}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-muted-foreground text-center">
        Productos cargados desde http://localhost:8000/menu
      </div>
    </Card>
  );
};

