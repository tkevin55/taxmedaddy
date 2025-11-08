import csv from "csv-parser";
import { Readable } from "stream";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface ProductCSVRow {
  Handle: string;
  Title: string;
  "Body (HTML)": string;
  Vendor: string;
  "Product Category": string;
  Type: string;
  Tags: string;
  Published: string;
  "Option1 Name": string;
  "Option1 Value": string;
  "Variant SKU": string;
  "Variant Price": string;
  "Variant Tax Code": string;
  "Image Src": string;
}

interface OrderCSVRow {
  Name: string;
  Email: string;
  "Created at": string;
  "Lineitem name": string;
  "Lineitem quantity": string;
  "Lineitem price": string;
  "Shipping Province Code"?: string;
  "Billing Province Code"?: string;
  "Shipping Province"?: string;
  "Billing Province"?: string;
  "Shipping Name": string;
  "Shipping Address1": string;
  "Shipping City": string;
  "Shipping Zip": string;
  "Lineitem sku": string;
  "Lineitem tax": string;
  "Shipping Address2"?: string;
  "Billing Address1"?: string;
  "Billing City"?: string;
  "Billing Zip"?: string;
  "Billing Name"?: string;
  "Financial Status"?: string;
  "Paid at"?: string;
  "Fulfillment Status"?: string;
  Phone?: string;
}

function parseCSV<T>(buffer: Buffer): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

export async function importProductsFromCSV(
  buffer: Buffer,
  accountId: number
): Promise<{ imported: number; updated: number; skipped: number; errors: string[] }> {
  const rows = await parseCSV<ProductCSVRow>(buffer);
  
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      if (!row.Title || !row["Variant SKU"]) {
        skipped++;
        continue;
      }

      const hsnCode = row["Variant Tax Code"] || "";
      const gstRate = hsnCode ? deriveGSTRateFromTaxCode(hsnCode) : "18.00";

      const productData = {
        accountId,
        name: row.Title,
        sku: row["Variant SKU"],
        description: row["Body (HTML)"] || "",
        defaultPrice: row["Variant Price"] || "0.00",
        hsnCode: hsnCode,
        gstRate: gstRate,
        shopifyProductId: row.Handle || null,
      };

      const existing = await db.query.products.findFirst({
        where: and(
          eq(schema.products.sku, productData.sku),
          eq(schema.products.accountId, accountId)
        ),
      });

      if (existing) {
        await db.update(schema.products)
          .set(productData)
          .where(eq(schema.products.id, existing.id));
        updated++;
      } else {
        await db.insert(schema.products).values(productData);
        imported++;
      }
    } catch (error) {
      errors.push(`Error importing product ${row.Title}: ${error}`);
      skipped++;
    }
  }

  return { imported, updated, skipped, errors };
}

export async function importOrdersFromCSV(
  buffer: Buffer,
  accountId: number
): Promise<{ imported: number; skipped: number; duplicates: number; errors: string[] }> {
  const rows = await parseCSV<OrderCSVRow>(buffer);
  
  let imported = 0;
  let skipped = 0;
  let duplicates = 0;
  const errors: string[] = [];

  const orderGroups = new Map<string, OrderCSVRow[]>();
  
  for (const row of rows) {
    if (!row.Name) {
      skipped++;
      continue;
    }
    
    if (!orderGroups.has(row.Name)) {
      orderGroups.set(row.Name, []);
    }
    orderGroups.get(row.Name)!.push(row);
  }

  for (const [orderName, orderRows] of Array.from(orderGroups.entries())) {
    try {
      const firstRow = orderRows[0];
      
      const existing = await db.query.orders.findFirst({
        where: and(
          eq(schema.orders.shopifyOrderNumber, orderName),
          eq(schema.orders.accountId, accountId)
        ),
      });

      if (existing) {
        duplicates++;
        continue;
      }

      let orderTotal = 0;
      const items: Array<{
        name: string;
        sku: string;
        quantity: string;
        unitPrice: string;
        hsnCode?: string;
        gstRate?: string;
      }> = [];

      for (const row of orderRows) {
        if (!row["Lineitem name"]) continue;

        const quantity = parseFloat(row["Lineitem quantity"] || "1");
        const unitPrice = parseFloat(row["Lineitem price"] || "0");
        const itemTotal = quantity * unitPrice;
        orderTotal += itemTotal;

        let hsnCode = "";
        let gstRate = "18.00";
        
        if (row["Lineitem sku"]) {
          const product = await db.query.products.findFirst({
            where: and(
              eq(schema.products.sku, row["Lineitem sku"]),
              eq(schema.products.accountId, accountId)
            ),
          });
          
          if (product) {
            hsnCode = product.hsnCode || "";
            gstRate = product.gstRate || "18.00";
          }
        }

        items.push({
          name: row["Lineitem name"],
          sku: row["Lineitem sku"] || "",
          quantity: row["Lineitem quantity"] || "1",
          unitPrice: row["Lineitem price"] || "0.00",
          hsnCode,
          gstRate,
        });
      }

      const shippingAddress = [
        firstRow["Shipping Address1"] || "",
        firstRow["Shipping Address2"] || "",
        firstRow["Shipping City"] || "",
        firstRow["Shipping Zip"] || "",
      ].filter(Boolean).join(", ");

      const billingAddress = [
        firstRow["Billing Address1"] || firstRow["Shipping Address1"] || "",
        firstRow["Billing City"] || firstRow["Shipping City"] || "",
        firstRow["Billing Zip"] || firstRow["Shipping Zip"] || "",
      ].filter(Boolean).join(", ");

      const orderDate = firstRow["Created at"] ? new Date(firstRow["Created at"]) : new Date();
      
      const shippingProvinceCode = firstRow["Shipping Province Code"] || firstRow["Shipping Province"] || firstRow["Billing Province Code"] || firstRow["Billing Province"] || "";
      
      const [order] = await db.insert(schema.orders).values({
        accountId,
        shopifyOrderNumber: orderName,
        orderDate,
        customerName: firstRow["Shipping Name"] || firstRow["Billing Name"] || "Unknown",
        customerEmail: firstRow.Email || "",
        customerPhone: firstRow.Phone || "",
        billingAddress: billingAddress || shippingAddress,
        shippingAddress,
        shippingState: mapProvinceCodeToState(shippingProvinceCode),
        shippingStateCode: shippingProvinceCode,
        currency: "INR",
        subtotal: orderTotal.toFixed(2),
        total: orderTotal.toFixed(2),
        hasInvoice: false,
      }).returning();

      for (const item of items) {
        await db.insert(schema.orderItems).values({
          orderId: order.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          hsnCode: item.hsnCode || "",
          gstRate: item.gstRate || "18.00",
        });
      }

      imported++;
    } catch (error) {
      errors.push(`Error importing order ${orderName}: ${error}`);
      skipped++;
    }
  }

  return { imported, skipped, duplicates, errors };
}

function deriveGSTRateFromTaxCode(taxCode: string): string {
  const cleaned = taxCode.trim().toLowerCase();
  
  if (cleaned.includes("5") || cleaned.includes("five")) return "5.00";
  if (cleaned.includes("12") || cleaned.includes("twelve")) return "12.00";
  if (cleaned.includes("18") || cleaned.includes("eighteen")) return "18.00";
  if (cleaned.includes("28") || cleaned.includes("twenty")) return "28.00";
  
  return "18.00";
}

function mapProvinceCodeToState(code: string): string {
  const stateMap: Record<string, string> = {
    "AN": "Andaman and Nicobar Islands",
    "AP": "Andhra Pradesh",
    "AR": "Arunachal Pradesh",
    "AS": "Assam",
    "BR": "Bihar",
    "CH": "Chandigarh",
    "CG": "Chhattisgarh",
    "DN": "Dadra and Nagar Haveli",
    "DD": "Daman and Diu",
    "DL": "Delhi",
    "GA": "Goa",
    "GJ": "Gujarat",
    "HR": "Haryana",
    "HP": "Himachal Pradesh",
    "JK": "Jammu and Kashmir",
    "JH": "Jharkhand",
    "KA": "Karnataka",
    "KL": "Kerala",
    "LD": "Lakshadweep",
    "MP": "Madhya Pradesh",
    "MH": "Maharashtra",
    "MN": "Manipur",
    "ML": "Meghalaya",
    "MZ": "Mizoram",
    "NL": "Nagaland",
    "OR": "Odisha",
    "PY": "Puducherry",
    "PB": "Punjab",
    "RJ": "Rajasthan",
    "SK": "Sikkim",
    "TN": "Tamil Nadu",
    "TS": "Telangana",
    "TR": "Tripura",
    "UP": "Uttar Pradesh",
    "UK": "Uttarakhand",
    "WB": "West Bengal",
  };

  return stateMap[code.toUpperCase()] || code;
}

export function generateProductsSampleCSV(): string {
  const headers = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Product Category",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Variant SKU",
    "Variant Price",
    "Variant Tax Code",
    "Image Src",
  ];

  const sampleRows = [
    [
      "premium-tshirt",
      "Premium T-Shirt",
      "<p>High quality cotton t-shirt</p>",
      "Maachis",
      "Apparel",
      "Clothing",
      "fashion, casual",
      "TRUE",
      "Size",
      "M",
      "TS-001",
      "599.00",
      "6109-18%",
      "https://example.com/tshirt.jpg",
    ],
    [
      "casual-jeans",
      "Casual Jeans",
      "<p>Comfortable denim jeans</p>",
      "Maachis",
      "Apparel",
      "Clothing",
      "fashion, denim",
      "TRUE",
      "Size",
      "32",
      "JEANS-001",
      "1299.00",
      "6203-12%",
      "https://example.com/jeans.jpg",
    ],
  ];

  const csvLines = [headers.join(",")];
  sampleRows.forEach(row => {
    csvLines.push(row.map(cell => `"${cell}"`).join(","));
  });

  return csvLines.join("\n");
}

export function generateOrdersSampleCSV(): string {
  const headers = [
    "Name",
    "Email",
    "Created at",
    "Lineitem name",
    "Lineitem quantity",
    "Lineitem price",
    "Shipping Province Code",
    "Billing Province Code",
    "Shipping Name",
    "Shipping Address1",
    "Shipping City",
    "Shipping Zip",
    "Lineitem sku",
    "Lineitem tax",
  ];

  const sampleRows = [
    [
      "ORD-001",
      "customer@example.com",
      "2025-11-08 10:00:00",
      "Premium T-Shirt",
      "2",
      "599.00",
      "KA",
      "KA",
      "John Doe",
      "123 Main Street",
      "Bangalore",
      "560001",
      "TS-001",
      "107.82",
    ],
    [
      "ORD-001",
      "customer@example.com",
      "2025-11-08 10:00:00",
      "Casual Jeans",
      "1",
      "1299.00",
      "KA",
      "KA",
      "John Doe",
      "123 Main Street",
      "Bangalore",
      "560001",
      "JEANS-001",
      "155.88",
    ],
    [
      "ORD-002",
      "another@example.com",
      "2025-11-08 11:00:00",
      "Premium T-Shirt",
      "1",
      "599.00",
      "MH",
      "MH",
      "Jane Smith",
      "456 Park Avenue",
      "Mumbai",
      "400001",
      "TS-001",
      "53.91",
    ],
  ];

  const csvLines = [headers.join(",")];
  sampleRows.forEach(row => {
    csvLines.push(row.map(cell => `"${cell}"`).join(","));
  });

  return csvLines.join("\n");
}
