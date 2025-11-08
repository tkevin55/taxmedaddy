import { StatCard } from '../stat-card';
import { FileText, ShoppingCart, IndianRupee, TrendingUp } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
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
  );
}
