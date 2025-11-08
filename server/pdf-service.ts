import puppeteer from "puppeteer";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { numberToWords } from "./invoice-service";
import * as fs from "fs";
import * as path from "path";

export async function generateInvoicePDF(invoiceId: number): Promise<string> {
  const invoice = await db.query.invoices.findFirst({
    where: eq(schema.invoices.id, invoiceId),
    with: {
      entity: true,
      items: true,
      bank: true,
      signature: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const html = generateInvoiceHTML(invoice);

  const pdfDir = path.join(process.cwd(), "attached_assets", "invoices");
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  const pdfFileName = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
  const pdfPath = path.join(pdfDir, pdfFileName);
  const relativePath = `/attached_assets/invoices/${pdfFileName}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    await db.update(schema.invoices)
      .set({ pdfUrl: relativePath })
      .where(eq(schema.invoices.id, invoiceId));

    return relativePath;
  } finally {
    await browser.close();
  }
}

function generateInvoiceHTML(invoice: any): string {
  const entity = invoice.entity;
  const bank = invoice.bank;
  const signature = invoice.signature;
  const items = invoice.items || [];

  const invoiceTypeLabel = invoice.type === "export" 
    ? "EXPORT INVOICE"
    : invoice.type === "bill_of_supply"
    ? "BILL OF SUPPLY"
    : invoice.type === "credit_note"
    ? "CREDIT NOTE"
    : invoice.type === "debit_note"
    ? "DEBIT NOTE"
    : "TAX INVOICE";

  const isSameState = parseFloat(invoice.totalIgst || "0") === 0;

  const amountInWords = numberToWords(parseFloat(invoice.grandTotal || "0"));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.4;
      color: #000;
      padding: 10px;
    }
    .header-label {
      text-align: right;
      font-size: 8pt;
      color: #666;
      margin-bottom: 4px;
    }
    .company-header {
      text-align: center;
      margin-bottom: 12px;
    }
    .company-header h1 {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .company-header p {
      font-size: 8pt;
      margin: 1px 0;
    }
    .section {
      margin-bottom: 8px;
    }
    .flex-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }
    .box {
      border: 1px solid #000;
      padding: 6px;
      flex: 1;
    }
    .box-header {
      font-weight: bold;
      margin-bottom: 3px;
      font-size: 8pt;
    }
    .box-content p {
      font-size: 8pt;
      margin: 2px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
    }
    table th, table td {
      border: 1px solid #000;
      padding: 4px;
      text-align: left;
      font-size: 8pt;
    }
    table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-section {
      margin-top: 8px;
    }
    .totals-table {
      width: 300px;
      margin-left: auto;
    }
    .grand-total {
      font-weight: bold;
      background-color: #f0f0f0;
    }
    .footer {
      margin-top: 12px;
      font-size: 7pt;
      text-align: center;
      color: #666;
    }
    .signature-section {
      margin-top: 20px;
      text-align: right;
    }
    .signature-image {
      max-width: 150px;
      max-height: 60px;
      margin-bottom: 4px;
    }
    .company-logo {
      max-width: 120px;
      max-height: 80px;
      margin: 0 auto 8px;
      display: block;
    }
  </style>
</head>
<body>
  <div class="header-label">${invoiceTypeLabel} - ORIGINAL FOR RECIPIENT</div>
  
  <div class="company-header">
    ${entity.logoUrl ? `<img src="${entity.logoUrl}" alt="Company Logo" class="company-logo" />` : ''}
    <h1>${entity.displayName || entity.legalName}</h1>
    ${entity.legalName !== entity.displayName ? `<p>${entity.legalName}</p>` : ''}
    ${entity.gstin ? `<p>GSTIN: ${entity.gstin}</p>` : ''}
    ${entity.addressLine1 ? `<p>${entity.addressLine1}</p>` : ''}
    ${entity.addressLine2 ? `<p>${entity.addressLine2}</p>` : ''}
    <p>${entity.city ? entity.city + ', ' : ''}${entity.state || ''} ${entity.pincode || ''}</p>
    ${entity.phone || entity.email ? `<p>Ph: ${entity.phone || ''} | Email: ${entity.email || ''}</p>` : ''}
    ${entity.website ? `<p>Website: ${entity.website}</p>` : ''}
  </div>

  <div class="section flex-row">
    <div class="box">
      <div class="box-header">Invoice Details</div>
      <div class="box-content">
        <p><strong>Invoice #:</strong> ${invoice.invoiceNumber || 'DRAFT'}</p>
        <p><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
        ${invoice.dueDate ? `<p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}</p>` : ''}
        ${invoice.reference ? `<p><strong>Reference:</strong> ${invoice.reference}</p>` : ''}
        ${invoice.poNumber ? `<p><strong>PO Number:</strong> ${invoice.poNumber}</p>` : ''}
      </div>
    </div>
  </div>

  <div class="section flex-row">
    <div class="box">
      <div class="box-header">Billing To</div>
      <div class="box-content">
        <p><strong>${invoice.buyerName}</strong></p>
        ${invoice.buyerCompany ? `<p>${invoice.buyerCompany}</p>` : ''}
        ${invoice.buyerGstin ? `<p>GSTIN: ${invoice.buyerGstin}</p>` : ''}
        ${invoice.billingAddress ? `<p>${invoice.billingAddress}</p>` : ''}
        ${invoice.buyerEmail ? `<p>Email: ${invoice.buyerEmail}</p>` : ''}
        ${invoice.buyerPhone ? `<p>Ph: ${invoice.buyerPhone}</p>` : ''}
      </div>
    </div>
    <div class="box">
      <div class="box-header">Shipping To</div>
      <div class="box-content">
        ${invoice.shippingAddress ? `<p>${invoice.shippingAddress}</p>` : '<p>Same as Billing Address</p>'}
        ${invoice.placeOfSupply ? `<p><strong>Place of Supply:</strong> ${invoice.placeOfSupply}</p>` : ''}
        ${invoice.vehicleNo ? `<p><strong>Vehicle No:</strong> ${invoice.vehicleNo}</p>` : ''}
        ${invoice.deliveryDate ? `<p><strong>Delivery Date:</strong> ${new Date(invoice.deliveryDate).toLocaleDateString('en-IN')}</p>` : ''}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="text-center">#</th>
        <th>Description</th>
        <th class="text-center">HSN</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Taxable</th>
        <th class="text-center">GST%</th>
        ${isSameState ? `
          <th class="text-right">CGST</th>
          <th class="text-right">SGST</th>
        ` : `
          <th class="text-right">IGST</th>
        `}
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any, index: number) => `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${item.description}</td>
          <td class="text-center">${item.hsnCode || '-'}</td>
          <td class="text-center">${parseFloat(item.quantity || '0').toFixed(2)}</td>
          <td class="text-right">₹${parseFloat(item.rate || '0').toFixed(2)}</td>
          <td class="text-right">₹${parseFloat(item.taxableValue || '0').toFixed(2)}</td>
          <td class="text-center">${parseFloat(item.gstRate || '0')}%</td>
          ${isSameState ? `
            <td class="text-right">₹${parseFloat(item.cgstAmount || '0').toFixed(2)}</td>
            <td class="text-right">₹${parseFloat(item.sgstAmount || '0').toFixed(2)}</td>
          ` : `
            <td class="text-right">₹${parseFloat(item.igstAmount || '0').toFixed(2)}</td>
          `}
          <td class="text-right">₹${parseFloat(item.lineTotal || '0').toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals-section">
    <table class="totals-table">
      <tr>
        <td><strong>Taxable Amount</strong></td>
        <td class="text-right">₹${parseFloat(invoice.subtotal || '0').toFixed(2)}</td>
      </tr>
      ${isSameState ? `
        <tr>
          <td>CGST</td>
          <td class="text-right">₹${parseFloat(invoice.totalCgst || '0').toFixed(2)}</td>
        </tr>
        <tr>
          <td>SGST</td>
          <td class="text-right">₹${parseFloat(invoice.totalSgst || '0').toFixed(2)}</td>
        </tr>
      ` : `
        <tr>
          <td>IGST</td>
          <td class="text-right">₹${parseFloat(invoice.totalIgst || '0').toFixed(2)}</td>
        </tr>
      `}
      ${invoice.roundOff && parseFloat(invoice.roundOff) !== 0 ? `
        <tr>
          <td>Round Off</td>
          <td class="text-right">₹${parseFloat(invoice.roundOff).toFixed(2)}</td>
        </tr>
      ` : ''}
      <tr class="grand-total">
        <td><strong>Grand Total</strong></td>
        <td class="text-right"><strong>₹${parseFloat(invoice.grandTotal || '0').toFixed(2)}</strong></td>
      </tr>
    </table>
  </div>

  <div class="section">
    <p><strong>Amount in Words:</strong> ${amountInWords}</p>
  </div>

  ${bank ? `
  <div class="section">
    <div class="box-header">Bank Details</div>
    <table>
      <tr>
        <td><strong>Bank</strong></td>
        <td>${bank.bankName}</td>
        <td><strong>Account #</strong></td>
        <td>${bank.accountNumber}</td>
      </tr>
      <tr>
        <td><strong>IFSC Code</strong></td>
        <td>${bank.ifsc}</td>
        <td><strong>Branch</strong></td>
        <td>${bank.branch || '-'}</td>
      </tr>
      ${bank.upiId ? `
      <tr>
        <td><strong>UPI ID</strong></td>
        <td colspan="3">${bank.upiId}</td>
      </tr>
      ` : ''}
    </table>
  </div>
  ` : ''}

  ${invoice.notes ? `
  <div class="section">
    <p><strong>Notes:</strong></p>
    <p style="font-size: 8pt;">${invoice.notes}</p>
  </div>
  ` : ''}

  ${invoice.terms ? `
  <div class="section">
    <p><strong>Terms & Conditions:</strong></p>
    <p style="font-size: 8pt;">${invoice.terms}</p>
  </div>
  ` : ''}

  <div class="signature-section">
    ${signature && signature.imageUrl ? `
      <img src="${signature.imageUrl}" class="signature-image" alt="Signature" />
    ` : ''}
    <p><strong>Authorized Signatory</strong></p>
    <p>${entity.displayName}</p>
  </div>

  <div class="footer">
    <p>This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body>
</html>
  `.trim();
}
