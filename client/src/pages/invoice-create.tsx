import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Save, Send, Download, ArrowLeft, Plus, Search, ChevronDown, X, Upload, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InvoicePreview } from "@/components/invoice-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  discountTotal?: string;
  taxTotal: string;
  items?: Array<{
    name: string;
    quantity: string;
    unitPrice: string;
    hsnCode?: string;
    gstRate?: string;
  }>;
};

type Product = {
  id: number;
  name: string;
  sku?: string;
  category?: string;
  defaultPrice?: string;
  hsnCode?: string;
  gstRate?: string;
};

export default function InvoiceCreate() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');

  const { data: orderData, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: signatures = [] } = useQuery<Array<{ id: number; label: string; imageUrl: string }>>({
    queryKey: ["/api/signatures"],
  });

  const { data: entities = [] } = useQuery<Array<{ 
    id: number; 
    displayName: string; 
    legalName: string;
    gstin?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    stateCode?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    website?: string;
  }>>({
    queryKey: ["/api/entities"],
  });

  const { data: banks = [] } = useQuery<Array<{
    id: number;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    branch?: string;
    upiId?: string;
  }>>({
    queryKey: ["/api/banks"],
  });

  const [selectedSignatureId, setSelectedSignatureId] = useState<string>("no-signature");

  useEffect(() => {
    console.log('Location:', location);
    console.log('Window search:', window.location.search);
    console.log('Order ID:', orderId);
    console.log('Order Data:', orderData);
  }, [location, orderId, orderData]);

  useEffect(() => {
    if (entities && entities.length > 0) {
      const entity = entities[0];
      setInvoiceData(prev => ({
        ...prev,
        supplier: {
          name: entity.displayName || entity.legalName,
          gstin: entity.gstin || '',
          address: entity.addressLine1 || '',
          city: entity.city || '',
          state: entity.state || '',
          stateCode: entity.stateCode || '',
          pincode: entity.pincode || '',
          mobile: entity.phone || '',
          email: entity.email || '',
          website: entity.website || '',
        },
      }));
    }
  }, [entities]);

  useEffect(() => {
    if (banks && banks.length > 0) {
      const bank = banks[0];
      setInvoiceData(prev => ({
        ...prev,
        bankDetails: {
          bank: bank.bankName,
          accountNumber: bank.accountNumber,
          ifsc: bank.ifsc,
          branch: bank.branch || '',
          upi: bank.upiId || '',
        },
      }));
    }
  }, [banks]);
  
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [selectedLineItemIndex, setSelectedLineItemIndex] = useState<number>(0);
  const [showCustomHeaders, setShowCustomHeaders] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [reverseCharge, setReverseCharge] = useState(false);
  const [createEWaybill, setCreateEWaybill] = useState(false);
  const [createEInvoice, setCreateEInvoice] = useState(false);
  const [showTDS, setShowTDS] = useState(false);
  const [showTCS, setShowTCS] = useState(false);

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: 'INV-001',
    invoiceDate: '2024-01-15',
    dueDate: '2024-01-30',
    reference: '',
    supplier: {
      name: 'YOUR COMPANY NAME',
      gstin: '',
      address: '',
      city: '',
      state: '',
      stateCode: '',
      pincode: '',
      mobile: '',
      email: '',
      website: '',
    },
    buyer: {
      name: '',
      phone: '',
      email: '',
      gstin: '',
      billingAddress: '',
      billingCity: '',
      billingState: '',
      billingPincode: '',
      shippingAddress: '',
      shippingCity: '',
      shippingState: '',
      shippingPincode: '',
    },
    placeOfSupply: '',
    customHeaders: {
      vehicleNo: '',
      poNumber: '',
      challanNo: '',
      deliveryDate: '',
      salesPerson: '',
      dispatchNumber: '',
    },
    items: [
      {
        id: '1',
        description: '',
        details: '',
        hsn: '',
        quantity: 1,
        unit: 'UNT',
        rate: 0,
        discount: 0,
        gstRate: 5,
        taxableValue: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0,
      },
    ],
    discount: 0,
    notes: '',
    terms: '',
    bankDetails: {
      bank: '',
      accountNumber: '',
      ifsc: '',
      branch: '',
      upi: '',
    },
  });

  const updateInvoice = (path: string, value: any) => {
    setInvoiceData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const recalculateItem = (item: any, placeOfSupply: string, billingState: string, supplierState: string) => {
    const rate = parseFloat(String(item.rate)) || 0;
    const quantity = parseFloat(String(item.quantity)) || 0;
    const discount = parseFloat(String(item.discount)) || 0;
    const gstRate = parseFloat(String(item.gstRate)) || 0;
    
    const lineTotal = rate * quantity;
    const discountAmount = (lineTotal * discount) / 100;
    const totalAfterDiscount = lineTotal - discountAmount;
    
    const taxableValue = totalAfterDiscount / (1 + gstRate / 100);
    const taxAmount = totalAfterDiscount - taxableValue;
    
    return {
      ...item,
      rate,
      quantity,
      discount,
      gstRate,
      taxableValue,
      cgst: 0,
      sgst: 0,
      igst: taxAmount,
      total: totalAfterDiscount,
    };
  };

  const updateItem = (index: number, field: string, value: any) => {
    setInvoiceData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      newItems[index] = recalculateItem(
        newItems[index],
        prev.placeOfSupply,
        prev.buyer.billingState,
        prev.supplier.state
      );
      return { ...prev, items: newItems };
    });
  };

  useEffect(() => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item => recalculateItem(
        item,
        prev.placeOfSupply,
        prev.buyer.billingState,
        prev.supplier.state
      )),
    }));
  }, [invoiceData.placeOfSupply, invoiceData.buyer.billingState]);

  useEffect(() => {
    if (orderData) {
      console.log('Populating form from order data...');
      const placeOfSupply = orderData.shippingStateCode && orderData.shippingState
        ? `${orderData.shippingStateCode}-${orderData.shippingState}`
        : '';

      const orderItems = orderData.items?.map((item, index) => ({
        id: String(index + 1),
        description: item.name || '',
        details: '',
        hsn: item.hsnCode || '',
        quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity || '1'),
        unit: 'UNT',
        rate: typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || '0'),
        discount: 0,
        gstRate: typeof item.gstRate === 'number' ? item.gstRate : parseFloat(item.gstRate || '5'),
        taxableValue: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0,
      })) || [{
        id: '1',
        description: '',
        details: '',
        hsn: '',
        quantity: 1,
        unit: 'UNT',
        rate: 0,
        discount: 0,
        gstRate: 5,
        taxableValue: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0,
      }];

      console.log('Order items mapped:', orderItems);

      setInvoiceData(prev => {
        const orderDiscount = typeof orderData.discountTotal === 'string' 
          ? parseFloat(orderData.discountTotal || '0')
          : (orderData.discountTotal || 0);
        
        const newData = {
          ...prev,
          reference: orderData.shopifyOrderNumber || '',
          discount: orderDiscount,
          buyer: {
            ...prev.buyer,
            name: orderData.customerName || '',
            email: orderData.customerEmail || '',
            phone: orderData.customerPhone || '',
            billingAddress: orderData.billingAddress || '',
            shippingAddress: orderData.shippingAddress || '',
            billingState: orderData.shippingState || '',
            shippingState: orderData.shippingState || '',
          },
          placeOfSupply,
          items: orderItems.map(item => recalculateItem(
            item,
            placeOfSupply,
            orderData.shippingState || '',
            prev.supplier.state
          )),
        };
        console.log('New invoice data:', newData);
        return newData;
      });
    }
  }, [orderData]);

  const calculateTotals = () => {
    const itemTotals = invoiceData.items.reduce(
      (acc, item) => ({
        taxableValue: acc.taxableValue + item.taxableValue,
        cgst: acc.cgst + item.cgst,
        sgst: acc.sgst + item.sgst,
        igst: acc.igst + item.igst,
        total: acc.total + item.total,
      }),
      { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );

    const grossBeforeDiscount = itemTotals.total;
    const discount = Math.min(invoiceData.discount || 0, grossBeforeDiscount);
    const totalAfterDiscount = Math.max(0, grossBeforeDiscount - discount);
    
    if (discount > 0 && grossBeforeDiscount > 0) {
      if (totalAfterDiscount === 0) {
        return {
          subtotal: grossBeforeDiscount,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          total: 0,
          discount,
        };
      }
      
      const discountRatio = totalAfterDiscount / grossBeforeDiscount;
      
      const taxableValueAfterDiscount = itemTotals.taxableValue * discountRatio;
      const igstAfterDiscount = itemTotals.igst * discountRatio;
      
      return {
        subtotal: grossBeforeDiscount,
        taxableValue: taxableValueAfterDiscount,
        cgst: 0,
        sgst: 0,
        igst: igstAfterDiscount,
        total: totalAfterDiscount,
        discount,
      };
    }
    
    return {
      subtotal: grossBeforeDiscount,
      ...itemTotals,
      discount: 0,
    };
  };

  const totals = calculateTotals();

  const addLineItem = () => {
    const newItem = {
      id: String(invoiceData.items.length + 1),
      description: '',
      details: '',
      hsn: '',
      quantity: 1,
      unit: 'UNT',
      rate: 0,
      discount: 0,
      gstRate: 5,
      taxableValue: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 0,
    };
    setInvoiceData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeLineItem = (id: string) => {
    if (invoiceData.items.length > 1) {
      setInvoiceData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id),
      }));
    }
  };

  const handleSelectProduct = (product: Product, itemIndex: number) => {
    const item = invoiceData.items[itemIndex];
    updateItem(itemIndex, 'description', product.name);
    updateItem(itemIndex, 'hsn', product.hsnCode || '');
    updateItem(itemIndex, 'rate', parseFloat(product.defaultPrice || '0'));
    updateItem(itemIndex, 'gstRate', parseFloat(product.gstRate || '5'));
    setProductSearchQuery("");
    setProductSearchOpen(false);
  };

  const filteredProducts = products.filter(product => {
    const query = productSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.defaultPrice?.includes(query) ||
      product.sku?.toLowerCase().includes(query)
    );
  });

  const selectedSignature = selectedSignatureId !== "no-signature" 
    ? signatures.find(s => String(s.id) === selectedSignatureId)
    : null;

  const previewData = {
    ...invoiceData,
    totals,
    signature: selectedSignature,
  };

  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!orderId) {
        throw new Error("No order selected");
      }
      if (!entities || entities.length === 0) {
        throw new Error("No business entity configured. Please add one in Settings.");
      }
      const entityId = entities[0].id;
      const signatureId = selectedSignatureId !== "no-signature" ? parseInt(selectedSignatureId) : null;
      
      const response = await apiRequest("POST", `/api/orders/${orderId}/create-invoice`, {
        entityId,
        signatureId,
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Invoice generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      navigate("/invoices");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invoice",
        variant: "destructive",
      });
    },
  });

  const handleGenerateInvoice = () => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "No order selected",
        variant: "destructive",
      });
      return;
    }
    generateInvoiceMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon" className="w-8 h-8" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">Create Invoice</h1>
              <Input
                value={invoiceData.invoiceNumber}
                onChange={(e) => updateInvoice('invoiceNumber', e.target.value)}
                className="w-32 font-mono h-8"
                data-testid="input-invoice-number-header"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8" data-testid="button-custom-header">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" data-testid="button-save-draft">
            Save as Draft
          </Button>
          <Button variant="outline" size="sm" data-testid="button-save-print">
            Save and Print
          </Button>
          <Button size="sm" data-testid="button-save">
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <Label className="text-xs">Type</Label>
                  <Select defaultValue="regular">
                    <SelectTrigger data-testid="select-invoice-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="export">Export</SelectItem>
                      <SelectItem value="bill_of_supply">Bill of Supply</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex-1">
                  <Label className="text-xs">Dispatch From</Label>
                  <Select>
                    <SelectTrigger data-testid="select-dispatch-from">
                      <SelectValue placeholder="Select address" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Office</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Collapsible open={showCustomHeaders} onOpenChange={setShowCustomHeaders}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="button-toggle-custom-headers">
                    <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showCustomHeaders ? 'rotate-180' : ''}`} />
                    Custom Headers
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Vehicle No</Label>
                      <Input
                        placeholder="Optional"
                        value={invoiceData.customHeaders.vehicleNo}
                        onChange={(e) => updateInvoice('customHeaders.vehicleNo', e.target.value)}
                        data-testid="input-vehicle-no"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">PO Number</Label>
                      <Input
                        placeholder="Optional"
                        value={invoiceData.customHeaders.poNumber}
                        onChange={(e) => updateInvoice('customHeaders.poNumber', e.target.value)}
                        data-testid="input-po-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Challan No</Label>
                      <Input
                        placeholder="Optional"
                        value={invoiceData.customHeaders.challanNo}
                        onChange={(e) => updateInvoice('customHeaders.challanNo', e.target.value)}
                        data-testid="input-challan-no"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Delivery Date</Label>
                      <Input
                        type="date"
                        value={invoiceData.customHeaders.deliveryDate}
                        onChange={(e) => updateInvoice('customHeaders.deliveryDate', e.target.value)}
                        data-testid="input-delivery-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Sales Person</Label>
                      <Input
                        placeholder="Optional"
                        value={invoiceData.customHeaders.salesPerson}
                        onChange={(e) => updateInvoice('customHeaders.salesPerson', e.target.value)}
                        data-testid="input-sales-person"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Dispatch Number</Label>
                      <Input
                        placeholder="Optional"
                        value={invoiceData.customHeaders.dispatchNumber}
                        onChange={(e) => updateInvoice('customHeaders.dispatchNumber', e.target.value)}
                        data-testid="input-dispatch-number"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Customer details</CardTitle>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" data-testid="button-add-customer">
                + Add new Customer?
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Select Customer</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your Customer, Company Name, GSTIN, tags..."
                    className="pl-9"
                    data-testid="input-customer-search"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Customer Name</Label>
                  <Input
                    value={invoiceData.buyer.name}
                    onChange={(e) => updateInvoice('buyer.name', e.target.value)}
                    data-testid="input-customer-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={invoiceData.buyer.phone}
                    onChange={(e) => updateInvoice('buyer.phone', e.target.value)}
                    data-testid="input-customer-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={invoiceData.buyer.email}
                    onChange={(e) => updateInvoice('buyer.email', e.target.value)}
                    data-testid="input-customer-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">GSTIN (Optional)</Label>
                <Input
                  placeholder="29ABCDE1234F1Z5"
                  className="font-mono"
                  value={invoiceData.buyer.gstin}
                  onChange={(e) => updateInvoice('buyer.gstin', e.target.value)}
                  data-testid="input-customer-gstin"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-xs font-medium">Billing Address</Label>
                  <Textarea
                    placeholder="Address"
                    rows={2}
                    value={invoiceData.buyer.billingAddress}
                    onChange={(e) => updateInvoice('buyer.billingAddress', e.target.value)}
                    data-testid="input-billing-address"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="City"
                      value={invoiceData.buyer.billingCity}
                      onChange={(e) => updateInvoice('buyer.billingCity', e.target.value)}
                      data-testid="input-billing-city"
                    />
                    <Input
                      placeholder="Pincode"
                      value={invoiceData.buyer.billingPincode}
                      onChange={(e) => updateInvoice('buyer.billingPincode', e.target.value)}
                      data-testid="input-billing-pincode"
                    />
                  </div>
                  <Select
                    value={invoiceData.buyer.billingState}
                    onValueChange={(v) => updateInvoice('buyer.billingState', v)}
                  >
                    <SelectTrigger data-testid="select-billing-state">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KARNATAKA">Karnataka (29)</SelectItem>
                      <SelectItem value="KERALA">Kerala (32)</SelectItem>
                      <SelectItem value="MAHARASHTRA">Maharashtra (27)</SelectItem>
                      <SelectItem value="JHARKHAND">Jharkhand (20)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Shipping Address</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary"
                      onClick={() => {
                        updateInvoice('buyer.shippingAddress', invoiceData.buyer.billingAddress);
                        updateInvoice('buyer.shippingCity', invoiceData.buyer.billingCity);
                        updateInvoice('buyer.shippingState', invoiceData.buyer.billingState);
                        updateInvoice('buyer.shippingPincode', invoiceData.buyer.billingPincode);
                      }}
                      data-testid="button-copy-billing"
                    >
                      Copy from Billing
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Address"
                    rows={2}
                    value={invoiceData.buyer.shippingAddress}
                    onChange={(e) => updateInvoice('buyer.shippingAddress', e.target.value)}
                    data-testid="input-shipping-address"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="City"
                      value={invoiceData.buyer.shippingCity}
                      onChange={(e) => updateInvoice('buyer.shippingCity', e.target.value)}
                      data-testid="input-shipping-city"
                    />
                    <Input
                      placeholder="Pincode"
                      value={invoiceData.buyer.shippingPincode}
                      onChange={(e) => updateInvoice('buyer.shippingPincode', e.target.value)}
                      data-testid="input-shipping-pincode"
                    />
                  </div>
                  <Select
                    value={invoiceData.buyer.shippingState}
                    onValueChange={(v) => updateInvoice('buyer.shippingState', v)}
                  >
                    <SelectTrigger data-testid="select-shipping-state">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KARNATAKA">Karnataka (29)</SelectItem>
                      <SelectItem value="KERALA">Kerala (32)</SelectItem>
                      <SelectItem value="MAHARASHTRA">Maharashtra (27)</SelectItem>
                      <SelectItem value="JHARKHAND">Jharkhand (20)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Place of Supply</Label>
                <Select
                  value={invoiceData.placeOfSupply}
                  onValueChange={(v) => updateInvoice('placeOfSupply', v)}
                >
                  <SelectTrigger data-testid="select-place-of-supply">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="32-KERALA">32-KERALA</SelectItem>
                    <SelectItem value="29-KARNATAKA">29-KARNATAKA</SelectItem>
                    <SelectItem value="27-MAHARASHTRA">27-MAHARASHTRA</SelectItem>
                    <SelectItem value="20-JHARKHAND">20-JHARKHAND</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Other details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Invoice Date</Label>
                  <Input
                    type="date"
                    value={invoiceData.invoiceDate}
                    onChange={(e) => updateInvoice('invoiceDate', e.target.value)}
                    data-testid="input-invoice-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Due Date</Label>
                  <Input
                    type="date"
                    value={invoiceData.dueDate}
                    onChange={(e) => updateInvoice('dueDate', e.target.value)}
                    data-testid="input-due-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Reference</Label>
                  <Input
                    placeholder="Reference, e.g. PO Number, Sales Person name, Shipment Number etc..."
                    value={invoiceData.reference}
                    onChange={(e) => updateInvoice('reference', e.target.value)}
                    data-testid="input-reference"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Products & Services</CardTitle>
                <Checkbox
                  id="show-description"
                  checked={showDescription}
                  onCheckedChange={(checked) => setShowDescription(checked as boolean)}
                  data-testid="checkbox-show-description"
                />
                <Label htmlFor="show-description" className="text-xs font-normal cursor-pointer">
                  Show description
                </Label>
              </div>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" data-testid="button-add-product">
                + Add new Product?
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productSearchOpen}
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-product-search"
                  >
                    <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Search products by name, type, or price...
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search products..."
                      value={productSearchQuery}
                      onValueChange={setProductSearchQuery}
                      data-testid="input-product-search"
                    />
                    <CommandList>
                      <CommandEmpty>No products found.</CommandEmpty>
                      <CommandGroup>
                        {filteredProducts.slice(0, 20).map((product) => (
                          <CommandItem
                            key={product.id}
                            value={product.name}
                            onSelect={() => handleSelectProduct(product, selectedLineItemIndex)}
                            className="flex items-center justify-between gap-4"
                            data-testid={`product-option-${product.id}`}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {product.category && <span>{product.category}</span>}
                                {product.sku && (
                                  <span className="ml-2">SKU: {product.sku}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm font-mono">
                              ₹ {product.defaultPrice || '0.00'}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="space-y-3">
                {invoiceData.items.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Item {index + 1}</Label>
                      {invoiceData.items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => removeLineItem(item.id)}
                          data-testid={`button-remove-item-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Product Name</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter product name"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          data-testid={`input-product-name-${index}`}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedLineItemIndex(index);
                            setProductSearchOpen(true);
                          }}
                          data-testid={`button-search-product-${index}`}
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {showDescription && (
                      <div className="space-y-2">
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          placeholder="Product description, specifications, materials, care instructions..."
                          rows={3}
                          value={item.details}
                          onChange={(e) => updateItem(index, 'details', e.target.value)}
                          data-testid={`input-description-${index}`}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="font-mono"
                          data-testid={`input-quantity-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Unit</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(v) => updateItem(index, 'unit', v)}
                        >
                          <SelectTrigger data-testid={`select-unit-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UNT">UNT</SelectItem>
                            <SelectItem value="PCS">PCS</SelectItem>
                            <SelectItem value="KG">KG</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">HSN</Label>
                        <Input
                          placeholder="HSN Code"
                          className="font-mono"
                          value={item.hsn}
                          onChange={(e) => updateItem(index, 'hsn', e.target.value)}
                          data-testid={`input-hsn-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="font-mono"
                          value={item.rate || ''}
                          onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          data-testid={`input-unit-price-${index}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Taxable Value</Label>
                        <Input
                          value={`₹${item.taxableValue.toFixed(2)}`}
                          disabled
                          className="font-mono bg-muted"
                          data-testid={`input-taxable-value-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Discount %</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="font-mono"
                          value={item.discount || ''}
                          onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          data-testid={`input-discount-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Tax Rate</Label>
                        <Select
                          value={String(item.gstRate)}
                          onValueChange={(v) => updateItem(index, 'gstRate', parseInt(v))}
                        >
                          <SelectTrigger data-testid={`select-tax-rate-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Total Amount</Label>
                        <Input
                          value={`₹${item.total.toFixed(2)}`}
                          disabled
                          className="font-mono bg-muted"
                          data-testid={`input-total-amount-${index}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addLineItem}
                  data-testid="button-add-line-item"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items: 0, Qty: 0.000</span>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" data-testid="button-create-ai">
                    + Create invoices with AI
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Apply discount(%) to all items?</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-32 font-mono"
                    data-testid="input-global-discount"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-sm font-medium">Additional Charges</CardTitle>
              <Button variant="outline" size="sm" data-testid="button-add-charge">
                <Plus className="w-4 h-4 mr-2" />
                Add Charge
              </Button>
            </CardHeader>
          </Card>

          <Collapsible open={showNotes} onOpenChange={setShowNotes}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start p-0" data-testid="button-toggle-notes">
                    <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showNotes ? 'rotate-180' : ''}`} />
                    <CardTitle className="text-sm font-medium">Notes, terms & more...</CardTitle>
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Notes</Label>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" data-testid="button-new-notes">
                        + New Notes
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Enter your notes, say thanks or anything else..."
                      rows={3}
                      value={invoiceData.notes}
                      onChange={(e) => updateInvoice('notes', e.target.value)}
                      data-testid="input-notes"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Terms & Conditions</Label>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" data-testid="button-new-terms">
                        + New Terms
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Enter your terms and conditions..."
                      rows={3}
                      value={invoiceData.terms}
                      onChange={(e) => updateInvoice('terms', e.target.value)}
                      data-testid="input-terms"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">TDS</Label>
                <Switch
                  checked={showTDS}
                  onCheckedChange={setShowTDS}
                  data-testid="switch-tds"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">TCS</Label>
                <Switch
                  checked={showTCS}
                  onCheckedChange={setShowTCS}
                  data-testid="switch-tcs"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Select Bank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select defaultValue="hdfc">
                <SelectTrigger data-testid="select-bank">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hdfc">HDFC Bank (50200080109371)</SelectItem>
                  <SelectItem value="sbi">SBI (12345678901234)</SelectItem>
                </SelectContent>
              </Select>

              <div className="p-3 bg-muted rounded-lg text-xs space-y-1 font-mono">
                <p>Bank: HDFC Bank</p>
                <p>Account #: 50200080109371</p>
                <p>IFSC Code: HDFC0000150</p>
                <p>Branch: main road</p>
              </div>

              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" data-testid="button-add-bank">
                + Add New Bank
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Add payment (Payment Notes, Amount and Mode)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    placeholder="Advance, UTR number etc..."
                    data-testid="input-payment-notes"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="font-mono"
                    data-testid="input-payment-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Payment Mode</Label>
                  <Select defaultValue="upi">
                    <SelectTrigger data-testid="select-payment-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <Label className="text-sm">Mark as fully paid</Label>
                <Switch
                  checked={markAsPaid}
                  onCheckedChange={setMarkAsPaid}
                  data-testid="switch-mark-paid"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm">Reverse Charge Mechanism applicable?</Label>
                  <p className="text-xs text-muted-foreground">
                    RCM is applicable for unregistered vendors only
                  </p>
                </div>
                <Switch
                  checked={reverseCharge}
                  onCheckedChange={setReverseCharge}
                  data-testid="switch-reverse-charge"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Create E-Waybill</Label>
                <Switch
                  checked={createEWaybill}
                  onCheckedChange={setCreateEWaybill}
                  data-testid="switch-ewaybill"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Create E-Invoice</Label>
                <Switch
                  checked={createEInvoice}
                  onCheckedChange={setCreateEInvoice}
                  data-testid="switch-einvoice"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Attach files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-8">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Attach Files (Max: 5)</p>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs mt-2 text-primary" data-testid="button-attach-files">
                    Choose Files
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Select Signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedSignatureId} onValueChange={setSelectedSignatureId}>
                <SelectTrigger data-testid="select-signature">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-signature">No Signature</SelectItem>
                  {signatures.map((sig) => (
                    <SelectItem key={sig.id} value={String(sig.id)}>
                      {sig.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedSignatureId !== "no-signature" && signatures.find(s => String(s.id) === selectedSignatureId) && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <img
                    src={signatures.find(s => String(s.id) === selectedSignatureId)!.imageUrl}
                    alt="Signature"
                    className="max-h-24 mx-auto object-contain"
                  />
                </div>
              )}
              
              {selectedSignatureId === "no-signature" && (
                <div className="p-8 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
                  No signature selected
                </div>
              )}

              <Link href="/settings" data-testid="link-add-signature">
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary">
                  + Add New Signature in Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2 pt-6">
            <Button variant="outline" data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleGenerateInvoice} data-testid="button-generate-invoice">
              Generate Invoice
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 sticky top-6 h-fit">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Preview</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" data-testid="button-zoom-out">-</Button>
                <Button variant="outline" size="sm" data-testid="button-zoom-in">+</Button>
              </div>
            </div>
            <div className="overflow-auto max-h-[calc(100vh-10rem)]">
              <InvoicePreview data={previewData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
