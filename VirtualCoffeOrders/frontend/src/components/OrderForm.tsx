import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart, RefreshCw, AlertCircle, Plus, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const orderSchema = z.object({
  producto: z.string().max(100, "Máximo 100 caracteres").optional(),
  cantidad: z.string()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), "Debe ser un número mayor a 0")
    .optional(),
  cliente: z.string().min(1, "El nombre del cliente es requerido").max(100, "Máximo 100 caracteres"),
  direccion: z.string().max(200, "Máximo 200 caracteres").optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  onSubmit?: (data: OrderFormData & { id: string; fecha: string; estado: string }) => void;
  preselectedProduct?: string;
  onAddProduct?: (addProduct: (producto: string, cantidad?: string) => void) => void;
}

interface Beverage {
  id: number;
  name: string;
  size: string;
  price: number;
}

const fetchBeverages = async (): Promise<Beverage[]> => {
  try {
    console.log("Fetching beverages from http://localhost:8000/menu");
    const response = await fetch(`http://localhost:8000/menu`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      console.error(`Error response: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      throw new Error(`Error al cargar productos: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Response data:", data);
    console.log("Is array?", Array.isArray(data));
    console.log("Data type:", typeof data);
    
    let beverages: Beverage[] = [];
    
    // Si es un array, retornarlo directamente
    if (Array.isArray(data)) {
      beverages = data;
      console.log("Found array with", beverages.length, "items");
    } 
    // Si es un objeto con una propiedad que contiene el array
    else if (data.menu && Array.isArray(data.menu)) {
      beverages = data.menu;
      console.log("Found menu array with", beverages.length, "items");
    }
    // Intentar otras propiedades comunes
    else if (data.beverages && Array.isArray(data.beverages)) {
      beverages = data.beverages;
      console.log("Found beverages array with", beverages.length, "items");
    }
    else if (data.products && Array.isArray(data.products)) {
      beverages = data.products;
      console.log("Found products array with", beverages.length, "items");
    }
    else {
      console.warn("Formato de respuesta inesperado desde /menu:", data);
      console.warn("Keys disponibles:", Object.keys(data));
      return [];
    }
    
    // Validar que los items tengan la estructura esperada
    const validBeverages = beverages.filter((item: any) => {
      const hasName = item.name || item.nombre || item.producto;
      const isValid = hasName && (item.id !== undefined || item.name || item.nombre);
      if (!isValid) {
        console.warn("Item inválido encontrado:", item);
      }
      return isValid;
    });
    
    // Mapear a la estructura esperada si es necesario
    const mappedBeverages: Beverage[] = validBeverages.map((item: any, index: number) => ({
      id: item.id || index,
      name: item.name || item.nombre || item.producto || String(item.id || index),
      size: item.size || item.tamaño || "N/A",
      price: item.price || item.precio || 0,
    }));
    
    console.log("Beverages procesados:", mappedBeverages);
    return mappedBeverages;
  } catch (error) {
    console.error("Error fetching beverages:", error);
    return [];
  }
};

interface OrderItem {
  producto: string;
  cantidad: string;
  id: string;
}

export const OrderForm = ({ onSubmit, preselectedProduct, onAddProduct }: OrderFormProps) => {
  const queryClient = useQueryClient();
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([]);
  const [currentProducto, setCurrentProducto] = React.useState<string>("");
  const [currentCantidad, setCurrentCantidad] = React.useState<string>("1");

  // Función para agregar producto desde fuera del componente
  const addProductFromOutside = React.useCallback((producto: string, cantidad: string = "1") => {
    const newItem: OrderItem = {
      id: crypto.randomUUID(),
      producto: producto,
      cantidad: cantidad,
    };
    setOrderItems(prev => [...prev, newItem]);
    
    // Scroll suave hacia el formulario
    setTimeout(() => {
      const formElement = document.getElementById('order-form');
      formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  // Exponer la función al componente padre
  React.useEffect(() => {
    if (onAddProduct) {
      onAddProduct(addProductFromOutside);
    }
  }, [onAddProduct, addProductFromOutside]);
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: preselectedProduct ? { producto: preselectedProduct } : undefined,
  });

  const { data: beverages = [], isLoading: isLoadingBeverages, refetch, error: beveragesError } = useQuery({
    queryKey: ["beverages"],
    queryFn: fetchBeverages,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Función para mapear cantidad a tamaño del backend
  const mapSizeToBackend = (cantidad: string): string => {
    const num = parseInt(cantidad, 10);
    if (num <= 1) return 'small';
    if (num <= 2) return 'medium';
    return 'large';
  };

  const addItemToList = () => {
    if (!currentProducto.trim()) {
      toast({
        title: "Producto requerido",
        description: "Debes seleccionar un producto",
        variant: "destructive",
      });
      return;
    }
    
    const newItem: OrderItem = {
      id: crypto.randomUUID(),
      producto: currentProducto,
      cantidad: currentCantidad || "1",
    };
    
    setOrderItems([...orderItems, newItem]);
    setCurrentProducto("");
    setCurrentCantidad("1");
  };

  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  // Mutación para crear una orden en el backend
  const createOrderMutation = useMutation({
    mutationFn: async ({ cliente }: { cliente: string }) => {
      if (orderItems.length === 0) {
        throw new Error("Debes agregar al menos un producto a la orden");
      }

      const items = orderItems.map(item => ({
        beverageName: item.producto,
        size: mapSizeToBackend(item.cantidad),
        quantity: parseInt(item.cantidad, 10) || 1,
      }));

      const requestBody = {
        items: items,
        customerName: cliente,
      };

      console.log("Sending order request:", JSON.stringify(requestBody, null, 2));
      console.log("Items being sent:", items.map(item => `beverageName: "${item.beverageName}", size: "${item.size}", quantity: ${item.quantity}`));

      const response = await fetch('http://localhost:8081/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Error al crear la orden: ${response.statusText}`
        );
      }

      const backendOrder = await response.json();
      
      // Mapear respuesta del backend al formato del frontend
      const firstItem = backendOrder.items && backendOrder.items.length > 0 
        ? backendOrder.items[0] 
        : null;
      
      return {
        id: String(backendOrder.id),
        producto: firstItem ? firstItem.beverageName : 'Múltiples productos',
        cantidad: String(orderItems.reduce((sum, item) => sum + (parseInt(item.cantidad) || 1), 0)),
        cliente: backendOrder.customerName,
        direccion: undefined,
        fecha: new Date(backendOrder.createdAt).toLocaleString('es-ES'),
        estado: backendOrder.status === 'CONFIRMED' ? 'Confirmado' : 
                backendOrder.status === 'REJECTED' ? 'Rechazado' : 'Pendiente',
      };
    },
    onSuccess: (newOrder) => {
      // Invalidar la query de órdenes para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      
      // Si hay un callback onSubmit, llamarlo también (para compatibilidad)
      if (onSubmit) {
        onSubmit(newOrder);
      }
      
      toast({
        title: "¡Pedido creado!",
        description: `Pedido con ${orderItems.length} producto(s) agregado exitosamente.`,
      });
      
      reset();
      setOrderItems([]);
      setCurrentProducto("");
      setCurrentCantidad("1");
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear pedido",
        description: error.message || "No se pudo crear el pedido. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Debug: Log cuando cambian los beverages
  React.useEffect(() => {
    console.log("Beverages en componente:", beverages);
    console.log("Cantidad de beverages:", beverages.length);
    console.log("Is loading:", isLoadingBeverages);
    console.log("Error:", beveragesError);
  }, [beverages, isLoadingBeverages, beveragesError]);

  const selectedProduct = watch("producto");

  // Actualizar el producto si se preselecciona desde fuera
  React.useEffect(() => {
    if (preselectedProduct) {
      setValue("producto", preselectedProduct);
    }
  }, [preselectedProduct, setValue]);

  const onSubmitForm = (data: OrderFormData) => {
    if (orderItems.length === 0) {
      toast({
        title: "Productos requeridos",
        description: "Debes agregar al menos un producto antes de crear el pedido. Haz clic en los productos del menú para agregarlos.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.cliente || data.cliente.trim() === "") {
      toast({
        title: "Cliente requerido",
        description: "Debes ingresar el nombre del cliente",
        variant: "destructive",
      });
      return;
    }
    
    createOrderMutation.mutate({ cliente: data.cliente });
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary rounded-lg">
          <ShoppingCart className="w-5 h-5 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Nuevo Pedido</h2>
      </div>
      
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
        {/* Sección para agregar productos */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
          <Label className="text-sm font-medium">Agregar Productos</Label>
          
          <div className="flex gap-2">
            <div className="flex-1">
              {beverages.length > 0 ? (
                <Select
                  value={currentProducto}
                  onValueChange={setCurrentProducto}
                >
                  <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {beverages.map((beverage) => (
                      <SelectItem key={beverage.id} value={beverage.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{beverage.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ${beverage.price.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Nombre del producto"
                  value={currentProducto}
                  onChange={(e) => setCurrentProducto(e.target.value)}
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              )}
            </div>
            <Input
              type="number"
              placeholder="Cant."
              value={currentCantidad}
              onChange={(e) => setCurrentCantidad(e.target.value)}
              className="w-20 transition-all focus:ring-2 focus:ring-primary"
              min="1"
            />
            <Button
              type="button"
              onClick={addItemToList}
              disabled={!currentProducto.trim()}
              className="px-4"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>

        {/* Lista de productos agregados */}
        {orderItems.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Productos en la orden ({orderItems.length})</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-background border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.producto}</p>
                    <p className="text-xs text-muted-foreground">Cantidad: {item.cantidad}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="cliente" className="text-sm font-medium">
            Cliente *
          </Label>
          <Input
            id="cliente"
            placeholder="Ej: Juan Pérez"
            {...register("cliente")}
            className="transition-all focus:ring-2 focus:ring-primary"
          />
          {errors.cliente && (
            <p className="text-sm text-destructive">{errors.cliente.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="direccion" className="text-sm font-medium">
            Dirección (opcional)
          </Label>
          <Input
            id="direccion"
            placeholder="Ej: Calle Principal 123, Madrid"
            {...register("direccion")}
            className="transition-all focus:ring-2 focus:ring-primary"
          />
          {errors.direccion && (
            <p className="text-sm text-destructive">{errors.direccion.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={createOrderMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          {createOrderMutation.isPending ? "Creando pedido..." : "Crear Pedido"}
        </Button>
      </form>
    </Card>
  );
};
