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
    const endpoints = ['/menu', '/menu/all', '/beverages', '/products'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:8000${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            return data;
          }
          if (data.menu && Array.isArray(data.menu)) {
            return data.menu;
          }
          if (data.beverages && Array.isArray(data.beverages)) {
            return data.beverages;
          }
          if (data.products && Array.isArray(data.products)) {
            return data.products;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching beverages:", error);
    return [];
  }
};

interface BeverageListProps {
  onSelectBeverage?: (beverageName: string) => void;
}

export const BeverageList = ({ onSelectBeverage }: BeverageListProps) => {
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

  if (error || beverages.length === 0) {
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
            className="p-4 hover:shadow-md transition-all duration-200 border-l-4 border-l-primary"
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
              {onSelectBeverage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectBeverage(beverage.name)}
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
        Productos cargados desde http://localhost:8000
      </div>
    </Card>
  );
};

