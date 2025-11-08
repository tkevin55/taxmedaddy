import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Upload, Filter, AlertCircle, CheckCircle } from "lucide-react";
import { OrdersTable } from "@/components/orders-table";
import { FilterPanel } from "@/components/filter-panel";
import { BulkActionsBar } from "@/components/bulk-actions-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

type Order = {
  id: number;
  shopifyOrderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  billingAddress?: string;
  shippingAddress?: string;
  shippingState?: string;
  shippingStateCode?: string;
  total: string;
  subtotal: string;
  taxTotal: string;
  paymentStatus: string;
  hasInvoice: boolean;
  invoiceNumber?: string;
};

type Entity = {
  id: number;
  legalName: string;
  gstin?: string;
};

export default function Orders() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: ordersData, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: entitiesData, isLoading: entitiesLoading } = useQuery<Entity[]>({
    queryKey: ["/api/entities"],
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
        description: `Imported ${data.importedCount || 0} orders, Skipped ${data.skipped || 0}, Duplicates ${data.duplicates || 0}`,
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

  const generateInvoiceMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Get the first entity - required for invoice generation
      const entities = entitiesData || [];
      if (entities.length === 0) {
        throw new Error("No business entity found. Please create an entity in Settings first.");
      }
      
      const entityId = entities[0].id;
      
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/orders/${orderId}/create-invoice`, {
        method: "POST",
        headers,
        body: JSON.stringify({ entityId }),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed to generate invoice`);
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.refetchQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Invoice Generated",
        description: `Invoice ${data.invoiceNumber || data.id} created successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Generate Invoice",
        description: error.message || "Could not create invoice",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      return apiRequest("POST", "/api/orders/bulk-delete", { orderIds });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSelectedOrders([]);
      setIsDeleteConfirmOpen(false);
      toast({
        title: "Orders Deleted",
        description: `Successfully deleted ${data.deletedCount} order(s)`,
      });
      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Some Orders Could Not Be Deleted",
          description: data.errors.join(", "),
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Orders",
        description: error.message || "Could not delete orders",
        variant: "destructive",
      });
    },
  });

  const bulkGenerateInvoicesMutation = useMutation({
    mutationFn: async ({ orderIds, entityId }: { orderIds: string[]; entityId: number }) => {
      return apiRequest("POST", "/api/orders/bulk-generate-invoices", { orderIds, entityId });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setSelectedOrders([]);
      setIsGenerateConfirmOpen(false);
      toast({
        title: "Invoices Generated",
        description: `Successfully generated ${data.createdCount} invoice(s)`,
      });
      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Some Invoices Could Not Be Generated",
          description: data.errors.join(", "),
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Generate Invoices",
        description: error.message || "Could not generate invoices",
        variant: "destructive",
      });
    },
  });

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

  const handleBulkDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    bulkDeleteMutation.mutate(selectedOrders);
  };

  const handleBulkGenerateInvoices = () => {
    if (entitiesLoading) {
      toast({
        title: "Please Wait",
        description: "Loading business entities...",
        variant: "default",
      });
      return;
    }
    
    if (!entitiesData || entitiesData.length === 0) {
      toast({
        title: "No Business Entity",
        description: "Please create a business entity in Settings first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerateConfirmOpen(true);
  };

  const handleConfirmGenerateInvoices = () => {
    const entityId = entitiesData?.[0]?.id;
    if (!entityId) return;
    bulkGenerateInvoicesMutation.mutate({ orderIds: selectedOrders, entityId });
  };

  const orders = ordersData?.map(order => {
    // Map backend payment status directly - don't collapse values
    const paymentStatus = (order.paymentStatus || 'unpaid') as 'paid' | 'pending' | 'partial' | 'refunded' | 'unpaid';

    return {
      id: order.id.toString(),
      orderNumber: order.shopifyOrderNumber,
      date: new Date(order.orderDate).toLocaleDateString(),
      customer: order.customerName,
      amount: `₹${parseFloat(order.total).toFixed(2)}`,
      paymentStatus,
      fulfillmentStatus: 'fulfilled' as const, // Placeholder - backend doesn't track this field
      invoiceStatus: order.hasInvoice ? 'invoiced' as const : 'uninvoiced' as const,
      invoiceNumber: order.invoiceNumber,
    };
  }) || [];

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
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setIsImportDialogOpen(true)}
            data-testid="button-import-csv"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
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

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders found. Import your Shopify orders CSV to get started.
            </div>
          ) : (
            <OrdersTable
              orders={orders}
              onSelectOrder={handleSelectOrder}
              selectedOrders={selectedOrders}
              onGenerateInvoice={handleGenerateInvoice}
            />
          )}

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
        onGenerateInvoices={handleBulkGenerateInvoices}
        onDelete={handleBulkDelete}
      />

      <Dialog open={isImportDialogOpen} onOpenChange={handleCloseImportDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-import-csv">
          <DialogHeader>
            <DialogTitle>Import Orders from Shopify CSV</DialogTitle>
            <DialogDescription>
              Upload your Shopify orders export CSV file. The system will automatically match products and calculate GST.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!importResult ? (
              <>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="max-w-xs mx-auto"
                    data-testid="input-csv-file"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {importFile ? importFile.name : "Select a CSV file"}
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>CSV Format</AlertTitle>
                  <AlertDescription>
                    Export your orders from Shopify. The CSV should include columns like: Name, Email, Created at, Lineitem name, Lineitem quantity, Lineitem price, Shipping Province Code, etc.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div className="space-y-4">
                <Alert className={importResult.errors?.length > 0 ? "border-destructive" : ""}>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Import Complete</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>✓ Imported: {importResult.importedCount || 0} orders</p>
                      <p>⊘ Duplicates: {importResult.duplicates || 0} orders</p>
                      <p>⊗ Skipped: {importResult.skipped || 0} orders</p>
                    </div>
                  </AlertDescription>
                </Alert>

                {importResult.errors && importResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Errors</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 space-y-1">
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
                <Button variant="outline" onClick={handleCloseImportDialog} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!importFile || importMutation.isPending}
                  data-testid="button-upload"
                >
                  {importMutation.isPending ? "Importing..." : "Upload & Import"}
                </Button>
              </>
            ) : (
              <Button onClick={handleCloseImportDialog} data-testid="button-close">
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent data-testid="dialog-confirm-delete">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedOrders.length} order(s)? This action cannot be undone. 
              Orders with invoices cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isGenerateConfirmOpen} onOpenChange={setIsGenerateConfirmOpen}>
        <AlertDialogContent data-testid="dialog-confirm-generate">
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Invoices</AlertDialogTitle>
            <AlertDialogDescription>
              Generate invoices for {selectedOrders.length} selected order(s)? 
              Invoices will be created using your default business entity. 
              Orders that already have invoices will be skipped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-generate">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmGenerateInvoices}
              disabled={bulkGenerateInvoicesMutation.isPending}
              data-testid="button-confirm-generate"
            >
              {bulkGenerateInvoicesMutation.isPending ? "Generating..." : "Generate Invoices"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
