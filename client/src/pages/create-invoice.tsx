import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useRoute, useRouter } from "wouter";
import { ArrowLeft, Save, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
};

type Entity = {
  id: number;
  legalName: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;
  phone?: string;
  email?: string;
};

const invoiceFormSchema = z.object({
  entityId: z.number(),
  buyerName: z.string().min(1, "Customer name is required"),
  buyerEmail: z.string().email().optional().or(z.literal("")),
  buyerPhone: z.string().optional(),
  buyerCompany: z.string().optional(),
  buyerGstin: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  placeOfSupply: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export default function CreateInvoice() {
  const [, params] = useRoute("/invoices/create/:orderId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const orderId = params?.orderId;

  const { data: orderData, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  const { data: entitiesData, isLoading: entitiesLoading } = useQuery<Entity[]>({
    queryKey: ["/api/entities"],
  });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      entityId: 0,
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      buyerCompany: "",
      buyerGstin: "",
      billingAddress: "",
      shippingAddress: "",
      placeOfSupply: "",
      notes: "",
      terms: "",
    },
  });

  useEffect(() => {
    if (orderData && entitiesData?.[0]) {
      const placeOfSupply = orderData.shippingStateCode && orderData.shippingState
        ? `${orderData.shippingStateCode}-${orderData.shippingState}`
        : "";
      
      form.reset({
        entityId: entitiesData[0].id,
        buyerName: orderData.customerName || "",
        buyerEmail: orderData.customerEmail || "",
        buyerPhone: orderData.customerPhone || "",
        buyerCompany: "",
        buyerGstin: "",
        billingAddress: orderData.billingAddress || "",
        shippingAddress: orderData.shippingAddress || "",
        placeOfSupply,
        notes: "",
        terms: "",
      });
    }
  }, [orderData, entitiesData, form]);

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      return apiRequest("POST", `/api/orders/${orderId}/create-invoice`, data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice Created",
        description: `Invoice ${data.invoiceNumber || data.id} generated successfully`,
      });
      navigate("/orders");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Invoice",
        description: error.message || "Could not create invoice",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    createInvoiceMutation.mutate(data);
  });

  if (!orderId) {
    navigate("/orders");
    return null;
  }

  if (orderLoading || entitiesLoading || !orderData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  const selectedEntity = entitiesData?.find(e => e.id === form.watch("entityId"));

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/orders")}
            data-testid="button-back-to-orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Create Invoice</h1>
            <p className="text-sm text-muted-foreground">Order #{orderData.shopifyOrderNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubmit}
            disabled={createInvoiceMutation.isPending}
            data-testid="button-save-invoice"
          >
            <Save className="w-4 h-4 mr-2" />
            {createInvoiceMutation.isPending ? "Saving..." : "Save and Generate"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dispatch From</Label>
                    <Select
                      value={form.watch("entityId")?.toString()}
                      onValueChange={(value) => form.setValue("entityId", parseInt(value))}
                    >
                      <SelectTrigger data-testid="select-entity">
                        <SelectValue placeholder="Select business entity" />
                      </SelectTrigger>
                      <SelectContent>
                        {entitiesData?.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id.toString()}>
                            {entity.legalName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyerName">Customer Name *</Label>
                      <Input
                        id="buyerName"
                        {...form.register("buyerName")}
                        data-testid="input-buyer-name"
                      />
                      {form.formState.errors.buyerName && (
                        <p className="text-sm text-destructive">{form.formState.errors.buyerName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyerPhone">Phone</Label>
                      <Input
                        id="buyerPhone"
                        {...form.register("buyerPhone")}
                        data-testid="input-buyer-phone"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyerEmail">Email</Label>
                      <Input
                        id="buyerEmail"
                        type="email"
                        {...form.register("buyerEmail")}
                        data-testid="input-buyer-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyerGstin">GSTIN (Optional)</Label>
                      <Input
                        id="buyerGstin"
                        className="font-mono"
                        {...form.register("buyerGstin")}
                        data-testid="input-buyer-gstin"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyerCompany">Company Name</Label>
                    <Input
                      id="buyerCompany"
                      {...form.register("buyerCompany")}
                      data-testid="input-buyer-company"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-lg font-semibold mb-4">Addresses</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingAddress">Billing Address</Label>
                    <Textarea
                      id="billingAddress"
                      rows={3}
                      {...form.register("billingAddress")}
                      data-testid="input-billing-address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress">Shipping Address</Label>
                    <Textarea
                      id="shippingAddress"
                      rows={3}
                      {...form.register("shippingAddress")}
                      data-testid="input-shipping-address"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="placeOfSupply">Place of Supply</Label>
                  <Input
                    id="placeOfSupply"
                    placeholder="e.g., 29-Karnataka"
                    {...form.register("placeOfSupply")}
                    data-testid="input-place-of-supply"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      rows={2}
                      placeholder="Any additional notes for the customer"
                      {...form.register("notes")}
                      data-testid="input-notes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="terms">Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      rows={2}
                      placeholder="Payment terms and conditions"
                      {...form.register("terms")}
                      data-testid="input-terms"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </form>
        </div>

        <div className="w-96 border-l bg-muted/30 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Preview</h3>
              <p className="text-sm text-muted-foreground">Invoice preview will appear here</p>
            </div>

            <Card className="p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Customer Details</p>
                <p className="text-sm text-muted-foreground">{form.watch("buyerName") || "No customer selected"}</p>
              </div>

              {selectedEntity && (
                <div>
                  <p className="text-sm font-medium">Billing Address</p>
                  <p className="text-sm text-muted-foreground">{form.watch("billingAddress") || "Not provided"}</p>
                </div>
              )}

              {selectedEntity && (
                <div>
                  <p className="text-sm font-medium">Shipping Address</p>
                  <p className="text-sm text-muted-foreground">{form.watch("shippingAddress") || "Not provided"}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxable Amount</span>
                  <span className="font-mono">₹{parseFloat(orderData.subtotal || "0").toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST</span>
                  <span className="font-mono">₹{parseFloat(orderData.taxTotal || "0").toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span className="font-mono">₹{parseFloat(orderData.total || "0").toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {selectedEntity && (
              <Card className="p-4 space-y-2">
                <p className="text-sm font-medium">Bank Details</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Bank: HDFC Bank</p>
                  <p>Account: 50200080109371</p>
                  <p>IFSC: HDFC0000150</p>
                  <p>Branch: main road</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
