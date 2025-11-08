import { QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  reference?: string;
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
  discount?: number;
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
    subtotal: number;
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
  signature?: {
    id: number;
    label: string;
    imageUrl: string;
  } | null;
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

        <div className="border rounded p-3 bg-muted/30">
          <p className="font-medium text-[10px] mb-2">Invoice Details</p>
          <div className="space-y-1 text-[10px]">
            <p><span className="font-medium">Invoice #:</span> {data.invoiceNumber}</p>
            <p><span className="font-medium">Date:</span> {new Date(data.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            {data.dueDate && (
              <p><span className="font-medium">Due Date:</span> {new Date(data.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            )}
            {data.reference && (
              <p><span className="font-medium">Reference:</span> {data.reference}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-[10px]">
          <div className="border rounded p-3 bg-muted/30">
            <p className="font-medium mb-2">Billing To</p>
            <div className="space-y-1">
              {data.buyer.name ? (
                <>
                  <p className="font-semibold">{data.buyer.name}</p>
                  {data.buyer.gstin && <p>GSTIN: {data.buyer.gstin}</p>}
                  {data.buyer.billingAddress && <p>{data.buyer.billingAddress}</p>}
                  {data.buyer.email && <p>Email: {data.buyer.email}</p>}
                  {data.buyer.phone && <p>Ph: {data.buyer.phone}</p>}
                </>
              ) : (
                <p className="text-muted-foreground italic">No customer selected</p>
              )}
            </div>
          </div>
          <div className="border rounded p-3 bg-muted/30">
            <p className="font-medium mb-2">Shipping To</p>
            <div className="space-y-1">
              {data.buyer.shippingAddress ? (
                <p>{data.buyer.shippingAddress}</p>
              ) : (
                <p>Same as Billing Address</p>
              )}
              {data.placeOfSupply && (
                <p><span className="font-medium">Place of Supply:</span> {data.placeOfSupply}</p>
              )}
            </div>
          </div>
        </div>

        <div className="border rounded overflow-hidden">
          <table className="w-full text-[10px]">
            <thead className="bg-muted">
              <tr>
                <th className="text-center p-2 font-medium border-r">#</th>
                <th className="text-left p-2 font-medium border-r">Description</th>
                <th className="text-center p-2 font-medium border-r">HSN</th>
                <th className="text-center p-2 font-medium border-r">Qty</th>
                <th className="text-right p-2 font-medium border-r">Rate</th>
                <th className="text-right p-2 font-medium border-r">Taxable</th>
                <th className="text-center p-2 font-medium border-r">GST%</th>
                <th className="text-right p-2 font-medium border-r">IGST</th>
                <th className="text-right p-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length > 0 ? (
                data.items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 border-r align-top text-center">{idx + 1}</td>
                    <td className="p-2 border-r">
                      <p className="font-medium">{item.description || 'Untitled Item'}</p>
                    </td>
                    <td className="p-2 text-center font-mono border-r align-top">{item.hsn || '-'}</td>
                    <td className="p-2 text-center font-mono border-r align-top">{item.quantity.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono border-r align-top">₹{item.rate.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono border-r align-top">₹{item.taxableValue.toFixed(2)}</td>
                    <td className="p-2 text-center font-mono border-r align-top">{item.gstRate}%</td>
                    <td className="p-2 text-right font-mono border-r align-top">₹{item.igst.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono align-top">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t">
                  <td colSpan={9} className="p-8 text-center text-muted-foreground italic">
                    No items added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pb-4 border-b">
          <div className="w-80 space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="font-semibold">Subtotal</span>
              <span className="font-mono text-right">₹{data.totals.subtotal.toFixed(2)}</span>
            </div>
            {data.discount && data.discount > 0 ? (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-mono text-right">-₹{data.discount.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="font-semibold">Taxable Amount</span>
              <span className="font-mono text-right">₹{data.totals.taxableValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGST</span>
              <span className="font-mono text-right">₹{data.totals.igst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Grand Total</span>
              <span className="font-mono font-semibold text-right">₹{data.totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] pb-4 border-b">
          <p><span className="font-medium">Amount in Words:</span> {numberToWords(data.totals.total)}</p>
        </div>

        {data.bankDetails && (
          <div className="pb-4 border-b">
            <p className="font-medium mb-2 text-[10px]">Bank Details</p>
            <div className="border rounded overflow-hidden">
              <table className="w-full text-[10px]">
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-semibold border-r bg-muted/30">Bank</td>
                    <td className="p-2">{data.bankDetails.bank}</td>
                    <td className="p-2 font-semibold border-l border-r bg-muted/30">Account #</td>
                    <td className="p-2">{data.bankDetails.accountNumber}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold border-r bg-muted/30">IFSC Code</td>
                    <td className="p-2">{data.bankDetails.ifsc}</td>
                    <td className="p-2 font-semibold border-l border-r bg-muted/30">Branch</td>
                    <td className="p-2">{data.bankDetails.branch || '-'}</td>
                  </tr>
                  {data.bankDetails.upi && (
                    <tr className="border-t">
                      <td className="p-2 font-semibold border-r bg-muted/30">UPI ID</td>
                      <td colSpan={3} className="p-2">{data.bankDetails.upi}</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
            <p className="text-[10px] mb-2">For {data.supplier.name}</p>
            {data.signature && data.signature.imageUrl && (
              <img 
                src={data.signature.imageUrl} 
                alt="Signature" 
                className="max-w-[180px] max-h-[70px] mx-auto mb-2"
                data-testid="img-signature-preview"
              />
            )}
            <div className={data.signature ? "border-t pt-2" : "mt-16 border-t pt-2"}>
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
