import { InvoicesTable } from '../invoices-table';

export default function InvoicesTableExample() {
  const invoices = [
    {
      id: '1',
      invoiceNumber: 'MAA/24-25/001',
      date: '2024-01-15',
      customer: 'Rajesh Kumar',
      gstin: '29ABCDE1234F1Z5',
      amount: '₹12,450',
      gstAmount: '₹2,241',
      totalAmount: '₹14,691',
      status: 'paid' as const,
      type: 'tax_invoice' as const,
    },
    {
      id: '2',
      invoiceNumber: 'MAA/24-25/002',
      date: '2024-01-15',
      customer: 'Priya Sharma',
      amount: '₹8,900',
      gstAmount: '₹1,602',
      totalAmount: '₹10,502',
      status: 'sent' as const,
      type: 'tax_invoice' as const,
    },
    {
      id: '3',
      invoiceNumber: 'MAA/24-25/003',
      date: '2024-01-16',
      customer: 'Global Exports Inc',
      amount: '₹15,600',
      gstAmount: '₹0',
      totalAmount: '₹15,600',
      status: 'draft' as const,
      type: 'export_invoice' as const,
    },
  ];

  return (
    <div className="p-8">
      <InvoicesTable invoices={invoices} />
    </div>
  );
}
