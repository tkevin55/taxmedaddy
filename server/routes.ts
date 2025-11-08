import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  requireAuth, 
  requireRole, 
  logAudit,
  type AuthRequest 
} from "./auth";
import { buildInvoiceFromOrder } from "./invoice-service";
import { generateInvoicePDF } from "./pdf-service";
import { 
  importProductsFromCSV, 
  importOrdersFromCSV,
  generateProductsSampleCSV,
  generateOrdersSampleCSV
} from "./csv-service";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {
  
  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { accountName, name, email, password } = req.body;
      
      if (!accountName || !name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const passwordHash = await hashPassword(password);

      const [account] = await db.insert(schema.accounts).values({
        name: accountName,
      }).returning();

      const [user] = await db.insert(schema.users).values({
        accountId: account.id,
        name,
        email,
        passwordHash,
        role: "admin",
        isActive: true,
      }).returning();

      const token = generateToken({
        userId: user.id,
        accountId: user.accountId,
        role: user.role,
        email: user.email,
      });

      await logAudit(account.id, user.id, "signup", "user", user.id, null, { userId: user.id });

      res.json({
        token,
        user: {
          id: user.id,
          accountId: user.accountId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await db.query.users.findFirst({
        where: and(
          eq(schema.users.email, email),
          eq(schema.users.isActive, true)
        ),
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken({
        userId: user.id,
        accountId: user.accountId,
        role: user.role,
        email: user.email,
      });

      await logAudit(user.accountId, user.id, "login", "user", user.id);

      res.json({
        token,
        user: {
          id: user.id,
          accountId: user.accountId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/entities", requireAuth, async (req: AuthRequest, res) => {
    try {
      const entities = await db.query.entities.findMany({
        where: eq(schema.entities.accountId, req.user!.accountId),
        orderBy: [desc(schema.entities.createdAt)],
      });
      res.json(entities);
    } catch (error) {
      console.error("Error fetching entities:", error);
      res.status(500).json({ error: "Failed to fetch entities" });
    }
  });

  app.post("/api/entities", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const [entity] = await db.insert(schema.entities).values({
        ...req.body,
        accountId: req.user!.accountId,
      }).returning();

      await logAudit(req.user!.accountId, req.user!.userId, "create", "entity", entity.id, null, entity);

      res.json(entity);
    } catch (error) {
      console.error("Error creating entity:", error);
      res.status(500).json({ error: "Failed to create entity" });
    }
  });

  app.put("/api/entities/:id", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existing = await db.query.entities.findFirst({
        where: and(
          eq(schema.entities.id, id),
          eq(schema.entities.accountId, req.user!.accountId)
        ),
      });

      if (!existing) {
        return res.status(404).json({ error: "Entity not found" });
      }

      const [updated] = await db.update(schema.entities)
        .set(req.body)
        .where(eq(schema.entities.id, id))
        .returning();

      await logAudit(req.user!.accountId, req.user!.userId, "update", "entity", id, existing, updated);

      res.json(updated);
    } catch (error) {
      console.error("Error updating entity:", error);
      res.status(500).json({ error: "Failed to update entity" });
    }
  });

  app.get("/api/banks", requireAuth, async (req: AuthRequest, res) => {
    try {
      const banks = await db.query.banks.findMany({
        where: eq(schema.banks.accountId, req.user!.accountId),
        orderBy: [desc(schema.banks.isDefault), desc(schema.banks.createdAt)],
      });
      res.json(banks);
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({ error: "Failed to fetch banks" });
    }
  });

  app.post("/api/banks", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const [bank] = await db.insert(schema.banks).values({
        ...req.body,
        accountId: req.user!.accountId,
      }).returning();

      await logAudit(req.user!.accountId, req.user!.userId, "create", "bank", bank.id, null, bank);

      res.json(bank);
    } catch (error) {
      console.error("Error creating bank:", error);
      res.status(500).json({ error: "Failed to create bank" });
    }
  });

  app.put("/api/banks/:id", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existing = await db.query.banks.findFirst({
        where: and(
          eq(schema.banks.id, id),
          eq(schema.banks.accountId, req.user!.accountId)
        ),
      });

      if (!existing) {
        return res.status(404).json({ error: "Bank not found" });
      }

      const [updated] = await db.update(schema.banks)
        .set(req.body)
        .where(eq(schema.banks.id, id))
        .returning();

      await logAudit(req.user!.accountId, req.user!.userId, "update", "bank", id, existing, updated);

      res.json(updated);
    } catch (error) {
      console.error("Error updating bank:", error);
      res.status(500).json({ error: "Failed to update bank" });
    }
  });

  app.delete("/api/banks/:id", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existing = await db.query.banks.findFirst({
        where: and(
          eq(schema.banks.id, id),
          eq(schema.banks.accountId, req.user!.accountId)
        ),
      });

      if (!existing) {
        return res.status(404).json({ error: "Bank not found" });
      }

      await db.delete(schema.banks).where(eq(schema.banks.id, id));

      await logAudit(req.user!.accountId, req.user!.userId, "delete", "bank", id, existing, null);

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bank:", error);
      res.status(500).json({ error: "Failed to delete bank" });
    }
  });

  app.get("/api/signatures", requireAuth, async (req: AuthRequest, res) => {
    try {
      const signatures = await db.query.signatures.findMany({
        where: eq(schema.signatures.accountId, req.user!.accountId),
        orderBy: [desc(schema.signatures.createdAt)],
      });
      res.json(signatures);
    } catch (error) {
      console.error("Error fetching signatures:", error);
      res.status(500).json({ error: "Failed to fetch signatures" });
    }
  });

  app.post("/api/signatures", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const [signature] = await db.insert(schema.signatures).values({
        ...req.body,
        accountId: req.user!.accountId,
      }).returning();

      await logAudit(req.user!.accountId, req.user!.userId, "create", "signature", signature.id, null, signature);

      res.json(signature);
    } catch (error) {
      console.error("Error creating signature:", error);
      res.status(500).json({ error: "Failed to create signature" });
    }
  });

  app.put("/api/signatures/:id", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existing = await db.query.signatures.findFirst({
        where: and(
          eq(schema.signatures.id, id),
          eq(schema.signatures.accountId, req.user!.accountId)
        ),
      });

      if (!existing) {
        return res.status(404).json({ error: "Signature not found" });
      }

      const [updated] = await db.update(schema.signatures)
        .set(req.body)
        .where(eq(schema.signatures.id, id))
        .returning();

      await logAudit(req.user!.accountId, req.user!.userId, "update", "signature", id, existing, updated);

      res.json(updated);
    } catch (error) {
      console.error("Error updating signature:", error);
      res.status(500).json({ error: "Failed to update signature" });
    }
  });

  app.delete("/api/signatures/:id", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existing = await db.query.signatures.findFirst({
        where: and(
          eq(schema.signatures.id, id),
          eq(schema.signatures.accountId, req.user!.accountId)
        ),
      });

      if (!existing) {
        return res.status(404).json({ error: "Signature not found" });
      }

      await db.delete(schema.signatures).where(eq(schema.signatures.id, id));

      await logAudit(req.user!.accountId, req.user!.userId, "delete", "signature", id, existing, null);

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting signature:", error);
      res.status(500).json({ error: "Failed to delete signature" });
    }
  });

  app.get("/api/products", requireAuth, async (req: AuthRequest, res) => {
    try {
      const products = await db.query.products.findMany({
        where: eq(schema.products.accountId, req.user!.accountId),
        orderBy: [desc(schema.products.createdAt)],
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const [product] = await db.insert(schema.products).values({
        ...req.body,
        accountId: req.user!.accountId,
      }).returning();

      await logAudit(req.user!.accountId, req.user!.userId, "create", "product", product.id, null, product);

      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existing = await db.query.products.findFirst({
        where: and(
          eq(schema.products.id, id),
          eq(schema.products.accountId, req.user!.accountId)
        ),
      });

      if (!existing) {
        return res.status(404).json({ error: "Product not found" });
      }

      const [updated] = await db.update(schema.products)
        .set(req.body)
        .where(eq(schema.products.id, id))
        .returning();

      await logAudit(req.user!.accountId, req.user!.userId, "update", "product", id, existing, updated);

      res.json(updated);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existing = await db.query.products.findFirst({
        where: and(
          eq(schema.products.id, id),
          eq(schema.products.accountId, req.user!.accountId)
        ),
      });

      if (!existing) {
        return res.status(404).json({ error: "Product not found" });
      }

      await db.delete(schema.products).where(eq(schema.products.id, id));

      await logAudit(req.user!.accountId, req.user!.userId, "delete", "product", id, existing, null);

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  app.get("/api/orders", requireAuth, async (req: AuthRequest, res) => {
    try {
      const orders = await db.query.orders.findMany({
        where: eq(schema.orders.accountId, req.user!.accountId),
        orderBy: [desc(schema.orders.orderDate)],
        with: {
          items: true,
        },
      });
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders/import", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const { orders: ordersData } = req.body;

      if (!Array.isArray(ordersData)) {
        return res.status(400).json({ error: "Orders data must be an array" });
      }

      const imported = [];

      for (const orderData of ordersData) {
        const [order] = await db.insert(schema.orders).values({
          ...orderData,
          accountId: req.user!.accountId,
          rawJson: orderData,
        }).returning();

        if (orderData.items && Array.isArray(orderData.items)) {
          for (const item of orderData.items) {
            await db.insert(schema.orderItems).values({
              orderId: order.id,
              ...item,
            });
          }
        }

        imported.push(order);
      }

      await logAudit(req.user!.accountId, req.user!.userId, "import", "orders", null, null, { count: imported.length });

      res.json({ imported: imported.length, orders: imported });
    } catch (error) {
      console.error("Error importing orders:", error);
      res.status(500).json({ error: "Failed to import orders" });
    }
  });

  app.get("/api/invoices", requireAuth, async (req: AuthRequest, res) => {
    try {
      const invoices = await db.query.invoices.findMany({
        where: eq(schema.invoices.accountId, req.user!.accountId),
        orderBy: [desc(schema.invoices.createdAt)],
        with: {
          entity: true,
          items: true,
          bank: true,
          signature: true,
        },
      });
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const invoice = await db.query.invoices.findFirst({
        where: and(
          eq(schema.invoices.id, id),
          eq(schema.invoices.accountId, req.user!.accountId)
        ),
        with: {
          entity: true,
          items: true,
          bank: true,
          signature: true,
          payments: true,
        },
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const { invoice: invoiceData, items: itemsData } = req.body;

      if (!invoiceData || !itemsData) {
        return res.status(400).json({ error: "Invoice and items data are required" });
      }

      const [invoice] = await db.insert(schema.invoices).values({
        ...invoiceData,
        accountId: req.user!.accountId,
        createdBy: req.user!.userId,
      }).returning();

      if (Array.isArray(itemsData)) {
        for (const item of itemsData) {
          await db.insert(schema.invoiceItems).values({
            invoiceId: invoice.id,
            ...item,
          });
        }
      }

      await logAudit(req.user!.accountId, req.user!.userId, "create", "invoice", invoice.id, null, invoice);

      const fullInvoice = await db.query.invoices.findFirst({
        where: eq(schema.invoices.id, invoice.id),
        with: {
          entity: true,
          items: true,
          bank: true,
          signature: true,
        },
      });

      res.json(fullInvoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { invoice: invoiceData, items: itemsData } = req.body;

      const existing = await db.query.invoices.findFirst({
        where: and(
          eq(schema.invoices.id, id),
          eq(schema.invoices.accountId, req.user!.accountId)
        ),
      });

      if (!existing) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const [updated] = await db.update(schema.invoices)
        .set(invoiceData)
        .where(eq(schema.invoices.id, id))
        .returning();

      if (itemsData && Array.isArray(itemsData)) {
        await db.delete(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, id));
        
        for (const item of itemsData) {
          await db.insert(schema.invoiceItems).values({
            invoiceId: id,
            ...item,
          });
        }
      }

      await logAudit(req.user!.accountId, req.user!.userId, "update", "invoice", id, existing, updated);

      const fullInvoice = await db.query.invoices.findFirst({
        where: eq(schema.invoices.id, id),
        with: {
          entity: true,
          items: true,
          bank: true,
          signature: true,
        },
      });

      res.json(fullInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  app.post("/api/orders/:id/create-invoice", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { entityId } = req.body;

      if (!entityId) {
        return res.status(400).json({ error: "Entity ID is required" });
      }

      const order = await db.query.orders.findFirst({
        where: and(
          eq(schema.orders.id, orderId),
          eq(schema.orders.accountId, req.user!.accountId)
        ),
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.hasInvoice) {
        return res.status(400).json({ error: "Invoice already exists for this order" });
      }

      const { invoice: invoiceData, items: itemsData } = await buildInvoiceFromOrder(
        orderId,
        entityId,
        req.user!.accountId
      );

      const [invoice] = await db.insert(schema.invoices).values({
        ...invoiceData,
        createdBy: req.user!.userId,
      }).returning();

      for (const item of itemsData) {
        await db.insert(schema.invoiceItems).values({
          invoiceId: invoice.id,
          ...item,
        });
      }

      await db.update(schema.orders)
        .set({ hasInvoice: true, invoiceId: invoice.id })
        .where(eq(schema.orders.id, orderId));

      await logAudit(req.user!.accountId, req.user!.userId, "create_from_order", "invoice", invoice.id, null, { orderId, invoiceId: invoice.id });

      const fullInvoice = await db.query.invoices.findFirst({
        where: eq(schema.invoices.id, invoice.id),
        with: {
          entity: true,
          items: true,
          bank: true,
          signature: true,
        },
      });

      res.json(fullInvoice);
    } catch (error) {
      console.error("Error creating invoice from order:", error);
      res.status(500).json({ error: "Failed to create invoice from order" });
    }
  });

  app.post("/api/invoices/:id/finalize", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);

      const invoice = await db.query.invoices.findFirst({
        where: and(
          eq(schema.invoices.id, id),
          eq(schema.invoices.accountId, req.user!.accountId)
        ),
        with: {
          entity: true,
        },
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      if (!invoice.isDraft) {
        return res.status(400).json({ error: "Invoice is already finalized" });
      }

      const entity = invoice.entity;
      const currentNumber = entity.currentInvoiceNumber || 0;
      const nextNumber = currentNumber + 1;
      const invoiceNumber = `${entity.invoicePrefix || "INV"}-${String(nextNumber).padStart(4, "0")}`;

      await db.update(schema.entities)
        .set({ currentInvoiceNumber: nextNumber })
        .where(eq(schema.entities.id, entity.id));

      const [finalized] = await db.update(schema.invoices)
        .set({
          invoiceNumber,
          isDraft: false,
        })
        .where(eq(schema.invoices.id, id))
        .returning();

      await logAudit(req.user!.accountId, req.user!.userId, "finalize", "invoice", id, invoice, finalized);

      const fullInvoice = await db.query.invoices.findFirst({
        where: eq(schema.invoices.id, id),
        with: {
          entity: true,
          items: true,
          bank: true,
          signature: true,
        },
      });

      res.json(fullInvoice);
    } catch (error) {
      console.error("Error finalizing invoice:", error);
      res.status(500).json({ error: "Failed to finalize invoice" });
    }
  });

  app.get("/api/invoices/:id/payments", requireAuth, async (req: AuthRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);

      const invoice = await db.query.invoices.findFirst({
        where: and(
          eq(schema.invoices.id, invoiceId),
          eq(schema.invoices.accountId, req.user!.accountId)
        ),
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const payments = await db.query.payments.findMany({
        where: eq(schema.payments.invoiceId, invoiceId),
        orderBy: [desc(schema.payments.createdAt)],
      });

      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/invoices/:id/payments", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);

      const invoice = await db.query.invoices.findFirst({
        where: and(
          eq(schema.invoices.id, invoiceId),
          eq(schema.invoices.accountId, req.user!.accountId)
        ),
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const [payment] = await db.insert(schema.payments).values({
        invoiceId,
        ...req.body,
      }).returning();

      const allPayments = await db.query.payments.findMany({
        where: eq(schema.payments.invoiceId, invoiceId),
      });

      const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
      const grandTotal = parseFloat(invoice.grandTotal || "0");

      let paymentStatus = "unpaid";
      if (totalPaid >= grandTotal) {
        paymentStatus = "paid";
      } else if (totalPaid > 0) {
        paymentStatus = "partial";
      }

      await db.update(schema.invoices)
        .set({ paymentStatus })
        .where(eq(schema.invoices.id, invoiceId));

      await logAudit(req.user!.accountId, req.user!.userId, "add_payment", "invoice", invoiceId, null, payment);

      res.json(payment);
    } catch (error) {
      console.error("Error adding payment:", error);
      res.status(500).json({ error: "Failed to add payment" });
    }
  });

  app.post("/api/shopify/products/import", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const { products: productsData } = req.body;

      if (!Array.isArray(productsData)) {
        return res.status(400).json({ error: "Products data must be an array" });
      }

      const imported = [];

      for (const productData of productsData) {
        const existing = await db.query.products.findFirst({
          where: and(
            eq(schema.products.shopifyProductId, productData.shopifyProductId),
            eq(schema.products.accountId, req.user!.accountId)
          ),
        });

        if (existing) {
          const [updated] = await db.update(schema.products)
            .set(productData)
            .where(eq(schema.products.id, existing.id))
            .returning();
          imported.push(updated);
        } else {
          const [product] = await db.insert(schema.products).values({
            ...productData,
            accountId: req.user!.accountId,
          }).returning();
          imported.push(product);
        }
      }

      await logAudit(req.user!.accountId, req.user!.userId, "import", "products", null, null, { count: imported.length });

      res.json({ imported: imported.length, products: imported });
    } catch (error) {
      console.error("Error importing products:", error);
      res.status(500).json({ error: "Failed to import products" });
    }
  });

  app.post("/api/shopify/orders/import", requireAuth, requireRole("admin", "staff"), async (req: AuthRequest, res) => {
    try {
      const { orders: ordersData } = req.body;

      if (!Array.isArray(ordersData)) {
        return res.status(400).json({ error: "Orders data must be an array" });
      }

      const imported = [];

      for (const orderData of ordersData) {
        const existing = await db.query.orders.findFirst({
          where: and(
            eq(schema.orders.shopifyOrderId, orderData.shopifyOrderId),
            eq(schema.orders.accountId, req.user!.accountId)
          ),
        });

        if (!existing) {
          const [order] = await db.insert(schema.orders).values({
            ...orderData,
            accountId: req.user!.accountId,
            rawJson: orderData,
          }).returning();

          if (orderData.items && Array.isArray(orderData.items)) {
            for (const item of orderData.items) {
              await db.insert(schema.orderItems).values({
                orderId: order.id,
                ...item,
              });
            }
          }

          imported.push(order);
        }
      }

      await logAudit(req.user!.accountId, req.user!.userId, "import", "shopify_orders", null, null, { count: imported.length });

      res.json({ imported: imported.length, orders: imported });
    } catch (error) {
      console.error("Error importing Shopify orders:", error);
      res.status(500).json({ error: "Failed to import Shopify orders" });
    }
  });

  app.post("/api/invoices/:id/pdf", requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);

      const invoice = await db.query.invoices.findFirst({
        where: and(
          eq(schema.invoices.id, id),
          eq(schema.invoices.accountId, req.user!.accountId)
        ),
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const pdfUrl = await generateInvoicePDF(id);

      await logAudit(req.user!.accountId, req.user!.userId, "generate_pdf", "invoice", id, null, { pdfUrl });

      res.json({ pdfUrl });
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  app.post("/api/products/import-csv", requireAuth, requireRole("admin", "staff"), upload.single("file"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = await importProductsFromCSV(req.file.buffer, req.user!.accountId);

      await logAudit(req.user!.accountId, req.user!.userId, "import_csv", "products", null, null, result);

      res.json({
        message: "Products import completed",
        importedCount: result.imported,
        updatedCount: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      });
    } catch (error) {
      console.error("Error importing products CSV:", error);
      res.status(500).json({ error: "Failed to import products CSV" });
    }
  });

  app.post("/api/orders/import-csv", requireAuth, requireRole("admin", "staff"), upload.single("file"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = await importOrdersFromCSV(req.file.buffer, req.user!.accountId);

      await logAudit(req.user!.accountId, req.user!.userId, "import_csv", "orders", null, null, result);

      res.json({
        message: "Orders import completed",
        importedCount: result.imported,
        skipped: result.skipped,
        duplicates: result.duplicates,
        errors: result.errors,
      });
    } catch (error) {
      console.error("Error importing orders CSV:", error);
      res.status(500).json({ error: "Failed to import orders CSV" });
    }
  });

  app.get("/api/products/sample-csv", (req, res) => {
    const csv = generateProductsSampleCSV();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=products_template.csv");
    res.send(csv);
  });

  app.get("/api/orders/sample-csv", (req, res) => {
    const csv = generateOrdersSampleCSV();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=orders_template.csv");
    res.send(csv);
  });

  const httpServer = createServer(app);
  return httpServer;
}
