import { FileText, ShoppingCart, IndianRupee, TrendingUp, Plus, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

type Invoice = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  buyerName: string;
  grandTotal: string;
  paymentStatus: string;
  isDraft: boolean;
  totalCgst: string;
  totalSgst: string;
  totalIgst: string;
  subtotal: string;
};

type Order = {
  id: number;
  shopifyOrderNumber: string;
  customerName: string;
  total: string;
  orderDate: string;
  hasInvoice: boolean;
};

export default function Dashboard() {
  const { data: invoicesData = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: ordersData = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayInvoices = invoicesData.filter(inv => {
    const invDate = new Date(inv.invoiceDate);
    invDate.setHours(0, 0, 0, 0);
    return invDate.getTime() === today.getTime();
  });

  const uninvoicedOrders = ordersData.filter(order => !order.hasInvoice);

  const recentInvoices = invoicesData
    .slice(0, 5)
    .map(invoice => ({
      id: String(invoice.id),
      number: invoice.invoiceNumber || `INV-${invoice.id}`,
      customer: invoice.buyerName,
      amount: `₹${parseFloat(invoice.grandTotal).toFixed(2)}`,
      status: invoice.isDraft ? 'draft' as const : (invoice.paymentStatus === 'paid' ? 'paid' as const : 'sent' as const),
    }));

  const totalGstCollected = invoicesData
    .filter(inv => !inv.isDraft)
    .reduce((sum, inv) => {
      return sum + 
        parseFloat(inv.totalCgst || '0') + 
        parseFloat(inv.totalSgst || '0') + 
        parseFloat(inv.totalIgst || '0');
    }, 0);

  const totalRevenue = invoicesData
    .filter(inv => !inv.isDraft)
    .reduce((sum, inv) => sum + parseFloat(inv.grandTotal || '0'), 0);

  const totalCgst = invoicesData
    .filter(inv => !inv.isDraft)
    .reduce((sum, inv) => sum + parseFloat(inv.totalCgst || '0'), 0);

  const totalSgst = invoicesData
    .filter(inv => !inv.isDraft)
    .reduce((sum, inv) => sum + parseFloat(inv.totalSgst || '0'), 0);

  const totalIgst = invoicesData
    .filter(inv => !inv.isDraft)
    .reduce((sum, inv) => sum + parseFloat(inv.totalIgst || '0'), 0);

  const totalTaxableValue = invoicesData
    .filter(inv => !inv.isDraft)
    .reduce((sum, inv) => sum + parseFloat(inv.subtotal || '0'), 0);

  const gstSummary = [
    { label: 'CGST Collected', amount: `₹${totalCgst.toFixed(2)}` },
    { label: 'SGST Collected', amount: `₹${totalSgst.toFixed(2)}` },
    { label: 'IGST Collected', amount: `₹${totalIgst.toFixed(2)}` },
    { label: 'Total Taxable Value', amount: `₹${totalTaxableValue.toFixed(2)}` },
  ];

  const statusColors = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your invoicing activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-sync-orders">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Orders
          </Button>
          <Link href="/invoices/new">
            <Button size="sm" data-testid="button-new-invoice">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Invoices"
          value={String(todayInvoices.length)}
          subtitle="Created today"
          icon={FileText}
        />
        <StatCard
          title="Uninvoiced Orders"
          value={String(uninvoicedOrders.length)}
          subtitle="Pending invoicing"
          icon={ShoppingCart}
        />
        <StatCard
          title="Total GST Collected"
          value={`₹${totalGstCollected.toFixed(2)}`}
          subtitle="All time"
          icon={IndianRupee}
        />
        <StatCard
          title="Revenue"
          value={`₹${totalRevenue.toFixed(2)}`}
          subtitle="All time"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-lg font-medium">Recent Invoices</CardTitle>
            <Link href="/invoices">
              <Button variant="ghost" size="sm" data-testid="link-view-all-invoices">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No invoices yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 rounded-lg hover-elevate"
                    data-testid={`card-recent-invoice-${invoice.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium text-sm">{invoice.number}</p>
                        <Badge variant="outline" className={`${statusColors[invoice.status]} border-0 text-xs`}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{invoice.customer}</p>
                    </div>
                    <p className="font-mono font-medium">{invoice.amount}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">GST Summary</CardTitle>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gstSummary.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono font-medium">{item.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-lg font-medium">Uninvoiced Paid Orders</CardTitle>
          <Link href="/orders">
            <Button variant="ghost" size="sm" data-testid="link-view-orders">
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {uninvoicedOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No uninvoiced orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uninvoicedOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg hover-elevate"
                  data-testid={`card-uninvoiced-order-${order.id}`}
                >
                  <div className="flex-1">
                    <p className="font-mono font-medium text-sm">{order.shopifyOrderNumber}</p>
                    <p className="text-sm text-muted-foreground mt-1">{order.customerName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono font-medium">₹{parseFloat(order.total).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.orderDate).toLocaleDateString('en-IN')}</p>
                    </div>
                    <Link href={`/invoices/new?orderId=${order.id}`}>
                      <Button size="sm" variant="outline" data-testid={`button-create-invoice-${order.id}`}>
                        <FileText className="w-3 h-3 mr-1" />
                        Create
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
