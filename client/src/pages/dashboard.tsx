import { FileText, ShoppingCart, IndianRupee, TrendingUp, Plus, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Dashboard() {
  const recentInvoices = [
    { id: '1', number: 'MAA/24-25/001', customer: 'Rajesh Kumar', amount: '₹14,691', status: 'paid' as const },
    { id: '2', number: 'MAA/24-25/002', customer: 'Priya Sharma', amount: '₹10,502', status: 'sent' as const },
    { id: '3', number: 'MAA/24-25/003', customer: 'Amit Patel', amount: '₹18,920', status: 'draft' as const },
  ];

  const uninvoicedOrders = [
    { id: '1', number: '#1026', customer: 'Global Exports', amount: '₹15,600', date: '2024-01-16' },
    { id: '2', number: '#1027', customer: 'Tech Solutions', amount: '₹22,400', date: '2024-01-16' },
    { id: '3', number: '#1028', customer: 'Fashion Hub', amount: '₹9,850', date: '2024-01-17' },
  ];

  const gstSummary = [
    { label: 'CGST Collected', amount: '₹45,680', percentage: '9%' },
    { label: 'SGST Collected', amount: '₹45,680', percentage: '9%' },
    { label: 'IGST Collected', amount: '₹0', percentage: '0%' },
    { label: 'Total Taxable Value', amount: '₹5,07,550', percentage: '-' },
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
          value="24"
          subtitle="+3 from yesterday"
          icon={FileText}
          trend={{ value: "14%", isPositive: true }}
        />
        <StatCard
          title="Uninvoiced Orders"
          value="156"
          subtitle="Pending invoicing"
          icon={ShoppingCart}
        />
        <StatCard
          title="Total GST Collected"
          value="₹2,45,680"
          subtitle="This month"
          icon={IndianRupee}
          trend={{ value: "8%", isPositive: true }}
        />
        <StatCard
          title="Revenue"
          value="₹14,25,300"
          subtitle="This month"
          icon={TrendingUp}
          trend={{ value: "12%", isPositive: true }}
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
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono font-medium">{item.amount}</span>
                  </div>
                  {item.percentage !== '-' && (
                    <p className="text-xs text-muted-foreground mt-1">Rate: {item.percentage}</p>
                  )}
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
          <div className="space-y-3">
            {uninvoicedOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg hover-elevate"
                data-testid={`card-uninvoiced-order-${order.id}`}
              >
                <div className="flex-1">
                  <p className="font-mono font-medium text-sm">{order.number}</p>
                  <p className="text-sm text-muted-foreground mt-1">{order.customer}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono font-medium">{order.amount}</p>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                  <Button size="sm" variant="outline" data-testid={`button-create-invoice-${order.id}`}>
                    <FileText className="w-3 h-3 mr-1" />
                    Create
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
