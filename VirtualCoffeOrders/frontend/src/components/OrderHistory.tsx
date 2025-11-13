import { Card } from "@/components/ui/card";
import { OrderCard } from "./OrderCard";
import { History } from "lucide-react";

interface Order {
  id: string;
  producto: string;
  cantidad: string;
  cliente: string;
  direccion?: string;
  fecha: string;
  estado: string;
}

interface OrderHistoryProps {
  orders: Order[];
}

export const OrderHistory = ({ orders }: OrderHistoryProps) => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent rounded-lg">
          <History className="w-5 h-5 text-accent-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Historial de Pedidos</h2>
          <p className="text-sm text-muted-foreground">{orders.length} pedido(s) registrado(s)</p>
        </div>
      </div>
      
      {orders.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-card shadow-card">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-muted rounded-full">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg text-muted-foreground">No hay pedidos aún</p>
            <p className="text-sm text-muted-foreground">Crea tu primer pedido usando el formulario</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

const Package = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);
