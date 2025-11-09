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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  
  const invoiceIdMatch = location.match(/\/invoices\/(\d+)\/edit/);
  const invoiceId = invoiceIdMatch ? invoiceIdMatch[1] : null;
  const isEditMode = !!invoiceId;

  const { data: orderData, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId && !isEditMode,
  });

  const { data: existingInvoice, isLoading: invoiceLoading } = useQuery<any>({
    queryKey: ["/api/invoices", invoiceId],
    enabled: isEditMode,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: signatures = [] } = useQuery<Array<{ id: number; label: string; imageUrl: string }>>({
    queryKey: ["/api/signatures"],
  });

  const { data: entities = [], isLoading: entitiesLoading } = useQuery<Array<{ 
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

  const { data: banks = [], isLoading: banksLoading } = useQuery<Array<{
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
  const [selectedBankId, setSelectedBankId] = useState<string>("no-bank");
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);

  useEffect(() => {
    console.log('Location:', location);
    console.log('Window search:', window.location.search);
    console.log('Order ID:', orderId);
    console.log('Order Data:', orderData);
  }, [location, orderId, orderData]);

  useEffect(() => {
    if (!isEditMode && entities && entities.length > 0) {
      const entity = entities[0];
      setSelectedEntityId(entity.id);
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
  }, [entities, isEditMode]);

  useEffect(() => {
    if (!isEditMode && banks && banks.length > 0) {
      const bank = banks[0];
      setSelectedBankId(String(bank.id));
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
  }, [banks, isEditMode]);
  
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [selectedLineItemIndex, setSelectedLineItemIndex] = useState<number>(0);
  const [showCustomHeaders, setShowCustomHeaders] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState<string>("");
  const [showAdditionalCharges, setShowAdditionalCharges] = useState(false);
  const [additionalCharges, setAdditionalCharges] = useState<Array<{
    name: string;
    tax: number;
    percent: number;
    withoutTax: number;
    withTax: number;
  }>>([]);
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
    paymentMethod: '',
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

  const applyGlobalDiscount = () => {
    const discountValue = parseFloat(globalDiscountPercent) || 0;
    if (discountValue < 0 || discountValue > 100) {
      toast({
        title: "Invalid discount",
        description: "Discount must be between 0 and 100%",
        variant: "destructive",
      });
      return;
    }

    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item => recalculateItem(
        { ...item, discount: discountValue },
        prev.placeOfSupply,
        prev.buyer.billingState,
        prev.supplier.state
      )),
    }));

    toast({
      title: "Discount applied",
      description: `${discountValue}% discount applied to all items`,
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

  useEffect(() => {
    if (existingInvoice) {
      console.log('Populating form from existing invoice...');
      
      const invoiceItems = existingInvoice.items?.map((item: any, index: number) => ({
        id: String(index + 1),
        description: item.description || '',
        details: item.details || '',
        hsn: item.hsnCode || '',
        quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity || '1'),
        unit: item.unit || 'UNT',
        rate: typeof item.rate === 'number' ? item.rate : parseFloat(item.rate || '0'),
        discount: typeof item.discount === 'number' ? item.discount : parseFloat(item.discount || '0'),
        gstRate: typeof item.gstRate === 'number' ? item.gstRate : parseFloat(item.gstRate || '5'),
        taxableValue: typeof item.taxableValue === 'number' ? item.taxableValue : parseFloat(item.taxableValue || '0'),
        cgst: typeof item.cgst === 'number' ? item.cgst : parseFloat(item.cgst || '0'),
        sgst: typeof item.sgst === 'number' ? item.sgst : parseFloat(item.sgst || '0'),
        igst: typeof item.igst === 'number' ? item.igst : parseFloat(item.igst || '0'),
        total: typeof item.total === 'number' ? item.total : parseFloat(item.total || '0'),
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

      setInvoiceData({
        invoiceNumber: existingInvoice.invoiceNumber || 'DRAFT',
        invoiceDate: existingInvoice.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: existingInvoice.dueDate || '',
        reference: existingInvoice.reference || '',
        supplier: {
          name: existingInvoice.entity?.legalName || existingInvoice.supplierName || '',
          gstin: existingInvoice.entity?.gstin || existingInvoice.supplierGstin || '',
          address: existingInvoice.entity?.address || existingInvoice.supplierAddress || '',
          city: existingInvoice.entity?.city || '',
          state: existingInvoice.entity?.state || existingInvoice.supplierState || '',
          stateCode: existingInvoice.entity?.stateCode || '',
          pincode: existingInvoice.entity?.pincode || '',
          mobile: existingInvoice.entity?.phone || '',
          email: existingInvoice.entity?.email || '',
          website: existingInvoice.entity?.website || '',
        },
        buyer: {
          name: existingInvoice.buyerName || '',
          phone: existingInvoice.buyerPhone || '',
          email: existingInvoice.buyerEmail || '',
          gstin: existingInvoice.buyerGstin || '',
          billingAddress: existingInvoice.billingAddress || '',
          billingCity: '',
          billingState: existingInvoice.billingState || '',
          billingPincode: '',
          shippingAddress: existingInvoice.shippingAddress || '',
          shippingCity: '',
          shippingState: existingInvoice.shippingState || '',
          shippingPincode: '',
        },
        placeOfSupply: existingInvoice.placeOfSupply || '',
        items: invoiceItems,
        discount: typeof existingInvoice.discount === 'number' ? existingInvoice.discount : parseFloat(existingInvoice.discount || '0'),
        paymentMethod: existingInvoice.paymentMethod || '',
        notes: '',
        terms: '',
        bankDetails: {
          bank: '',
          accountNumber: '',
          ifsc: '',
          branch: '',
          upi: '',
        },
        customHeaders: {
          vehicleNo: existingInvoice.vehicleNo || '',
          poNumber: existingInvoice.poNumber || '',
          challanNo: existingInvoice.challanNo || '',
          deliveryDate: existingInvoice.deliveryDate || '',
          salesPerson: existingInvoice.salesPerson || '',
          dispatchNumber: '',
        },
      });
      
      if (existingInvoice.entityId) {
        setSelectedEntityId(existingInvoice.entityId);
      }
      if (existingInvoice.bankId) {
        setSelectedBankId(String(existingInvoice.bankId));
      }
      if (existingInvoice.signatureId) {
        setSelectedSignatureId(String(existingInvoice.signatureId));
      }
    }
  }, [existingInvoice]);

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

  const buildInvoicePayload = () => {
    let entityId: number;
    let entity: any;
    
    if (isEditMode && selectedEntityId) {
      entityId = selectedEntityId;
      entity = entities.find(e => e.id === entityId);
      if (!entity) {
        throw new Error("The entity associated with this invoice no longer exists. Please contact support.");
      }
    } else {
      if (!entities || entities.length === 0) {
        throw new Error("No business entity configured. Please add one in Settings.");
      }
      entityId = entities[0].id;
      entity = entities[0];
    }
    
    const bankId = selectedBankId !== "no-bank" ? parseInt(selectedBankId) : null;
    const signatureId = selectedSignatureId !== "no-signature" ? parseInt(selectedSignatureId) : null;
    
    const invoice = {
      entityId: entityId,
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceDate: invoiceData.invoiceDate,
      reference: invoiceData.reference,
      supplierName: entity.legalName || entity.displayName,
      supplierGstin: entity.gstin || '',
      supplierAddress: entity.addressLine1 || '',
      supplierState: entity.state || '',
      buyerName: invoiceData.buyer.name,
      buyerGstin: invoiceData.buyer.gstin,
      buyerPhone: invoiceData.buyer.phone,
      buyerEmail: invoiceData.buyer.email,
      billingAddress: invoiceData.buyer.billingAddress,
      shippingAddress: invoiceData.buyer.shippingAddress,
      billingState: invoiceData.buyer.billingState,
      shippingState: invoiceData.buyer.shippingState,
      placeOfSupply: invoiceData.placeOfSupply,
      vehicleNo: invoiceData.customHeaders.vehicleNo,
      poNumber: invoiceData.customHeaders.poNumber,
      challanNo: invoiceData.customHeaders.challanNo,
      deliveryDate: invoiceData.customHeaders.deliveryDate,
      salesPerson: invoiceData.customHeaders.salesPerson,
      discount: totals.discount?.toString() || "0",
      paymentMethod: invoiceData.paymentMethod || null,
      totalTaxableValue: totals.taxableValue.toFixed(2),
      totalCgst: totals.cgst.toFixed(2),
      totalSgst: totals.sgst.toFixed(2),
      totalIgst: totals.igst.toFixed(2),
      grandTotal: totals.total.toFixed(2),
      bankId,
      signatureId,
      status: 'finalized',
    };
    
    const items = invoiceData.items.map(item => ({
      description: item.description,
      details: item.details,
      hsnCode: item.hsn,
      quantity: item.quantity.toString(),
      unit: item.unit,
      rate: item.rate.toString(),
      discount: item.discount.toString(),
      gstRate: item.gstRate.toString(),
      taxableValue: item.taxableValue.toFixed(2),
      cgst: item.cgst.toFixed(2),
      sgst: item.sgst.toFixed(2),
      igst: item.igst.toFixed(2),
      total: item.total.toFixed(2),
    }));
    
    return { invoice, items };
  };

  const saveInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (isEditMode) {
        const payload = buildInvoicePayload();
        const response = await apiRequest("PUT", `/api/invoices/${invoiceId}`, payload);
        return response;
      } else {
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
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: isEditMode ? "Invoice updated successfully" : "Invoice generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      if (invoiceId) {
        queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
      }
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
      navigate("/invoices");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (isEditMode ? "Failed to update invoice" : "Failed to generate invoice"),
        variant: "destructive",
      });
    },
  });

  const handleSaveInvoice = () => {
    if (!isEditMode && !orderId) {
      toast({
        title: "Error",
        description: "No order selected",
        variant: "destructive",
      });
      return;
    }
    saveInvoiceMutation.mutate();
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
              <h1 className="text-2xl font-semibold">{isEditMode ? 'Edit Invoice' : 'Create Invoice'}</h1>
              <Input
                value={invoiceData.invoiceNumber}
                onChange={(e) => updateInvoice('invoiceNumber', e.target.value)}
                className="w-32 font-mono h-8"
                data-testid="input-invoice-number-header"
                disabled={!isEditMode}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={showPreview ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowPreview(!showPreview)}
            data-testid="button-toggle-preview"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8" data-testid="button-custom-header">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" data-testid="button-save-draft">
            Save as Draft
          </Button>
          <Button variant="outline" size="sm" data-testid="button-save-print" onClick={handleSaveInvoice} disabled={saveInvoiceMutation.isPending || entitiesLoading || banksLoading}>
            {isEditMode ? 'Update and Print' : 'Save and Print'}
          </Button>
          <Button size="sm" data-testid="button-save" onClick={handleSaveInvoice} disabled={saveInvoiceMutation.isPending || entitiesLoading || banksLoading}>
            {saveInvoiceMutation.isPending ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
          </Button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${showPreview ? 'lg:grid-cols-5' : ''}`}>
        <div className={showPreview ? 'lg:col-span-3 space-y-6' : 'space-y-6'}>
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
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-items-reverse"
                    data-testid="checkbox-show-items-reverse"
                  />
                  <Label htmlFor="show-items-reverse" className="text-xs font-normal cursor-pointer">
                    Show items in reverse order
                  </Label>
                </div>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" data-testid="button-add-product">
                  + Add new Product?
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
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
                          Search or scan barcode for existing products
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
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    placeholder="Qty"
                    className="font-mono"
                    data-testid="input-quick-qty"
                  />
                </div>
                <Button variant="default" data-testid="button-add-to-bill">
                  + Add to Bill
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 border-b">
                  <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium">
                    <div className="col-span-3">Product Name</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-2">Price with Tax</div>
                    <div className="col-span-2">Discount on Total Amount</div>
                    <div className="col-span-1 text-right">Total<br/>Net Amount + Tax</div>
                  </div>
                </div>

                <div className="divide-y">
                  {invoiceData.items.map((item, index) => (
                    <div key={item.id}>
                      <div className="grid grid-cols-12 gap-2 p-2 items-start bg-amber-50/30">
                        <div className="col-span-3 space-y-1">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <Input
                                placeholder="Enter product name"
                                value={item.description}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                data-testid={`input-product-name-${index}`}
                                className="h-8 text-sm font-medium border-none shadow-none px-1 bg-transparent"
                              />
                              <div className="flex flex-col gap-1 px-1 mt-1">
                                <button 
                                  className="text-xs text-blue-600 hover:underline text-left"
                                  onClick={() => {
                                    const newHsn = window.prompt('Enter HSN/SAC Code:', item.hsn);
                                    if (newHsn !== null) updateItem(index, 'hsn', newHsn);
                                  }}
                                  data-testid={`button-hsn-${index}`}
                                >
                                  + HSN/SAC
                                </button>
                                <button 
                                  className="text-xs text-blue-600 hover:underline text-left"
                                  onClick={() => {
                                    const newDesc = window.prompt('Enter Description:', item.details);
                                    if (newDesc !== null) updateItem(index, 'details', newDesc);
                                  }}
                                  data-testid={`button-add-description-${index}`}
                                >
                                  + Add Description
                                </button>
                              </div>
                            </div>
                            {invoiceData.items.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6 mt-1 text-destructive hover:text-destructive"
                                onClick={() => removeLineItem(item.id)}
                                data-testid={`button-remove-item-${index}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 flex gap-1">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-8 font-mono text-sm flex-1"
                            data-testid={`input-quantity-${index}`}
                          />
                          <Select
                            value={item.unit}
                            onValueChange={(v) => updateItem(index, 'unit', v)}
                          >
                            <SelectTrigger className="h-8 w-20 text-sm" data-testid={`select-unit-${index}`}>
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

                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="h-8 font-mono text-sm"
                            value={item.rate || ''}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            data-testid={`input-unit-price-${index}`}
                          />
                          <div className="text-xs text-muted-foreground px-1 mt-1">
                            after disc: ₹{(item.rate * (1 - item.discount / 100)).toFixed(2)}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <Input
                            value={`₹${item.total.toFixed(2)}`}
                            disabled
                            className="h-8 font-mono text-sm bg-muted/50"
                            data-testid={`input-price-with-tax-${index}`}
                          />
                          <div className="text-xs text-muted-foreground px-1 mt-1">
                            after disc: ₹{(item.total * (1 - item.discount / 100)).toFixed(2)}
                          </div>
                        </div>

                        <div className="col-span-2 flex gap-1">
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-8 font-mono text-sm flex-1"
                            value={item.discount || ''}
                            onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                            data-testid={`input-discount-${index}`}
                          />
                          <Select value="percent">
                            <SelectTrigger className="h-8 w-16 text-sm" data-testid={`select-discount-type-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">%</SelectItem>
                              <SelectItem value="amount">₹</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-1">
                          <div className="text-right">
                            <div className="font-semibold text-sm">₹{item.total.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.taxableValue.toFixed(2)} + {item.igst.toFixed(2)} ({item.gstRate}%)
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {showDescription && item.details && (
                        <div className="px-2 py-2 bg-muted/30 text-xs text-muted-foreground border-t">
                          {item.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={addLineItem}
                data-testid="button-add-line-item"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Items: {invoiceData.items.length}, Qty: {invoiceData.items.reduce((sum, item) => sum + item.quantity, 0).toFixed(3)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Apply discount(%) to all items</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      className="w-20 h-8 font-mono text-sm"
                      value={globalDiscountPercent}
                      onChange={(e) => setGlobalDiscountPercent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          applyGlobalDiscount();
                        }
                      }}
                      data-testid="input-global-discount"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={applyGlobalDiscount}
                      className="h-8 px-2"
                      data-testid="button-apply-global-discount"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAdditionalCharges(true)}
                  data-testid="button-additional-charges"
                >
                  Additional Charges
                </Button>
              </div>
            </CardContent>
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
                  <Label className="text-xs">Payment Method</Label>
                  <Select 
                    value={invoiceData.paymentMethod} 
                    onValueChange={(value) => updateInvoice('paymentMethod', value)}
                  >
                    <SelectTrigger data-testid="select-payment-method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="netbanking">Net Banking</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="neft">NEFT</SelectItem>
                      <SelectItem value="rtgs">RTGS</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
            <Link href="/invoices">
              <Button variant="outline" data-testid="button-cancel">
                Cancel
              </Button>
            </Link>
            <Button onClick={handleSaveInvoice} disabled={saveInvoiceMutation.isPending || entitiesLoading || banksLoading} data-testid="button-generate-invoice">
              {saveInvoiceMutation.isPending ? 'Saving...' : (isEditMode ? 'Update Invoice' : 'Generate Invoice')}
            </Button>
          </div>
        </div>

        {showPreview && (
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
        )}
      </div>

      <Dialog open={showAdditionalCharges} onOpenChange={setShowAdditionalCharges}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Additional Charges</DialogTitle>
            <DialogDescription>
              Add shipping charges, packaging fees, or other additional charges to the invoice
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 border-b">
                <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium">
                  <div className="col-span-4"></div>
                  <div className="col-span-2 text-center">Tax</div>
                  <div className="col-span-2 text-center">in (%)</div>
                  <div className="col-span-2 text-center">withoutTax in (₹)</div>
                  <div className="col-span-2 text-center">withTax in (₹)</div>
                </div>
              </div>
              
              <div className="divide-y">
                {additionalCharges.map((charge, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-2 items-center">
                    <div className="col-span-4 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-destructive hover:text-destructive"
                        onClick={() => {
                          setAdditionalCharges(prev => prev.filter((_, i) => i !== index));
                        }}
                        data-testid={`button-remove-charge-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Input
                        placeholder="Charge name"
                        value={charge.name}
                        onChange={(e) => {
                          setAdditionalCharges(prev => {
                            const newCharges = [...prev];
                            newCharges[index] = { ...newCharges[index], name: e.target.value };
                            return newCharges;
                          });
                        }}
                        className="h-8 text-sm"
                        data-testid={`input-charge-name-${index}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={charge.tax || ''}
                        onChange={(e) => {
                          const tax = parseFloat(e.target.value) || 0;
                          setAdditionalCharges(prev => {
                            const newCharges = [...prev];
                            newCharges[index] = { ...newCharges[index], tax };
                            return newCharges;
                          });
                        }}
                        className="h-8 font-mono text-sm text-center"
                        data-testid={`input-charge-tax-${index}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={charge.percent || ''}
                        onChange={(e) => {
                          const percent = parseFloat(e.target.value) || 0;
                          setAdditionalCharges(prev => {
                            const newCharges = [...prev];
                            newCharges[index] = { ...newCharges[index], percent };
                            return newCharges;
                          });
                        }}
                        className="h-8 font-mono text-sm text-center"
                        data-testid={`input-charge-percent-${index}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={charge.withoutTax || ''}
                        onChange={(e) => {
                          const withoutTax = parseFloat(e.target.value) || 0;
                          const withTax = withoutTax * (1 + charge.tax / 100);
                          setAdditionalCharges(prev => {
                            const newCharges = [...prev];
                            newCharges[index] = { ...newCharges[index], withoutTax, withTax };
                            return newCharges;
                          });
                        }}
                        className="h-8 font-mono text-sm text-center"
                        data-testid={`input-charge-without-tax-${index}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={charge.withTax || ''}
                        onChange={(e) => {
                          const withTax = parseFloat(e.target.value) || 0;
                          const withoutTax = withTax / (1 + charge.tax / 100);
                          setAdditionalCharges(prev => {
                            const newCharges = [...prev];
                            newCharges[index] = { ...newCharges[index], withoutTax, withTax };
                            return newCharges;
                          });
                        }}
                        className="h-8 font-mono text-sm text-center"
                        data-testid={`input-charge-with-tax-${index}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setAdditionalCharges(prev => [
                  ...prev,
                  { name: 'Shipping Charge (+)', tax: 0, percent: 0, withoutTax: 0, withTax: 0 }
                ]);
              }}
              data-testid="button-add-charge"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Additional Charge
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdditionalCharges(false)} data-testid="button-cancel-charges">
              Cancel
            </Button>
            <Button onClick={() => setShowAdditionalCharges(false)} data-testid="button-save-charges">
              Save Charges
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
