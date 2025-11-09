import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Download, Filter, FileText, X } from "lucide-react";
import { InvoicesTable } from "@/components/invoices-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useLocation } from "wouter";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();
  const [, navigate] = useLocation();

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
        toast({
          title: "Success",
          description: "Invoice downloaded successfully",
        });
      })
      .catch(error => {
        toast({
          title: "Download Failed",
          description: error.message || "Could not download PDF",
          variant: "destructive",
        });
      });
  };

  const handleEdit = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}/edit`);
  };

  // Transform invoices data
  const allInvoices = useMemo(() => {
    return invoicesData?.map(invoice => {
      const totalGst = parseFloat(invoice.totalCgst || "0") +
                       parseFloat(invoice.totalSgst || "0") +
                       parseFloat(invoice.totalIgst || "0");

      let status = invoice.paymentStatus || 'unpaid';
      if (invoice.isDraft) {
        status = 'draft';
      }

      let invoiceType: 'tax_invoice' | 'bill_of_supply' | 'export_invoice' = 'tax_invoice';
      if (invoice.type === 'export') {
        invoiceType = 'export_invoice';
      } else if (invoice.type === 'bill_of_supply') {
        invoiceType = 'bill_of_supply';
      }

      return {
        id: invoice.id.toString(),
        invoiceNumber: invoice.invoiceNumber || `INV-${invoice.id}`,
        date: new Date(invoice.invoiceDate).toLocaleDateString('en-IN'),
        dateObj: new Date(invoice.invoiceDate),
        customer: invoice.buyerName,
        gstin: invoice.buyerGstin,
        amount: `₹${parseFloat(invoice.subtotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        gstAmount: `₹${totalGst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        totalAmount: `₹${parseFloat(invoice.grandTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        status,
        type: invoiceType,
        hasPdf: !!invoice.pdfUrl,
      };
    }) || [];
  }, [invoicesData]);

  // Apply filters and search
  const filteredInvoices = useMemo(() => {
    let filtered = [...allInvoices];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.customer.toLowerCase().includes(query) ||
        inv.gstin?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(inv => inv.type === typeFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    return filtered;
  }, [allInvoices, searchQuery, statusFilter, typeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = allInvoices.length;
    const paid = allInvoices.filter(inv => inv.status === 'paid').length;
    const unpaid = allInvoices.filter(inv => inv.status === 'unpaid').length;
    const draft = allInvoices.filter(inv => inv.status === 'draft').length;

    return { total, paid, unpaid, draft };
  }, [allInvoices]);

  const hasActiveFilters = searchQuery || statusFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage and track all your GST invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="default">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/invoices/new">
            <Button size="default" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{stats.paid}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unpaid</p>
              <p className="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">{stats.unpaid}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-yellow-600 dark:bg-yellow-400" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold mt-1 text-gray-600 dark:text-gray-400">{stats.draft}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-600 dark:bg-gray-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice #, customer, GSTIN..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="tax_invoice">Tax Invoice</SelectItem>
              <SelectItem value="bill_of_supply">Bill of Supply</SelectItem>
              <SelectItem value="export_invoice">Export Invoice</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="default" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
              </Badge>
            )}
            {typeFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Type: {typeFilter.replace('_', ' ')}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setTypeFilter("all")} />
              </Badge>
            )}
          </div>
        )}
      </Card>

      {/* Table */}
      {filteredInvoices.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {hasActiveFilters ? "No invoices found" : "No invoices yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {hasActiveFilters
                ? "Try adjusting your filters or search query"
                : "Create your first invoice to get started"
              }
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Link href="/invoices/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <>
          <InvoicesTable invoices={filteredInvoices} onDownloadPDF={handleDownloadPDF} onEdit={handleEdit} />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Showing {filteredInvoices.length} of {allInvoices.length} invoices</p>
          </div>
        </>
      )}
    </div>
  );
}
