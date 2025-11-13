import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, User, MapPin, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  producto: string;
  cantidad: string;
  cliente: string;
  direccion?: string;
  fecha: string;
  estado: string;
}

interface BeverageResponse {
  id: number;
  name: string;
  size: string;
  price: number;
}

interface OrderCardProps {
  order: Order;
}

const fetchBeverage = async (beverageName: string): Promise<BeverageResponse | null> => {
  try {
    const response = await fetch(`http://localhost:8000/menu/${encodeURIComponent(beverageName)}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error al consultar la API: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching beverage:", error);
    return null;
  }
};

export const OrderCard = ({ order }: OrderCardProps) => {
  const [isValidProduct, setIsValidProduct] = useState<boolean | null>(null);
  const [beverageInfo, setBeverageInfo] = useState<BeverageResponse | null>(null);

  // Verificar si el producto es un nombre de bebida válido (no es un texto descriptivo)
  const isBeverageName = order.producto && 
    !order.producto.toLowerCase().includes('productos') && 
    !order.producto.toLowerCase().includes('sin productos') &&
    order.producto.trim().length > 0;

  const { data: beverage, isLoading } = useQuery({
    queryKey: ["beverage", order.producto],
    queryFn: () => fetchBeverage(order.producto),
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isBeverageName, // Solo hacer la query si es un nombre de bebida válido
  });

  useEffect(() => {
    if (!isBeverageName) {
      // Si no es un nombre de bebida válido, no validar
      setIsValidProduct(null);
      setBeverageInfo(null);
      return;
    }
    
    if (beverage !== undefined) {
      setIsValidProduct(beverage !== null);
      setBeverageInfo(beverage);
    }
  }, [beverage, isBeverageName]);

  const borderColor = isValidProduct === false 
    ? "border-l-destructive" 
    : isValidProduct === true 
    ? "border-l-green-500" 
    : "border-l-primary";

  return (
    <Card className={`p-5 bg-gradient-card shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-in border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-foreground">{order.producto}</h3>
              {isBeverageName && isLoading && (
                <span className="text-xs text-muted-foreground">Verificando...</span>
              )}
              {isBeverageName && isValidProduct === true && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
              {isBeverageName && isValidProduct === false && (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">Cantidad: {order.cantidad}</p>
            {beverageInfo && (
              <p className="text-sm font-medium text-primary mt-1">
                Precio: ${beverageInfo.price.toFixed(2)}
              </p>
            )}
            {isBeverageName && isValidProduct === false && (
              <p className="text-xs text-destructive mt-1">
                ⚠️ Este producto no está disponible en el menú (localhost:8000)
              </p>
            )}
          </div>
        </div>
        <Badge className={`${
          isValidProduct === false 
            ? "bg-destructive text-destructive-foreground" 
            : "bg-accent text-accent-foreground hover:bg-accent/90"
        }`}>
          {order.estado}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="w-4 h-4" />
          <span>{order.cliente}</span>
        </div>
        
        {order.direccion && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{order.direccion}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{order.fecha}</span>
        </div>
      </div>
    </Card>
  );
};
