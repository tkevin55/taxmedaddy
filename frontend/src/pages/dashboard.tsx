import { FileText, ShoppingCart, IndianRupee, TrendingUp, Plus, RefreshCw, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
  const { data: invoicesData = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: ordersData = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Calculate current month stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthInvoices = invoicesData.filter(inv => {
    const date = new Date(inv.invoiceDate);
    return date.getMonth() === currentMonth &&
           date.getFullYear() === currentYear &&
           !inv.isDraft;
  });

  const lastMonthInvoices = invoicesData.filter(inv => {
    const date = new Date(inv.invoiceDate);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return date.getMonth() === lastMonth &&
           date.getFullYear() === lastMonthYear &&
           !inv.isDraft;
  });

  const thisMonthRevenue = thisMonthInvoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || '0'), 0);
  const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || '0'), 0);
  const revenueGrowth = lastMonthRevenue > 0
    ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : '0.0';

  const uninvoicedOrders = ordersData.filter(order => !order.hasInvoice);
  const paidInvoices = invoicesData.filter(inv => inv.paymentStatus === 'paid' && !inv.isDraft);
  const unpaidInvoices = invoicesData.filter(inv => inv.paymentStatus !== 'paid' && !inv.isDraft);

  const totalRevenue = invoicesData
    .filter(inv => !inv.isDraft)
    .reduce((sum, inv) => sum + parseFloat(inv.grandTotal || '0'), 0);

  const totalGstCollected = invoicesData
    .filter(inv => !inv.isDraft)
    .reduce((sum, inv) => {
      return sum +
        parseFloat(inv.totalCgst || '0') +
        parseFloat(inv.totalSgst || '0') +
        parseFloat(inv.totalIgst || '0');
    }, 0);

  // Prepare revenue trend data (last 6 months)
  const revenueTrendData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const month = date.getMonth();
    const year = date.getFullYear();

    const monthInvoices = invoicesData.filter(inv => {
      const invDate = new Date(inv.invoiceDate);
      return invDate.getMonth() === month &&
             invDate.getFullYear() === year &&
             !inv.isDraft;
    });

    const revenue = monthInvoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || '0'), 0);

    return {
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      revenue: revenue,
      invoices: monthInvoices.length
    };
  });

  // GST breakdown data
  const totalCgst = invoicesData
    .filter(inv => !inv.isDraft)
    .reduce((sum, inv) => sum + parseFloat(inv.totalCgst || '0'), 0);

  const totalSgst = invoicesData
    .filter(inv => !inv.isDraft)
    .reduce((sum, inv) => sum + parseFloat(inv.totalSgst || '0'), 0);

  const totalIgst = invoicesData
    .filter(inv => !inv.isDraft)
    .reduce((sum, inv) => sum + parseFloat(inv.totalIgst || '0'), 0);

  const gstBreakdownData = [
    { name: 'CGST', amount: totalCgst, fill: '#3B82F6' },
    { name: 'SGST', amount: totalSgst, fill: '#10B981' },
    { name: 'IGST', amount: totalIgst, fill: '#F59E0B' }
  ].filter(item => item.amount > 0);

  const recentInvoices = invoicesData
    .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
    .slice(0, 5)
    .map(invoice => ({
      id: String(invoice.id),
      number: invoice.invoiceNumber || `INV-${invoice.id}`,
      customer: invoice.buyerName,
      amount: parseFloat(invoice.grandTotal),
      date: new Date(invoice.invoiceDate).toLocaleDateString('en-IN'),
      status: invoice.isDraft ? 'draft' as const : (invoice.paymentStatus === 'paid' ? 'paid' as const : 'unpaid' as const),
    }));

  const statusColors = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    unpaid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
  };

  if (invoicesLoading || ordersLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Orders
          </Button>
          <Link href="/invoices/new">
            <Button size="default" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="This Month's Revenue"
          value={`₹${thisMonthRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${thisMonthInvoices.length} invoices`}
          icon={TrendingUp}
          trend={{
            value: `${Math.abs(parseFloat(revenueGrowth))}% from last month`,
            isPositive: parseFloat(revenueGrowth) >= 0
          }}
        />
        <StatCard
          title="Pending Invoices"
          value={String(unpaidInvoices.length)}
          subtitle={`₹${unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || '0'), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} outstanding`}
          icon={Clock}
          trend={{
            value: `${paidInvoices.length} paid`,
            isPositive: true
          }}
        />
        <StatCard
          title="Uninvoiced Orders"
          value={String(uninvoicedOrders.length)}
          subtitle="Ready for invoicing"
          icon={ShoppingCart}
        />
        <StatCard
          title="Total GST Collected"
          value={`₹${totalGstCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle="All time"
          icon={IndianRupee}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Last 6 months revenue overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-sm"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-sm"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* GST Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>GST Breakdown</CardTitle>
            <CardDescription>Tax collection summary</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gstBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Amount']}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription className="mt-1">Latest 5 invoices</CardDescription>
            </div>
            <Link href="/invoices">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No invoices yet</p>
                <Link href="/invoices/new">
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="w-3 h-3 mr-2" />
                    Create your first invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-mono font-semibold text-sm">{invoice.number}</p>
                        <Badge variant="outline" className={`${statusColors[invoice.status]} text-xs px-2`}>
                          {invoice.status === 'paid' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {invoice.status === 'unpaid' && <Clock className="w-3 h-3 mr-1" />}
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{invoice.customer}</p>
                      <p className="text-xs text-muted-foreground mt-1">{invoice.date}</p>
                    </div>
                    <p className="font-mono font-bold text-lg ml-4">
                      ₹{invoice.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Uninvoiced Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Uninvoiced Orders</CardTitle>
              <CardDescription className="mt-1">Orders ready for invoicing</CardDescription>
            </div>
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {uninvoicedOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">All orders have invoices</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uninvoicedOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-semibold text-sm mb-1">{order.shopifyOrderNumber}</p>
                      <p className="text-sm text-muted-foreground truncate">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.orderDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <p className="font-mono font-bold">
                        ₹{parseFloat(order.total).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                      <Link href={`/invoices/new?orderId=${order.id}`}>
                        <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700">
                          <FileText className="w-3 h-3 mr-1" />
                          Invoice
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
    </div>
  );
}
