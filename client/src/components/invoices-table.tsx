import { Download, Eye, MoreVertical, Send, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customer: string;
  gstin?: string;
  amount: string;
  gstAmount: string;
  totalAmount: string;
  status: string; // Allow any backend status value
  type: 'tax_invoice' | 'bill_of_supply' | 'export_invoice';
  hasPdf?: boolean;
}

interface InvoicesTableProps {
  invoices: Invoice[];
  onDownloadPDF?: (invoiceId: string, invoiceNumber: string) => void;
  onEdit?: (invoiceId: string) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  unpaid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const typeLabels = {
  tax_invoice: 'Tax Invoice',
  bill_of_supply: 'Bill of Supply',
  export_invoice: 'Export Invoice',
};

export function InvoicesTable({ invoices, onDownloadPDF, onEdit }: InvoicesTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-medium">Invoice #</TableHead>
            <TableHead className="font-medium">Date</TableHead>
            <TableHead className="font-medium">Customer</TableHead>
            <TableHead className="font-medium">GSTIN</TableHead>
            <TableHead className="font-medium">Type</TableHead>
            <TableHead className="font-medium">Amount</TableHead>
            <TableHead className="font-medium">GST</TableHead>
            <TableHead className="font-medium">Total</TableHead>
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
              <TableCell className="font-mono font-medium">{invoice.invoiceNumber}</TableCell>
              <TableCell className="text-sm">{invoice.date}</TableCell>
              <TableCell>{invoice.customer}</TableCell>
              <TableCell className="font-mono text-xs">{invoice.gstin || '-'}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {typeLabels[invoice.type]}
                </Badge>
              </TableCell>
              <TableCell className="font-mono">{invoice.amount}</TableCell>
              <TableCell className="font-mono">{invoice.gstAmount}</TableCell>
              <TableCell className="font-mono font-medium">{invoice.totalAmount}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`${statusColors[invoice.status] || 'bg-gray-100 text-gray-800'} border-0`}>
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="w-8 h-8" data-testid={`button-actions-${invoice.id}`}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem data-testid={`button-view-${invoice.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onEdit?.(invoice.id)}
                      data-testid={`button-edit-${invoice.id}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Invoice
                    </DropdownMenuItem>
                    {invoice.hasPdf && (
                      <DropdownMenuItem 
                        onClick={() => onDownloadPDF?.(invoice.id, invoice.invoiceNumber)}
                        data-testid={`button-download-${invoice.id}`}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem data-testid={`button-send-${invoice.id}`}>
                      <Send className="w-4 h-4 mr-2" />
                      Send to Customer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
