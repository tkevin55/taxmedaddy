import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Download, Filter } from "lucide-react";
import { InvoicesTable } from "@/components/invoices-table";
import { FilterPanel } from "@/components/filter-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

type Invoice = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  buyerName: string;
  buyerGstin?: string;
  subtotal: string;
  totalCgst: string;
  totalSgst: string;
  totalIgst: string;
  grandTotal: string;
  paymentStatus: string;
  isDraft: boolean;
  type: string;
  pdfUrl?: string;
};

export default function Invoices() {
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  const { data: invoicesData, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const handleDownloadPDF = (invoiceId: string, invoiceNumber: string) => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(`/api/invoices/${invoiceId}/pdf`, {
      method: "GET",
      headers,
      credentials: "include",
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Failed to download PDF");
        }
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(error => {
        toast({
          title: "Download Failed",
          description: error.message || "Could not download PDF",
          variant: "destructive",
        });
      });
  };

  const invoices = invoicesData?.map(invoice => {
    const totalGst = parseFloat(invoice.totalCgst || "0") + 
                     parseFloat(invoice.totalSgst || "0") + 
                     parseFloat(invoice.totalIgst || "0");
    
    // Use real backend status - don't collapse values
    let status = invoice.paymentStatus || 'unpaid';
    if (invoice.isDraft) {
      status = 'draft';
    }

    // Map backend type to UI type format
    let invoiceType: 'tax_invoice' | 'bill_of_supply' | 'export_invoice' = 'tax_invoice';
    if (invoice.type === 'export') {
      invoiceType = 'export_invoice';
    } else if (invoice.type === 'bill_of_supply') {
      invoiceType = 'bill_of_supply';
    }

    return {
      id: invoice.id.toString(),
      invoiceNumber: invoice.invoiceNumber || `INV-${invoice.id}`,
      date: new Date(invoice.invoiceDate).toLocaleDateString(),
      customer: invoice.buyerName,
      gstin: invoice.buyerGstin,
      amount: `₹${parseFloat(invoice.subtotal).toFixed(2)}`,
      gstAmount: `₹${totalGst.toFixed(2)}`,
      totalAmount: `₹${parseFloat(invoice.grandTotal).toFixed(2)}`,
      status,
      type: invoiceType,
      hasPdf: !!invoice.pdfUrl,
    };
  }) || [];

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

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found. Generate invoices from your orders to get started.
            </div>
          ) : (
            <InvoicesTable invoices={invoices} onDownloadPDF={handleDownloadPDF} />
          )}

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
