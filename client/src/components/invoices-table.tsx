import { Download, Eye, MoreVertical, Send } from "lucide-react";
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
  status: 'draft' | 'sent' | 'paid';
  type: 'tax_invoice' | 'bill_of_supply' | 'export_invoice';
}

interface InvoicesTableProps {
  invoices: Invoice[];
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const typeLabels = {
  tax_invoice: 'Tax Invoice',
  bill_of_supply: 'Bill of Supply',
  export_invoice: 'Export Invoice',
};

export function InvoicesTable({ invoices }: InvoicesTableProps) {
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
                <Badge variant="outline" className={`${statusColors[invoice.status]} border-0`}>
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
                    <DropdownMenuItem data-testid={`button-download-${invoice.id}`}>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
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
