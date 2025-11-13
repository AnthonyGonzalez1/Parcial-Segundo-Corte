import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart, RefreshCw, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const orderSchema = z.object({
  producto: z.string().min(1, "El producto es requerido").max(100, "Máximo 100 caracteres"),
  cantidad: z.string()
    .min(1, "La cantidad es requerida")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Debe ser un número mayor a 0"),
  cliente: z.string().min(1, "El nombre del cliente es requerido").max(100, "Máximo 100 caracteres"),
  direccion: z.string().max(200, "Máximo 200 caracteres").optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  onSubmit: (data: OrderFormData & { id: string; fecha: string; estado: string }) => void;
  preselectedProduct?: string;
}

interface Beverage {
  id: number;
  name: string;
  size: string;
  price: number;
}

const fetchBeverages = async (): Promise<Beverage[]> => {
  try {
    // Intentar diferentes endpoints comunes para obtener la lista de productos
    const endpoints = ['/menu', '/menu/all', '/beverages', '/products'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:8000${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          // Si es un array, retornarlo directamente
          if (Array.isArray(data)) {
            return data;
          }
          // Si es un objeto con una propiedad que contiene el array
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
        // Continuar con el siguiente endpoint
        continue;
      }
    }
    
    // Si ningún endpoint funciona, retornar array vacío
    return [];
  } catch (error) {
    console.error("Error fetching beverages:", error);
    return [];
  }
};

export const OrderForm = ({ onSubmit, preselectedProduct }: OrderFormProps) => {
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

  const { data: beverages = [], isLoading: isLoadingBeverages, refetch } = useQuery({
    queryKey: ["beverages"],
    queryFn: fetchBeverages,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const selectedProduct = watch("producto");

  // Actualizar el producto si se preselecciona desde fuera
  React.useEffect(() => {
    if (preselectedProduct) {
      setValue("producto", preselectedProduct);
    }
  }, [preselectedProduct, setValue]);

  const onSubmitForm = (data: OrderFormData) => {
    const newOrder = {
      ...data,
      id: crypto.randomUUID(),
      fecha: new Date().toLocaleString('es-ES'),
      estado: 'Pendiente',
    };
    
    onSubmit(newOrder);
    
    toast({
      title: "¡Pedido creado!",
      description: `Pedido de ${data.producto} agregado exitosamente.`,
    });
    
    reset();
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="producto" className="text-sm font-medium">
              Producto *
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoadingBeverages}
              className="h-7 text-xs"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingBeverages ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
          
          {beverages.length > 0 ? (
            <>
              <Controller
                name="producto"
                control={control}
                rules={{ required: "El producto es requerido" }}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const selectedBeverage = beverages.find(b => b.name === value);
                      if (selectedBeverage) {
                        // Opcional: auto-completar cantidad con 1 si está vacía
                        const currentCantidad = watch("cantidad");
                        if (!currentCantidad) {
                          setValue("cantidad", "1");
                        }
                      }
                    }}
                    value={field.value || ""}
                  >
                    <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary">
                      <SelectValue placeholder="Selecciona un producto del menú" />
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
                )}
              />
              {errors.producto && (
                <p className="text-sm text-destructive">{errors.producto.message}</p>
              )}
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">
                  {beverages.find(b => b.name === selectedProduct)?.name && (
                    <>Producto seleccionado del menú de localhost:8000</>
                  )}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="relative">
                <Input
                  id="producto"
                  placeholder="Ingresa el nombre del producto"
                  {...register("producto")}
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
                {isLoadingBeverages && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {errors.producto && (
                <p className="text-sm text-destructive">{errors.producto.message}</p>
              )}
              {!isLoadingBeverages && beverages.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <AlertCircle className="w-3 h-3" />
                  <span>
                    No se pudo cargar el menú. Puedes ingresar el producto manualmente.
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cantidad" className="text-sm font-medium">
            Cantidad *
          </Label>
          <Input
            id="cantidad"
            type="number"
            placeholder="Ej: 2"
            {...register("cantidad")}
            className="transition-all focus:ring-2 focus:ring-primary"
          />
          {errors.cantidad && (
            <p className="text-sm text-destructive">{errors.cantidad.message}</p>
          )}
        </div>

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
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6 transition-all hover:scale-[1.02]"
        >
          Crear Pedido
        </Button>
      </form>
    </Card>
  );
};
