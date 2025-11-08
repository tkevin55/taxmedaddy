import { useState } from "react";
import { Save, Send, Download, ArrowLeft } from "lucide-react";
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
import { Link } from "wouter";

export default function InvoiceCreate() {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: 'MAA/24-25/001',
    invoiceDate: '15-Jan-2024',
    dueDate: '30-Jan-2024',
    supplier: {
      name: 'My Company Pvt Ltd',
      gstin: '29ABCDE1234F1Z5',
      address: '123, MG Road, Bangalore',
      state: 'Karnataka (29)',
    },
    buyer: {
      name: 'ABC Enterprises',
      gstin: '29XYZAB5678C2D9',
      address: '456, Brigade Road, Bangalore',
      state: 'Karnataka (29)',
    },
    items: [
      {
        description: 'Premium Cotton T-Shirt',
        hsn: '6109',
        quantity: 10,
        rate: 500,
        taxableValue: 5000,
        gstRate: 18,
        cgst: 450,
        sgst: 450,
        igst: 0,
        total: 5900,
      },
    ],
    totals: {
      taxableValue: 5000,
      cgst: 450,
      sgst: 450,
      igst: 0,
      total: 5900,
    },
  });

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
            <h1 className="text-2xl font-semibold">Create Invoice</h1>
            <p className="text-muted-foreground text-sm mt-1">Generate a new GST-compliant invoice</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-save-draft">
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="outline" size="sm" data-testid="button-download">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button size="sm" data-testid="button-send">
            <Send className="w-4 h-4 mr-2" />
            Send Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-type" className="text-xs">Invoice Type</Label>
                  <Select defaultValue="tax_invoice">
                    <SelectTrigger id="invoice-type" data-testid="select-invoice-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tax_invoice">Tax Invoice</SelectItem>
                      <SelectItem value="bill_of_supply">Bill of Supply</SelectItem>
                      <SelectItem value="export_invoice">Export Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-number" className="text-xs">Invoice Number</Label>
                  <Input
                    id="invoice-number"
                    value={invoiceData.invoiceNumber}
                    className="font-mono"
                    data-testid="input-invoice-number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-date" className="text-xs">Invoice Date</Label>
                  <Input id="invoice-date" type="date" data-testid="input-invoice-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date" className="text-xs">Due Date</Label>
                  <Input id="due-date" type="date" data-testid="input-due-date" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Buyer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buyer-name" className="text-xs">Business Name</Label>
                <Input
                  id="buyer-name"
                  value={invoiceData.buyer.name}
                  data-testid="input-buyer-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyer-gstin" className="text-xs">GSTIN (Optional for B2C)</Label>
                <Input
                  id="buyer-gstin"
                  value={invoiceData.buyer.gstin}
                  className="font-mono"
                  placeholder="29ABCDE1234F1Z5"
                  data-testid="input-buyer-gstin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyer-address" className="text-xs">Address</Label>
                <Textarea
                  id="buyer-address"
                  value={invoiceData.buyer.address}
                  rows={2}
                  data-testid="input-buyer-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyer-state" className="text-xs">State</Label>
                <Select defaultValue="karnataka">
                  <SelectTrigger id="buyer-state" data-testid="select-buyer-state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="karnataka">Karnataka (29)</SelectItem>
                    <SelectItem value="maharashtra">Maharashtra (27)</SelectItem>
                    <SelectItem value="tamil-nadu">Tamil Nadu (33)</SelectItem>
                    <SelectItem value="delhi">Delhi (07)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button size="sm" variant="outline" data-testid="button-add-item">
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={invoiceData.items[0].description}
                    data-testid="input-item-description-0"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">HSN Code</Label>
                    <Input
                      value={invoiceData.items[0].hsn}
                      className="font-mono"
                      data-testid="input-item-hsn-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">GST Rate (%)</Label>
                    <Select defaultValue="18">
                      <SelectTrigger data-testid="select-item-gst-0">
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
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      value={invoiceData.items[0].quantity}
                      className="font-mono"
                      data-testid="input-item-quantity-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Rate (₹)</Label>
                    <Input
                      type="number"
                      value={invoiceData.items[0].rate}
                      className="font-mono"
                      data-testid="input-item-rate-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Total</Label>
                    <Input
                      value={`₹${invoiceData.items[0].total}`}
                      disabled
                      className="font-mono bg-muted"
                      data-testid="input-item-total-0"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs">Invoice Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="E.g., Payment terms, delivery instructions..."
                  rows={3}
                  data-testid="input-notes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms" className="text-xs">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  defaultValue="Goods once sold will not be taken back or exchanged."
                  rows={2}
                  data-testid="input-terms"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 sticky top-6 h-fit">
          <div className="bg-muted p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Preview</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" data-testid="button-zoom-out">-</Button>
                <Button variant="outline" size="sm" data-testid="button-zoom-in">+</Button>
              </div>
            </div>
            <div className="overflow-auto max-h-[calc(100vh-12rem)]">
              <InvoicePreview data={invoiceData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
