import { QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  supplier: {
    name: string;
    gstin: string;
    address: string;
    city?: string;
    state: string;
    stateCode?: string;
    pincode?: string;
    mobile?: string;
    email?: string;
    website?: string;
  };
  buyer: {
    name: string;
    phone?: string;
    email?: string;
    gstin?: string;
    billingAddress: string;
    billingCity?: string;
    billingState?: string;
    billingPincode?: string;
    shippingAddress: string;
    shippingCity?: string;
    shippingState?: string;
    shippingPincode?: string;
  };
  placeOfSupply?: string;
  items: Array<{
    description: string;
    details?: string;
    hsn: string;
    quantity: number;
    unit?: string;
    rate: number;
    discount?: number;
    taxableValue: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  }>;
  totals: {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
  bankDetails?: {
    bank: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
    upi?: string;
  };
  notes?: string;
  terms?: string;
}

interface InvoicePreviewProps {
  data: InvoiceData;
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const numToWords = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' And ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '');
  };

  return 'INR ' + numToWords(Math.floor(num)) + ' Rupees Only.';
}

export function InvoicePreview({ data }: InvoicePreviewProps) {
  const isIGST = data.totals.igst > 0;
  const totalItems = data.items.length;
  const totalQty = data.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="p-0 max-w-4xl mx-auto bg-white dark:bg-card shadow-none border-0" data-testid="card-invoice-preview">
      <div className="space-y-4 text-xs">
        <div className="text-right text-muted-foreground uppercase text-[10px]">
          TAX INVOICE — ORIGINAL FOR RECIPIENT
        </div>

        <div className="text-center pb-4 border-b">
          <h1 className="text-lg font-bold">{data.supplier.name}</h1>
          <p className="text-[10px] mt-1">GSTIN {data.supplier.gstin}</p>
          <p className="text-[10px]">{data.supplier.address}</p>
          {data.supplier.city && (
            <p className="text-[10px]">{data.supplier.city}, {data.supplier.state}, {data.supplier.pincode}</p>
          )}
          {data.supplier.mobile && (
            <p className="text-[10px]">Mobile {data.supplier.mobile} Email {data.supplier.email}</p>
          )}
          {data.supplier.website && (
            <p className="text-[10px]">Website {data.supplier.website}</p>
          )}
        </div>

        <div className="flex justify-between items-start pb-3">
          <div>
            <p className="font-semibold">Invoice #: {data.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p>Invoice Date: {new Date(data.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pb-4 border-b text-[10px]">
          <div>
            <p className="font-medium mb-1">Customer Details:</p>
            {data.buyer.name ? (
              <>
                <p className="font-semibold">{data.buyer.name}</p>
                {data.buyer.phone && <p>Ph: {data.buyer.phone}</p>}
                {data.buyer.email && <p>{data.buyer.email}</p>}
              </>
            ) : (
              <p className="text-muted-foreground italic">No customer selected</p>
            )}
          </div>
          <div>
            <p className="font-medium mb-1">Billing Address:</p>
            {data.buyer.billingAddress ? (
              <>
                <p>{data.buyer.billingAddress}</p>
                {data.buyer.billingCity && (
                  <p>{data.buyer.billingCity}, {data.buyer.billingState}, {data.buyer.billingPincode}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground italic">Not provided</p>
            )}
          </div>
          <div>
            <p className="font-medium mb-1">Shipping Address:</p>
            {data.buyer.shippingAddress ? (
              <>
                <p>{data.buyer.shippingAddress}</p>
                {data.buyer.shippingCity && (
                  <p>{data.buyer.shippingCity}, {data.buyer.shippingState}, {data.buyer.shippingPincode}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground italic">Not provided</p>
            )}
          </div>
        </div>

        {data.placeOfSupply && (
          <div className="text-[10px]">
            <p><span className="font-medium">Place of Supply:</span> {data.placeOfSupply}</p>
          </div>
        )}

        <div className="border rounded overflow-hidden">
          <table className="w-full text-[10px]">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 font-medium border-r">#</th>
                <th className="text-left p-2 font-medium border-r">Item</th>
                <th className="text-right p-2 font-medium border-r">Rate / Item</th>
                <th className="text-right p-2 font-medium border-r">Disc (%)</th>
                <th className="text-right p-2 font-medium border-r">Qty</th>
                <th className="text-right p-2 font-medium border-r">Taxable Value</th>
                <th className="text-right p-2 font-medium border-r">Tax Amount</th>
                <th className="text-right p-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length > 0 ? (
                data.items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 border-r align-top">{idx + 1}</td>
                    <td className="p-2 border-r">
                      <div>
                        <p className="font-medium">{item.description || 'Untitled Item'}</p>
                        {item.details && (
                          <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-[9px]">{item.details}</p>
                        )}
                        <p className="text-muted-foreground mt-1">HSN: {item.hsn || '-'}</p>
                      </div>
                    </td>
                    <td className="p-2 text-right font-mono border-r align-top">{item.rate.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono border-r align-top">{item.discount || '-'}</td>
                    <td className="p-2 text-right font-mono border-r align-top">{item.quantity} {item.unit || 'UNT'}</td>
                    <td className="p-2 text-right font-mono border-r align-top">{item.taxableValue.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono border-r align-top">
                      {isIGST ? (
                        <span>{item.igst.toFixed(2)} ({item.gstRate}%)</span>
                      ) : (
                        <span>{(item.cgst + item.sgst).toFixed(2)} ({item.gstRate}%)</span>
                      )}
                    </td>
                    <td className="p-2 text-right font-mono align-top">{item.total.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t">
                  <td colSpan={8} className="p-8 text-center text-muted-foreground italic">
                    No items added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-end pb-4 border-b">
          <div className="text-[10px]">
            <p><span className="font-medium">Total Items / Qty :</span> {totalItems} / {totalQty}</p>
          </div>
          <div className="w-80 space-y-1">
            <div className="flex justify-between text-right">
              <span className="text-muted-foreground">Taxable Amount</span>
              <span className="font-mono">₹{data.totals.taxableValue.toFixed(2)}</span>
            </div>
            {isIGST ? (
              <div className="flex justify-between text-right">
                <span className="text-muted-foreground">IGST {data.items[0]?.gstRate || 0}%</span>
                <span className="font-mono">₹{data.totals.igst.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-right">
                  <span className="text-muted-foreground">CGST {(data.items[0]?.gstRate || 0) / 2}%</span>
                  <span className="font-mono">₹{data.totals.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-right">
                  <span className="text-muted-foreground">SGST {(data.items[0]?.gstRate || 0) / 2}%</span>
                  <span className="font-mono">₹{data.totals.sgst.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>Total</span>
              <span className="font-mono">₹{data.totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] pb-4 border-b">
          <p><span className="font-medium">Total amount (in words):</span> {numberToWords(data.totals.total)}</p>
        </div>

        {data.bankDetails && (
          <div className="grid grid-cols-2 gap-8 pb-4 border-b text-[10px]">
            <div>
              <p className="font-medium mb-2">Pay using UPI:</p>
              <div className="w-32 h-32 border-2 border-dashed rounded flex items-center justify-center bg-muted/30">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
            </div>
            <div>
              <p className="font-medium mb-2">Bank Details:</p>
              <div className="space-y-1 font-mono">
                <div className="flex">
                  <span className="w-24">Bank:</span>
                  <span>{data.bankDetails.bank}</span>
                </div>
                <div className="flex">
                  <span className="w-24">Account #:</span>
                  <span>{data.bankDetails.accountNumber}</span>
                </div>
                <div className="flex">
                  <span className="w-24">IFSC Code:</span>
                  <span>{data.bankDetails.ifsc}</span>
                </div>
                <div className="flex">
                  <span className="w-24">Branch:</span>
                  <span>{data.bankDetails.branch}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {(data.notes || data.terms) && (
          <div className="text-[10px] pb-4 border-b space-y-2">
            {data.notes && (
              <div>
                <p className="font-medium">Notes:</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{data.notes}</p>
              </div>
            )}
            {data.terms && (
              <div>
                <p className="font-medium">Terms & Conditions:</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{data.terms}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pb-4">
          <div className="text-center">
            <p className="text-[10px] mb-8">For {data.supplier.name}</p>
            <div className="border-t pt-2">
              <p className="text-[10px] font-medium">Authorized Signatory</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t text-center text-[9px] text-muted-foreground">
          <p>This is a digitally signed document.</p>
        </div>
      </div>
    </Card>
  );
}
