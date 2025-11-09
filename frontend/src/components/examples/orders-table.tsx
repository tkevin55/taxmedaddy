import { OrdersTable } from '../orders-table';

export default function OrdersTableExample() {
  const orders = [
    {
      id: '1',
      orderNumber: '#1024',
      date: '2024-01-15',
      customer: 'Rajesh Kumar',
      amount: '₹12,450',
      paymentStatus: 'paid' as const,
      fulfillmentStatus: 'fulfilled' as const,
      invoiceStatus: 'invoiced' as const,
      invoiceNumber: 'INV-001',
    },
    {
      id: '2',
      orderNumber: '#1025',
      date: '2024-01-15',
      customer: 'Priya Sharma',
      amount: '₹8,900',
      paymentStatus: 'paid' as const,
      fulfillmentStatus: 'unfulfilled' as const,
      invoiceStatus: 'uninvoiced' as const,
    },
    {
      id: '3',
      orderNumber: '#1026',
      date: '2024-01-16',
      customer: 'Amit Patel',
      amount: '₹15,600',
      paymentStatus: 'pending' as const,
      fulfillmentStatus: 'unfulfilled' as const,
      invoiceStatus: 'uninvoiced' as const,
    },
  ];

  return (
    <div className="p-8">
      <OrdersTable orders={orders} onSelectOrder={(id, selected) => console.log('Order', id, 'selected:', selected)} />
    </div>
  );
}
