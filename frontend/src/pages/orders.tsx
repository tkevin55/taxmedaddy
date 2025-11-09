import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Search, Upload, ShoppingCart, FileText, CheckCircle, Clock,
  Plus, X, Package, Download, AlertCircle
} from "lucide-react";
import { OrdersTable } from "@/components/orders-table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

type Order = {
  id: number;
  shopifyOrderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  total: string;
  hasInvoice: boolean;
  invoiceNumber?: string;
  paymentStatus: string;
};

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: ordersData, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/orders/import-csv", {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Import failed with status ${res.status}`);
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.refetchQueries({ queryKey: ["/api/orders"] });
      setImportResult(data);
      toast({
        title: "Import Complete",
        description: `Imported ${data.importedCount || 0} orders successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import orders",
        variant: "destructive",
      });
    },
  });

  // Transform orders data
  const allOrders = useMemo(() => {
    return ordersData?.map(order => ({
      id: order.id.toString(),
      orderNumber: order.shopifyOrderNumber,
      date: new Date(order.orderDate).toLocaleDateString('en-IN'),
      dateObj: new Date(order.orderDate),
      customer: order.customerName,
      email: order.customerEmail,
      amount: parseFloat(order.total),
      amountDisplay: `₹${parseFloat(order.total).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      paymentStatus: order.paymentStatus || 'unpaid',
      invoiceStatus: order.hasInvoice ? 'invoiced' : 'uninvoiced',
      invoiceNumber: order.invoiceNumber,
    })) || [];
  }, [ordersData]);

  // Apply filters and search
  const filteredOrders = useMemo(() => {
    let filtered = [...allOrders];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.email?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.invoiceStatus === statusFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    return filtered;
  }, [allOrders, searchQuery, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = allOrders.length;
    const invoiced = allOrders.filter(o => o.invoiceStatus === 'invoiced').length;
    const uninvoiced = allOrders.filter(o => o.invoiceStatus === 'uninvoiced').length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + o.amount, 0);

    return { total, invoiced, uninvoiced, totalRevenue };
  }, [allOrders]);

  const hasActiveFilters = searchQuery || statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const handleImport = () => {
    if (importFile) {
      importMutation.mutate(importFile);
    }
  };

  const handleCloseImportDialog = () => {
    setIsImportDialogOpen(false);
    setImportFile(null);
    setImportResult(null);
  };

  const handleGenerateInvoice = (orderId: string) => {
    navigate(`/invoices/new?orderId=${orderId}`);
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(f => f.name.endsWith('.csv'));

    if (csvFile) {
      setImportFile(csvFile);
      toast({
        title: "File Selected",
        description: csvFile.name,
      });
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleDownloadSample = () => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch("/api/orders/sample-csv", {
      method: "GET",
      headers,
      credentials: "include",
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "orders-sample.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(error => {
        toast({
          title: "Download Failed",
          description: "Could not download sample CSV",
          variant: "destructive",
        });
      });
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
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Import and manage your Shopify orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="default" onClick={handleDownloadSample}>
            <Download className="w-4 h-4 mr-2" />
            Sample CSV
          </Button>
          <Button
            size="default"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Orders
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Invoiced</p>
              <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{stats.invoiced}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Uninvoiced</p>
              <p className="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">{stats.uninvoiced}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <Package className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by order #, customer, email..."
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
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="invoiced">Invoiced</SelectItem>
              <SelectItem value="uninvoiced">Uninvoiced</SelectItem>
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
          </div>
        )}
      </Card>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {hasActiveFilters ? "No orders found" : "No orders yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {hasActiveFilters
                ? "Try adjusting your filters or search query"
                : "Import your Shopify orders CSV to get started"
              }
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsImportDialogOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Orders
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          <OrdersTable
            orders={filteredOrders}
            onGenerateInvoice={handleGenerateInvoice}
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Showing {filteredOrders.length} of {allOrders.length} orders</p>
          </div>
        </>
      )}

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={handleCloseImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Orders from Shopify CSV</DialogTitle>
            <DialogDescription>
              Upload your Shopify orders export CSV file. Orders will be automatically matched with products.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!importResult ? (
              <>
                {/* Drag & Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {importFile ? (
                    <div>
                      <p className="font-medium mb-2">{importFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(importFile.size / 1024).toFixed(2)} KB
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => setImportFile(null)}
                      >
                        Remove file
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium mb-2">
                        Drag & drop your CSV file here
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        or click to browse
                      </p>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="max-w-xs mx-auto cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>CSV Format Requirements</AlertTitle>
                  <AlertDescription>
                    Export your orders from Shopify Admin → Orders → Export. The CSV should include columns like:
                    Name, Email, Created at, Lineitem name, Lineitem quantity, Lineitem price, etc.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Import Complete!</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1 mt-2">
                      <p className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Imported: <strong>{importResult.importedCount || 0}</strong> orders</span>
                      </p>
                      {importResult.duplicates > 0 && (
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span>Skipped (duplicates): <strong>{importResult.duplicates}</strong> orders</span>
                        </p>
                      )}
                      {importResult.skipped > 0 && (
                        <p className="flex items-center gap-2">
                          <X className="w-4 h-4 text-red-600" />
                          <span>Errors: <strong>{importResult.skipped}</strong> orders</span>
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {importResult.errors && importResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Errors Occurred</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 space-y-1 mt-2">
                        {importResult.errors.slice(0, 5).map((error: string, i: number) => (
                          <li key={i} className="text-sm">{error}</li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li className="text-sm">... and {importResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {!importResult ? (
              <>
                <Button variant="outline" onClick={handleCloseImportDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!importFile || importMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {importMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Orders
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={handleCloseImportDialog}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
