import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

interface InvoiceItemCalculation {
  description: string;
  hsnCode: string | null;
  quantity: string;
  unit: string;
  rate: string;
  priceIncludesTax: boolean;
  discountPercent: string;
  taxableValue: string;
  gstRate: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  cessAmount: string;
  lineTotal: string;
  productId: number | null;
}

export async function buildInvoiceFromOrder(
  orderId: number,
  entityId: number,
  accountId: number
) {
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.id, orderId),
    with: {
      items: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const entity = await db.query.entities.findFirst({
    where: eq(schema.entities.id, entityId),
  });

  if (!entity) {
    throw new Error("Entity not found");
  }

  const entityStateCode = entity.stateCode?.trim() || "";
  const shippingStateCode = order.shippingStateCode?.trim() || "";
  const isSameState = entityStateCode === shippingStateCode;

  const calculatedItems: InvoiceItemCalculation[] = order.items.map((item) => {
    const quantity = parseFloat(item.quantity || "0");
    const unitPrice = parseFloat(item.unitPrice || "0");
    const discount = parseFloat(item.discount || "0");
    const gstRate = parseFloat(item.gstRate || "0") / 100;

    const subtotal = quantity * unitPrice;
    const taxableValue = subtotal - discount;
    const taxAmount = taxableValue * gstRate;

    const cgst = 0;
    const sgst = 0;
    const igst = taxAmount;

    const lineTotal = taxableValue + taxAmount;

    return {
      description: item.name,
      hsnCode: item.hsnCode,
      quantity: String(quantity),
      unit: "UNT",
      rate: String(unitPrice),
      priceIncludesTax: false,
      discountPercent: "0",
      taxableValue: String(taxableValue.toFixed(2)),
      gstRate: String(parseFloat(item.gstRate || "0")),
      cgstAmount: String(cgst.toFixed(2)),
      sgstAmount: String(sgst.toFixed(2)),
      igstAmount: String(igst.toFixed(2)),
      cessAmount: "0",
      lineTotal: String(lineTotal.toFixed(2)),
      productId: item.productId,
    };
  });

  const totals = calculatedItems.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + parseFloat(item.taxableValue),
      totalCgst: acc.totalCgst + parseFloat(item.cgstAmount),
      totalSgst: acc.totalSgst + parseFloat(item.sgstAmount),
      totalIgst: acc.totalIgst + parseFloat(item.igstAmount),
      totalCess: acc.totalCess + parseFloat(item.cessAmount),
      grandTotal: acc.grandTotal + parseFloat(item.lineTotal),
      totalQty: acc.totalQty + parseFloat(item.quantity),
    }),
    {
      subtotal: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalCess: 0,
      grandTotal: 0,
      totalQty: 0,
    }
  );

  const defaultBank = await db.query.banks.findFirst({
    where: eq(schema.banks.entityId, entityId),
  });

  const defaultSignature = await db.query.signatures.findFirst({
    where: eq(schema.signatures.entityId, entityId),
  });

  return {
    invoice: {
      accountId,
      entityId,
      orderId,
      invoiceDate: new Date(),
      buyerName: order.customerName,
      buyerEmail: order.customerEmail || null,
      buyerPhone: order.customerPhone || null,
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      placeOfSupply: order.shippingState
        ? `${order.shippingStateCode || ""}-${order.shippingState}`
        : null,
      subtotal: String(totals.subtotal.toFixed(2)),
      totalCgst: String(totals.totalCgst.toFixed(2)),
      totalSgst: String(totals.totalSgst.toFixed(2)),
      totalIgst: String(totals.totalIgst.toFixed(2)),
      totalCess: String(totals.totalCess.toFixed(2)),
      grandTotal: String(totals.grandTotal.toFixed(2)),
      totalItems: calculatedItems.length,
      totalQty: String(totals.totalQty),
      bankId: defaultBank?.id || null,
      signatureId: defaultSignature?.id || null,
      isDraft: true,
    },
    items: calculatedItems,
  };
}

export function calculateInvoiceItemTotals(
  items: any[],
  entityStateCode: string,
  placeOfSupply: string
): {
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  grandTotal: number;
  totalQty: number;
} {
  const supplyState = placeOfSupply
    ? placeOfSupply.split("-")[1]?.toUpperCase().trim() || ""
    : "";
  const isSameState = supplyState === entityStateCode.toUpperCase().trim();

  return items.reduce(
    (acc, item) => {
      const quantity = parseFloat(item.quantity || "0");
      const rate = parseFloat(item.rate || "0");
      const discountPercent = parseFloat(item.discountPercent || "0");
      const gstRate = parseFloat(item.gstRate || "0") / 100;

      const subtotal = quantity * rate;
      const discountAmount = (subtotal * discountPercent) / 100;
      const taxableValue = subtotal - discountAmount;
      const taxAmount = taxableValue * gstRate;

      const cgst = 0;
      const sgst = 0;
      const igst = taxAmount;

      const lineTotal = taxableValue + taxAmount;

      return {
        subtotal: acc.subtotal + taxableValue,
        totalCgst: acc.totalCgst + cgst,
        totalSgst: acc.totalSgst + sgst,
        totalIgst: acc.totalIgst + igst,
        totalCess: acc.totalCess + parseFloat(item.cessAmount || "0"),
        grandTotal: acc.grandTotal + lineTotal,
        totalQty: acc.totalQty + quantity,
      };
    },
    {
      subtotal: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalCess: 0,
      grandTotal: 0,
      totalQty: 0,
    }
  );
}

export function numberToWords(num: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  if (num === 0) return "Zero";

  const convert = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    if (n < 1000)
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + convert(n % 100) : "")
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + convert(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + convert(n % 100000) : "")
      );
    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "")
    );
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = "Rupees " + convert(rupees);
  if (paise > 0) {
    result += " and " + convert(paise) + " Paise";
  }
  return result + " Only";
}
