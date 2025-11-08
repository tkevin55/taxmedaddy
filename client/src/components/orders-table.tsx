import { MoreVertical, FileText, ExternalLink, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customer: string;
  amount: string;
  paymentStatus: string;
  fulfillmentStatus: 'fulfilled' | 'unfulfilled' | 'partial';
  invoiceStatus: 'invoiced' | 'uninvoiced';
  invoiceNumber?: string;
}

interface OrdersTableProps {
  orders: Order[];
  onSelectOrder?: (orderId: string, selected: boolean) => void;
  selectedOrders?: string[];
  onGenerateInvoice?: (orderId: string) => void;
}

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  unpaid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  refunded: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  fulfilled: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  unfulfilled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  invoiced: 'bg-primary/10 text-primary dark:bg-primary/20',
  uninvoiced: 'bg-muted text-muted-foreground',
};

export function OrdersTable({ orders, onSelectOrder, selectedOrders = [], onGenerateInvoice }: OrdersTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = orders.map(o => o.id);
      allIds.forEach(id => onSelectOrder?.(id, true));
    } else {
      selectedOrders.forEach(id => onSelectOrder?.(id, false));
    }
  };

  const handleSelect = (orderId: string, checked: boolean) => {
    onSelectOrder?.(orderId, checked);
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onCheckedChange={handleSelectAll}
                data-testid="checkbox-select-all"
              />
            </TableHead>
            <TableHead className="font-medium">Order #</TableHead>
            <TableHead className="font-medium">Date</TableHead>
            <TableHead className="font-medium">Customer</TableHead>
            <TableHead className="font-medium">Amount</TableHead>
            <TableHead className="font-medium">Payment</TableHead>
            <TableHead className="font-medium">Fulfillment</TableHead>
            <TableHead className="font-medium">Invoice</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
              <TableCell>
                <Checkbox
                  checked={selectedOrders.includes(order.id)}
                  onCheckedChange={(checked) => handleSelect(order.id, checked as boolean)}
                  data-testid={`checkbox-order-${order.id}`}
                />
              </TableCell>
              <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
              <TableCell className="text-sm">{order.date}</TableCell>
              <TableCell>{order.customer}</TableCell>
              <TableCell className="font-mono">{order.amount}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`${statusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'} border-0`}>
                  {order.paymentStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`${statusColors[order.fulfillmentStatus]} border-0`}>
                  {order.fulfillmentStatus}
                </Badge>
              </TableCell>
              <TableCell>
                {order.invoiceStatus === 'invoiced' ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${statusColors[order.invoiceStatus]} border-0`}>
                      <Check className="w-3 h-3 mr-1" />
                      {order.invoiceNumber}
                    </Badge>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onGenerateInvoice?.(order.id)}
                    data-testid={`button-create-invoice-${order.id}`}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Create Invoice
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="w-8 h-8" data-testid={`button-actions-${order.id}`}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem data-testid={`button-view-order-${order.id}`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in Shopify
                    </DropdownMenuItem>
                    {order.invoiceStatus === 'uninvoiced' && (
                      <DropdownMenuItem 
                        onClick={() => onGenerateInvoice?.(order.id)}
                        data-testid={`button-generate-invoice-${order.id}`}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Invoice
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
