import { useState } from "react";
import { OrderForm } from "@/components/OrderForm";
import { OrderHistory } from "@/components/OrderHistory";

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
  const [orders, setOrders] = useState<Order[]>([]);

  const handleNewOrder = (order: Order) => {
    setOrders([order, ...orders]);
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
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <OrderForm onSubmit={handleNewOrder} />
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