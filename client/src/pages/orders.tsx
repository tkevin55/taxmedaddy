import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Upload, Filter, AlertCircle, CheckCircle, FileText } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  discountTotal: string;
  shippingTotal: string;
  paymentStatus: string;
  hasInvoice: boolean;
  invoiceNumber?: string;
  rawJson?: any;
  items?: Array<{
    id: number;
    name: string;
    sku?: string;
    hsnCode?: string;
    quantity: number;
    unitPrice: string;
    gstRate: number;
    discount?: string;
  }>;
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
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: ordersData, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: entitiesData, isLoading: entitiesLoading } = useQuery<Entity[]>({
    queryKey: ["/api/entities"],
  });

  const { data: orderDetails } = useQuery<Order>({
    queryKey: ["/api/orders", selectedOrderForDetails],
    enabled: !!selectedOrderForDetails,
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
      const res = await apiRequest("POST", "/api/orders/bulk-delete", { orderIds });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSelectedOrders([]);
      setIsDeleteConfirmOpen(false);
      setIsDeleteAllConfirmOpen(false);
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
      const res = await apiRequest("POST", "/api/orders/bulk-generate-invoices", { orderIds, entityId });
      return res.json();
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

  const handleViewDetails = (orderId: string) => {
    setSelectedOrderForDetails(orderId);
  };

  const handleBulkDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    bulkDeleteMutation.mutate(selectedOrders);
  };

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders/delete-all", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDeleteAllConfirmOpen(false);
      toast({
        title: "Orders Deleted",
        description: `Successfully deleted ${data.deletedCount} order(s). ${data.skippedCount || 0} order(s) with invoices were skipped.`,
      });
      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Note",
          description: data.errors.join(", "),
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Orders",
        description: error.message || "Could not delete all orders",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAll = () => {
    setIsDeleteAllConfirmOpen(true);
  };

  const handleConfirmDeleteAll = () => {
    deleteAllMutation.mutate();
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
          {orders.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteAll}
              data-testid="button-delete-all"
            >
              Delete All Orders
            </Button>
          )}
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
              onViewDetails={handleViewDetails}
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

      <AlertDialog open={isDeleteAllConfirmOpen} onOpenChange={setIsDeleteAllConfirmOpen}>
        <AlertDialogContent data-testid="dialog-confirm-delete-all">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ALL {ordersData?.length || 0} orders? This action cannot be undone. 
              Orders with invoices will be skipped and cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-all">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAllMutation.isPending}
              data-testid="button-confirm-delete-all"
            >
              {deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedOrderForDetails} onOpenChange={() => setSelectedOrderForDetails(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-order-details">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {orderDetails?.shopifyOrderNumber || 'Loading...'}
            </DialogDescription>
          </DialogHeader>

          {orderDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Order Date</Label>
                  <p className="font-medium">{new Date(orderDetails.orderDate).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Payment Status</Label>
                  <p className="font-medium capitalize">{orderDetails.paymentStatus}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Currency</Label>
                  <p className="font-medium">{orderDetails.rawJson?.currency || 'INR'}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Customer Information</Label>
                <div className="mt-2 space-y-1">
                  <p className="font-medium">{orderDetails.customerName}</p>
                  {orderDetails.customerEmail && <p className="text-sm">{orderDetails.customerEmail}</p>}
                  {orderDetails.customerPhone && <p className="text-sm">{orderDetails.customerPhone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Billing Address</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{orderDetails.billingAddress || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Shipping Address</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{orderDetails.shippingAddress || 'N/A'}</p>
                  {orderDetails.shippingState && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">State:</span> {orderDetails.shippingState} ({orderDetails.shippingStateCode})
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs mb-2">Order Items</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">GST Rate</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderDetails.items?.map((item: any, idx: number) => {
                        const itemSubtotal = item.quantity * parseFloat(item.unitPrice);
                        const discount = parseFloat(item.discount || '0');
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{item.name}</p>
                                {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                                {item.hsnCode && <p className="text-xs text-muted-foreground">HSN: {item.hsnCode}</p>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right font-mono">₹{parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{item.gstRate}%</TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              ₹{itemSubtotal.toFixed(2)}
                              {discount > 0 && <p className="text-xs text-muted-foreground">-₹{discount.toFixed(2)} disc</p>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2 max-w-sm ml-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal (Taxable):</span>
                    <span className="font-mono">₹{parseFloat(orderDetails.subtotal).toFixed(2)}</span>
                  </div>
                  {parseFloat(orderDetails.discountTotal || '0') > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-mono text-destructive">-₹{parseFloat(orderDetails.discountTotal).toFixed(2)}</span>
                    </div>
                  )}
                  {parseFloat(orderDetails.shippingTotal || '0') > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping:</span>
                      <span className="font-mono">₹{parseFloat(orderDetails.shippingTotal).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST Tax:</span>
                    <span className="font-mono">₹{parseFloat(orderDetails.taxTotal || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Grand Total:</span>
                    <span className="font-mono">₹{parseFloat(orderDetails.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {orderDetails.rawJson && Object.keys(orderDetails.rawJson).length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground text-xs mb-2">Additional Information from CSV</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                    {orderDetails.rawJson['Financial Status'] && (
                      <div>
                        <span className="text-muted-foreground">Financial Status:</span>
                        <p className="font-medium capitalize">{orderDetails.rawJson['Financial Status']}</p>
                      </div>
                    )}
                    {orderDetails.rawJson['Paid at'] && (
                      <div>
                        <span className="text-muted-foreground">Paid At:</span>
                        <p className="font-medium">{new Date(orderDetails.rawJson['Paid at']).toLocaleDateString('en-IN')}</p>
                      </div>
                    )}
                    {orderDetails.rawJson['Fulfillment Status'] && (
                      <div>
                        <span className="text-muted-foreground">Fulfillment:</span>
                        <p className="font-medium capitalize">{orderDetails.rawJson['Fulfillment Status']}</p>
                      </div>
                    )}
                    {orderDetails.rawJson['Shipping Name'] && (
                      <div>
                        <span className="text-muted-foreground">Ship To:</span>
                        <p className="font-medium">{orderDetails.rawJson['Shipping Name']}</p>
                      </div>
                    )}
                    {orderDetails.rawJson['Billing Name'] && orderDetails.rawJson['Billing Name'] !== orderDetails.rawJson['Shipping Name'] && (
                      <div>
                        <span className="text-muted-foreground">Bill To:</span>
                        <p className="font-medium">{orderDetails.rawJson['Billing Name']}</p>
                      </div>
                    )}
                    {orderDetails.rawJson['Discount Code'] && (
                      <div>
                        <span className="text-muted-foreground">Discount Code:</span>
                        <p className="font-medium font-mono">{orderDetails.rawJson['Discount Code']}</p>
                      </div>
                    )}
                    {orderDetails.rawJson['Discount Amount'] && parseFloat(orderDetails.rawJson['Discount Amount']) > 0 && (
                      <div>
                        <span className="text-muted-foreground">Discount Amount:</span>
                        <p className="font-medium">₹{parseFloat(orderDetails.rawJson['Discount Amount']).toFixed(2)}</p>
                      </div>
                    )}
                    {orderDetails.rawJson['Shipping Method'] && (
                      <div>
                        <span className="text-muted-foreground">Shipping Method:</span>
                        <p className="font-medium">{orderDetails.rawJson['Shipping Method']}</p>
                      </div>
                    )}
                    {orderDetails.rawJson['Notes'] && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="font-medium">{orderDetails.rawJson['Notes']}</p>
                      </div>
                    )}
                    {orderDetails.rawJson['Tags'] && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Tags:</span>
                        <p className="font-medium">{orderDetails.rawJson['Tags']}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSelectedOrderForDetails(null)}
              data-testid="button-close-details"
            >
              Close
            </Button>
            {orderDetails && !orderDetails.hasInvoice && (
              <Button
                onClick={() => {
                  setSelectedOrderForDetails(null);
                  handleGenerateInvoice(selectedOrderForDetails!);
                }}
                data-testid="button-create-invoice-from-details"
              >
                <FileText className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
