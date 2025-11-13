import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrderForm } from "@/components/OrderForm";
import { OrderHistory } from "@/components/OrderHistory";
import { BeverageList } from "@/components/BeverageList";

interface Order {
  id: string;
  producto: string;
  cantidad: string;
  cliente: string;
  direccion?: string;
  fecha: string;
  estado: string;
}

const Index = () => {
  const [selectedBeverage, setSelectedBeverage] = useState<string | undefined>();
  const [addProductToOrder, setAddProductToOrder] = useState<((producto: string, cantidad?: string) => void) | null>(null);

  // Cargar órdenes del backend
  const { data: orders = [], isLoading: isLoadingOrders, error: ordersError } = useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<Order[]> => {
      const response = await fetch('http://localhost:8081/orders');
      
      if (!response.ok) {
        throw new Error(`Error al cargar órdenes: ${response.statusText}`);
      }
      
      const backendOrders = await response.json();
      
      // Mapear órdenes del backend al formato del frontend
      return backendOrders.map((order: any) => {
        // Si la orden tiene items, mostrar el primer item o un resumen
        let producto = 'Sin productos';
        let cantidad = '0';
        
        if (order.items && order.items.length > 0) {
          if (order.items.length === 1) {
            producto = order.items[0].beverageName;
            cantidad = String(order.items[0].quantity || 1);
          } else {
            producto = `${order.items.length} productos`;
            cantidad = String(order.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0));
          }
        } else if (order.beverageName) {
          // Compatibilidad con formato antiguo
          producto = order.beverageName;
          cantidad = '1';
        }
        
        return {
          id: String(order.id),
          producto: producto,
          cantidad: cantidad,
          cliente: order.customerName,
          direccion: undefined,
          fecha: new Date(order.createdAt).toLocaleString('es-ES'),
          estado: order.status === 'CONFIRMED' ? 'Confirmado' : 
                  order.status === 'REJECTED' ? 'Rechazado' : 'Pendiente',
        };
      });
    },
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refrescar cada 5 segundos
  });

  const handleSelectBeverage = (beverageName: string) => {
    setSelectedBeverage(beverageName);
    // Scroll suave hacia el formulario
    setTimeout(() => {
      const formElement = document.getElementById('order-form');
      formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleAddToOrder = (beverageName: string) => {
    if (addProductToOrder) {
      addProductToOrder(beverageName, "1");
    } else {
      // Fallback: usar el método anterior
      handleSelectBeverage(beverageName);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-primary text-primary-foreground py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 animate-fade-in">
            Sistema de Gestión de Pedidos
          </h1>
          <p className="text-lg opacity-90 animate-fade-in">
            Administra tus pedidos de manera simple y eficiente
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Lista de productos disponibles */}
        <div className="mb-8">
          <BeverageList onAddToOrder={handleAddToOrder} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div id="order-form">
            <OrderForm 
              preselectedProduct={selectedBeverage}
              onAddProduct={(addFn) => setAddProductToOrder(() => addFn)}
            />
          </div>
          <div>
            <OrderHistory orders={orders} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
