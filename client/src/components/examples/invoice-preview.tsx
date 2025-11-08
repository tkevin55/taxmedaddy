import { InvoicePreview } from '../invoice-preview';

export default function InvoicePreviewExample() {
  const sampleInvoice = {
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
      {
        description: 'Designer Jeans',
        hsn: '6203',
        quantity: 5,
        rate: 1200,
        taxableValue: 6000,
        gstRate: 18,
        cgst: 540,
        sgst: 540,
        igst: 0,
        total: 7080,
      },
    ],
    totals: {
      taxableValue: 11000,
      cgst: 990,
      sgst: 990,
      igst: 0,
      total: 12980,
    },
  };

  return (
    <div className="p-8 bg-muted min-h-screen">
      <InvoicePreview data={sampleInvoice} />
    </div>
  );
}
