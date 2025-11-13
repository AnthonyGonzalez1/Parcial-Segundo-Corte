import { useState } from "react";
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedBeverage, setSelectedBeverage] = useState<string | undefined>();

  const handleNewOrder = (order: Order) => {
    setOrders([order, ...orders]);
    setSelectedBeverage(undefined);
  };

  const handleSelectBeverage = (beverageName: string) => {
    setSelectedBeverage(beverageName);
    // Scroll suave hacia el formulario
    setTimeout(() => {
      const formElement = document.getElementById('order-form');
      formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
          <BeverageList onSelectBeverage={handleSelectBeverage} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div id="order-form">
            <OrderForm onSubmit={handleNewOrder} preselectedProduct={selectedBeverage} />
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
