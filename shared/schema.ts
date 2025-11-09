import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("staff"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailAccountIdx: index("users_email_account_idx").on(table.email, table.accountId),
}));

export const entities = pgTable("entities", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  legalName: text("legal_name").notNull(),
  gstin: text("gstin"),
  pan: text("pan"),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  stateCode: text("state_code"),
  pincode: text("pincode"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  logoUrl: text("logo_url"),
  invoicePrefix: text("invoice_prefix").default("INV"),
  currentInvoiceNumber: integer("current_invoice_number").default(0),
  bankDefaultId: integer("bank_default_id"),
  signatureDefaultId: integer("signature_default_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  accountIdx: index("entities_account_idx").on(table.accountId),
}));

export const banks = pgTable("banks", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  entityId: integer("entity_id").references(() => entities.id, { onDelete: "set null" }),
  label: text("label").notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  ifsc: text("ifsc").notNull(),
  branch: text("branch"),
  upiId: text("upi_id"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  accountIdx: index("banks_account_idx").on(table.accountId),
}));

export const signatures = pgTable("signatures", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  entityId: integer("entity_id").references(() => entities.id, { onDelete: "set null" }),
  label: text("label").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  accountIdx: index("signatures_account_idx").on(table.accountId),
}));

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  shopifyProductId: text("shopify_product_id"),
  name: text("name").notNull(),
  sku: text("sku"),
  description: text("description"),
  defaultPrice: decimal("default_price", { precision: 12, scale: 2 }),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
  hsnCode: text("hsn_code"),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }),
  unit: text("unit"),
  barcode: text("barcode"),
  category: text("category"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  accountIdx: index("products_account_idx").on(table.accountId),
  skuIdx: index("products_sku_idx").on(table.sku),
}));

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  shopifyOrderId: text("shopify_order_id"),
  shopifyOrderNumber: text("shopify_order_number"),
  entityId: integer("entity_id").references(() => entities.id, { onDelete: "set null" }),
  orderDate: timestamp("order_date").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  shippingState: text("shipping_state"),
  shippingStateCode: text("shipping_state_code"),
  currency: text("currency").default("INR"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  discountTotal: decimal("discount_total", { precision: 12, scale: 2 }).default("0"),
  shippingTotal: decimal("shipping_total", { precision: 12, scale: 2 }).default("0"),
  taxTotal: decimal("tax_total", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0"),
  paymentStatus: text("payment_status").default("unpaid"),
  hasInvoice: boolean("has_invoice").default(false),
  invoiceId: integer("invoice_id"),
  rawJson: jsonb("raw_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  accountIdx: index("orders_account_idx").on(table.accountId),
  orderDateIdx: index("orders_date_idx").on(table.orderDate),
}));

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  sku: text("sku"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0"),
  hsnCode: text("hsn_code"),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("order_items_order_idx").on(table.orderId),
}));

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  entityId: integer("entity_id")
    .notNull()
    .references(() => entities.id, { onDelete: "restrict" }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  invoiceNumber: text("invoice_number"),
  invoiceDate: timestamp("invoice_date").notNull(),
  dueDate: timestamp("due_date"),
  reference: text("reference"),
  type: text("type").default("regular"),
  buyerName: text("buyer_name").notNull(),
  buyerCompany: text("buyer_company"),
  buyerEmail: text("buyer_email"),
  buyerPhone: text("buyer_phone"),
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  buyerGstin: text("buyer_gstin"),
  placeOfSupply: text("place_of_supply"),
  vehicleNo: text("vehicle_no"),
  poNumber: text("po_number"),
  challanNo: text("challan_no"),
  deliveryDate: timestamp("delivery_date"),
  salesPerson: text("sales_person"),
  dispatchNumber: text("dispatch_number"),
  isReverseCharge: boolean("is_reverse_charge").default(false),
  notes: text("notes"),
  terms: text("terms"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  discountTotal: decimal("discount_total", { precision: 12, scale: 2 }).default("0"),
  totalCgst: decimal("total_cgst", { precision: 12, scale: 2 }).default("0"),
  totalSgst: decimal("total_sgst", { precision: 12, scale: 2 }).default("0"),
  totalIgst: decimal("total_igst", { precision: 12, scale: 2 }).default("0"),
  totalCess: decimal("total_cess", { precision: 12, scale: 2 }).default("0"),
  roundOff: decimal("round_off", { precision: 12, scale: 2 }).default("0"),
  grandTotal: decimal("grand_total", { precision: 12, scale: 2 }).default("0"),
  totalItems: integer("total_items").default(0),
  totalQty: decimal("total_qty", { precision: 10, scale: 2 }).default("0"),
  bankId: integer("bank_id").references(() => banks.id, { onDelete: "set null" }),
  signatureId: integer("signature_id").references(() => signatures.id, { onDelete: "set null" }),
  paymentStatus: text("payment_status").default("unpaid"),
  paymentMethod: text("payment_method"),
  isDraft: boolean("is_draft").default(true),
  pdfUrl: text("pdf_url"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  accountIdx: index("invoices_account_idx").on(table.accountId),
  entityIdx: index("invoices_entity_idx").on(table.entityId),
  invoiceDateIdx: index("invoices_date_idx").on(table.invoiceDate),
  invoiceNumberIdx: index("invoices_number_idx").on(table.invoiceNumber),
}));

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  hsnCode: text("hsn_code"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").default("UNT"),
  rate: decimal("rate", { precision: 12, scale: 2 }).notNull(),
  priceIncludesTax: boolean("price_includes_tax").default(false),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  taxableValue: decimal("taxable_value", { precision: 12, scale: 2 }).default("0"),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).notNull(),
  cgstAmount: decimal("cgst_amount", { precision: 12, scale: 2 }).default("0"),
  sgstAmount: decimal("sgst_amount", { precision: 12, scale: 2 }).default("0"),
  igstAmount: decimal("igst_amount", { precision: 12, scale: 2 }).default("0"),
  cessAmount: decimal("cess_amount", { precision: 12, scale: 2 }).default("0"),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  invoiceIdx: index("invoice_items_invoice_idx").on(table.invoiceId),
}));

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  mode: text("mode"),
  notes: text("notes"),
  utrOrRef: text("utr_or_ref"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  invoiceIdx: index("payments_invoice_idx").on(table.invoiceId),
}));

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id"),
  beforeJson: jsonb("before_json"),
  afterJson: jsonb("after_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  accountIdx: index("audit_logs_account_idx").on(table.accountId),
  targetIdx: index("audit_logs_target_idx").on(table.targetType, table.targetId),
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
  users: many(users),
  entities: many(entities),
  banks: many(banks),
  signatures: many(signatures),
  products: many(products),
  orders: many(orders),
  invoices: many(invoices),
  auditLogs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one }) => ({
  account: one(accounts, {
    fields: [users.accountId],
    references: [accounts.id],
  }),
}));

export const entitiesRelations = relations(entities, ({ one, many }) => ({
  account: one(accounts, {
    fields: [entities.accountId],
    references: [accounts.id],
  }),
  banks: many(banks),
  signatures: many(signatures),
  invoices: many(invoices),
}));

export const banksRelations = relations(banks, ({ one }) => ({
  account: one(accounts, {
    fields: [banks.accountId],
    references: [accounts.id],
  }),
  entity: one(entities, {
    fields: [banks.entityId],
    references: [entities.id],
  }),
}));

export const signaturesRelations = relations(signatures, ({ one }) => ({
  account: one(accounts, {
    fields: [signatures.accountId],
    references: [accounts.id],
  }),
  entity: one(entities, {
    fields: [signatures.entityId],
    references: [entities.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  account: one(accounts, {
    fields: [products.accountId],
    references: [accounts.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  account: one(accounts, {
    fields: [orders.accountId],
    references: [accounts.id],
  }),
  entity: one(entities, {
    fields: [orders.entityId],
    references: [entities.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  account: one(accounts, {
    fields: [invoices.accountId],
    references: [accounts.id],
  }),
  entity: one(entities, {
    fields: [invoices.entityId],
    references: [entities.id],
  }),
  order: one(orders, {
    fields: [invoices.orderId],
    references: [orders.id],
  }),
  bank: one(banks, {
    fields: [invoices.bankId],
    references: [banks.id],
  }),
  signature: one(signatures, {
    fields: [invoices.signatureId],
    references: [signatures.id],
  }),
  creator: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertEntitySchema = createInsertSchema(entities).omit({ id: true, createdAt: true });
export const insertBankSchema = createInsertSchema(banks).omit({ id: true, createdAt: true });
export const insertSignatureSchema = createInsertSchema(signatures).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Entity = typeof entities.$inferSelect;
export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type Bank = typeof banks.$inferSelect;
export type InsertBank = z.infer<typeof insertBankSchema>;
export type Signature = typeof signatures.$inferSelect;
export type InsertSignature = z.infer<typeof insertSignatureSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
