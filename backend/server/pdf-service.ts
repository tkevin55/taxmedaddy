import puppeteer from "puppeteer";
import { db } from "./db";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";
import { numberToWords } from "./invoice-service";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

function getChromiumPath(): string {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  
  try {
    const chromiumPath = execSync('which chromium || which chromium-browser || which google-chrome', {
      encoding: 'utf8'
    }).trim();
    return chromiumPath;
  } catch (error) {
    throw new Error('Could not find Chromium browser. Please install chromium or set PUPPETEER_EXECUTABLE_PATH environment variable.');
  }
}

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
    executablePath: getChromiumPath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
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

  let signatureDataUrl = null;
  if (signature && signature.imageUrl) {
    try {
      const relativePath = signature.imageUrl.startsWith('/') 
        ? signature.imageUrl.substring(1) 
        : signature.imageUrl;
      const signaturePath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(signaturePath)) {
        const imageBuffer = fs.readFileSync(signaturePath);
        const base64Image = imageBuffer.toString('base64');
        const ext = path.extname(signature.imageUrl).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
        signatureDataUrl = `data:${mimeType};base64,${base64Image}`;
      }
    } catch (error) {
      console.error('Error loading signature image:', error);
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 16px;
      background: #ffffff;
    }
    .header-label {
      text-align: right;
      font-size: 7pt;
      color: #6b7280;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .company-header {
      text-align: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 16px;
    }
    .company-header h1 {
      font-size: 18pt;
      font-weight: 700;
      margin-bottom: 4px;
      color: #111827;
    }
    .company-header p {
      font-size: 9pt;
      margin: 2px 0;
      color: #374151;
    }
    .section {
      margin-bottom: 12px;
    }
    .flex-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    .box {
      border: 1px solid #d1d5db;
      border-radius: 4px;
      padding: 10px;
      flex: 1;
      background-color: #f9fafb;
    }
    .box-header {
      font-weight: 600;
      margin-bottom: 6px;
      font-size: 9pt;
      color: #111827;
    }
    .box-content p {
      font-size: 9pt;
      margin: 3px 0;
      color: #374151;
    }
    .box-content strong {
      font-weight: 600;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      overflow: hidden;
    }
    table th, table td {
      border: 1px solid #e5e7eb;
      padding: 8px 6px;
      text-align: left;
      font-size: 9pt;
    }
    table th {
      background-color: #f3f4f6;
      font-weight: 600;
      color: #111827;
      text-transform: capitalize;
    }
    table td {
      color: #374151;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-section {
      margin-top: 12px;
      margin-bottom: 12px;
    }
    .totals-table {
      width: 320px;
      margin-left: auto;
      border: 1px solid #d1d5db;
    }
    .totals-table td {
      padding: 6px 10px;
      font-size: 9pt;
    }
    .grand-total {
      font-weight: 700;
      background-color: #f3f4f6;
      font-size: 10pt;
    }
    .footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 8pt;
      text-align: center;
      color: #6b7280;
    }
    .signature-section {
      margin-top: 24px;
      text-align: right;
      padding-top: 12px;
    }
    .signature-section p {
      font-size: 9pt;
      margin: 3px 0;
      color: #374151;
    }
    .signature-section strong {
      font-weight: 600;
      color: #111827;
    }
    .signature-image {
      max-width: 180px;
      max-height: 70px;
      margin-bottom: 8px;
    }
    .company-logo {
      max-width: 140px;
      max-height: 90px;
      margin: 0 auto 10px;
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
        <th class="text-right">Disc.</th>
        <th class="text-right">Taxable</th>
        <th class="text-center">GST%</th>
        <th class="text-right">IGST</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any, index: number) => {
        const discount = parseFloat(item.discount || item.discountPercent || '0');
        return `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${item.description}</td>
          <td class="text-center">${item.hsnCode || '-'}</td>
          <td class="text-center">${parseFloat(item.quantity || '0').toFixed(2)}</td>
          <td class="text-right">₹${parseFloat(item.rate || '0').toFixed(2)}</td>
          <td class="text-right">${discount > 0 ? `₹${discount.toFixed(2)}` : '-'}</td>
          <td class="text-right">₹${parseFloat(item.taxableValue || '0').toFixed(2)}</td>
          <td class="text-center">${parseFloat(item.gstRate || '0')}%</td>
          <td class="text-right">₹${parseFloat(item.igstAmount || '0').toFixed(2)}</td>
          <td class="text-right">₹${parseFloat(item.lineTotal || '0').toFixed(2)}</td>
        </tr>
      `;
      }).join('')}
    </tbody>
  </table>

  <div class="totals-section">
    <table class="totals-table">
      ${invoice.discountTotal && parseFloat(invoice.discountTotal) > 0 ? `
        <tr>
          <td><strong>Subtotal</strong></td>
          <td class="text-right">₹${(parseFloat(invoice.grandTotal || '0') + parseFloat(invoice.discountTotal || '0')).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Discount</td>
          <td class="text-right">-₹${parseFloat(invoice.discountTotal).toFixed(2)}</td>
        </tr>
      ` : ''}
      <tr>
        <td><strong>Taxable Amount</strong></td>
        <td class="text-right">₹${parseFloat(invoice.subtotal || '0').toFixed(2)}</td>
      </tr>
      <tr>
        <td>IGST</td>
        <td class="text-right">₹${parseFloat(invoice.totalIgst || '0').toFixed(2)}</td>
      </tr>
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
    ${signatureDataUrl ? `
      <img src="${signatureDataUrl}" class="signature-image" alt="Signature" />
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
