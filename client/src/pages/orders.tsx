import { useState } from "react";
import { Search, RefreshCw, Filter, FileText } from "lucide-react";
import { OrdersTable } from "@/components/orders-table";
import { FilterPanel } from "@/components/filter-panel";
import { BulkActionsBar } from "@/components/bulk-actions-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Orders() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
    {
      id: '4',
      orderNumber: '#1027',
      date: '2024-01-16',
      customer: 'Sneha Reddy',
      amount: '₹22,400',
      paymentStatus: 'paid' as const,
      fulfillmentStatus: 'partial' as const,
      invoiceStatus: 'uninvoiced' as const,
    },
    {
      id: '5',
      orderNumber: '#1028',
      date: '2024-01-17',
      customer: 'Vikram Singh',
      amount: '₹9,850',
      paymentStatus: 'paid' as const,
      fulfillmentStatus: 'fulfilled' as const,
      invoiceStatus: 'invoiced' as const,
      invoiceNumber: 'INV-002',
    },
  ];

  const handleSelectOrder = (orderId: string, selected: boolean) => {
    if (selected) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and invoice your Shopify orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-sync">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync from Shopify
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {showFilters && (
          <div className="w-64 flex-shrink-0">
            <FilterPanel filterType="orders" onFilterChange={(filters) => console.log('Filters:', filters)} />
          </div>
        )}

        <div className="flex-1 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by number, customer..."
                className="pl-9"
                data-testid="input-search-orders"
              />
            </div>
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          <OrdersTable
            orders={orders}
            onSelectOrder={handleSelectOrder}
            selectedOrders={selectedOrders}
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Showing 1-5 of 156 orders</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled data-testid="button-prev-page">
                Previous
              </Button>
              <Button variant="outline" size="sm" data-testid="button-next-page">
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BulkActionsBar
        selectedCount={selectedOrders.length}
        onClose={() => setSelectedOrders([])}
        onGenerateInvoices={() => console.log('Generate invoices for', selectedOrders)}
        onExport={() => console.log('Export', selectedOrders)}
      />
    </div>
  );
}
