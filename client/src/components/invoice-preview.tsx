import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  supplier: {
    name: string;
    gstin: string;
    address: string;
    state: string;
  };
  buyer: {
    name: string;
    gstin?: string;
    address: string;
    state: string;
  };
  items: Array<{
    description: string;
    hsn: string;
    quantity: number;
    rate: number;
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
}

interface InvoicePreviewProps {
  data: InvoiceData;
}

export function InvoicePreview({ data }: InvoicePreviewProps) {
  return (
    <Card className="p-8 max-w-4xl mx-auto bg-white dark:bg-card" data-testid="card-invoice-preview">
      <div className="space-y-6">
        <div className="flex items-start justify-between pb-6 border-b">
          <div className="flex items-center gap-3">
            <Building2 className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{data.supplier.name}</h1>
              <p className="text-sm text-muted-foreground">GSTIN: {data.supplier.gstin}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">TAX INVOICE</h2>
            <p className="font-mono text-sm mt-1">{data.invoiceNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2">Supplier Details</h3>
            <div className="text-sm">
              <p className="font-medium">{data.supplier.name}</p>
              <p className="text-muted-foreground mt-1">{data.supplier.address}</p>
              <p className="text-muted-foreground">{data.supplier.state}</p>
              <p className="font-mono text-xs mt-1">GSTIN: {data.supplier.gstin}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2">Bill To</h3>
            <div className="text-sm">
              <p className="font-medium">{data.buyer.name}</p>
              <p className="text-muted-foreground mt-1">{data.buyer.address}</p>
              <p className="text-muted-foreground">{data.buyer.state}</p>
              {data.buyer.gstin && (
                <p className="font-mono text-xs mt-1">GSTIN: {data.buyer.gstin}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Invoice Date:</span>{' '}
            <span className="font-medium">{data.invoiceDate}</span>
          </div>
          {data.dueDate && (
            <div>
              <span className="text-muted-foreground">Due Date:</span>{' '}
              <span className="font-medium">{data.dueDate}</span>
            </div>
          )}
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 font-medium">Description</th>
                <th className="text-left p-2 font-medium">HSN</th>
                <th className="text-right p-2 font-medium">Qty</th>
                <th className="text-right p-2 font-medium">Rate</th>
                <th className="text-right p-2 font-medium">Taxable</th>
                <th className="text-right p-2 font-medium">GST%</th>
                {data.items[0]?.igst > 0 ? (
                  <th className="text-right p-2 font-medium">IGST</th>
                ) : (
                  <>
                    <th className="text-right p-2 font-medium">CGST</th>
                    <th className="text-right p-2 font-medium">SGST</th>
                  </>
                )}
                <th className="text-right p-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{item.description}</td>
                  <td className="p-2 font-mono text-xs">{item.hsn}</td>
                  <td className="p-2 text-right font-mono">{item.quantity}</td>
                  <td className="p-2 text-right font-mono">₹{item.rate.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono">₹{item.taxableValue.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono">{item.gstRate}%</td>
                  {item.igst > 0 ? (
                    <td className="p-2 text-right font-mono">₹{item.igst.toFixed(2)}</td>
                  ) : (
                    <>
                      <td className="p-2 text-right font-mono">₹{item.cgst.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono">₹{item.sgst.toFixed(2)}</td>
                    </>
                  )}
                  <td className="p-2 text-right font-mono font-medium">₹{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-80 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxable Value:</span>
              <span className="font-mono">₹{data.totals.taxableValue.toFixed(2)}</span>
            </div>
            {data.totals.igst > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGST:</span>
                <span className="font-mono">₹{data.totals.igst.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST:</span>
                  <span className="font-mono">₹{data.totals.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST:</span>
                  <span className="font-mono">₹{data.totals.sgst.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between pt-2 border-t font-semibold text-base">
              <span>Total Amount:</span>
              <span className="font-mono">₹{data.totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t text-xs text-muted-foreground">
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </Card>
  );
}
