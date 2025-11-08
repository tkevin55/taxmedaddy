import { useState } from "react";
import { Search, Plus, Download, Filter } from "lucide-react";
import { InvoicesTable } from "@/components/invoices-table";
import { FilterPanel } from "@/components/filter-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

export default function Invoices() {
  const [showFilters, setShowFilters] = useState(false);

  const invoices = [
    {
      id: '1',
      invoiceNumber: 'MAA/24-25/001',
      date: '2024-01-15',
      customer: 'Rajesh Kumar',
      gstin: '29ABCDE1234F1Z5',
      amount: '₹12,450',
      gstAmount: '₹2,241',
      totalAmount: '₹14,691',
      status: 'paid' as const,
      type: 'tax_invoice' as const,
    },
    {
      id: '2',
      invoiceNumber: 'MAA/24-25/002',
      date: '2024-01-15',
      customer: 'Priya Sharma',
      gstin: '29XYZAB5678C2D9',
      amount: '₹8,900',
      gstAmount: '₹1,602',
      totalAmount: '₹10,502',
      status: 'sent' as const,
      type: 'tax_invoice' as const,
    },
    {
      id: '3',
      invoiceNumber: 'MAA/24-25/003',
      date: '2024-01-16',
      customer: 'Global Exports Inc',
      amount: '₹15,600',
      gstAmount: '₹0',
      totalAmount: '₹15,600',
      status: 'draft' as const,
      type: 'export_invoice' as const,
    },
    {
      id: '4',
      invoiceNumber: 'MAA/24-25/004',
      date: '2024-01-16',
      customer: 'Tech Solutions Pvt Ltd',
      gstin: '29PQRST9012E3F4',
      amount: '₹22,400',
      gstAmount: '₹4,032',
      totalAmount: '₹26,432',
      status: 'sent' as const,
      type: 'tax_invoice' as const,
    },
    {
      id: '5',
      invoiceNumber: 'MAA/24-25/005',
      date: '2024-01-17',
      customer: 'Fashion Retail Ltd',
      gstin: '29GHIJK3456L7M8',
      amount: '₹9,850',
      gstAmount: '₹1,773',
      totalAmount: '₹11,623',
      status: 'paid' as const,
      type: 'tax_invoice' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">View and manage all your GST invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/invoices/new">
            <Button size="sm" data-testid="button-new-invoice">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-6">
        {showFilters && (
          <div className="w-64 flex-shrink-0">
            <FilterPanel filterType="invoices" onFilterChange={(filters) => console.log('Filters:', filters)} />
          </div>
        )}

        <div className="flex-1 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice #, customer, GSTIN..."
                className="pl-9"
                data-testid="input-search-invoices"
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

          <InvoicesTable invoices={invoices} />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Showing 1-5 of 248 invoices</p>
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
    </div>
  );
}
