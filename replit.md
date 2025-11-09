# GST Invoicing SaaS Platform

## Overview

This project is a production-ready, multi-tenant SaaS platform designed for Indian businesses selling through Shopify. Its primary purpose is to generate GST-compliant invoices, supporting tax calculations, order imports, and document management. The platform is scalable for businesses of all sizes, offering configurable workflows to meet diverse accounting needs and aiming to be a comprehensive solution for invoice automation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Multi-Tenant Data Model
The application uses a multi-tenant PostgreSQL schema with strict account-level isolation. Key features include account management, role-based access control (Admin, Staff, Viewer, Read-only), support for multiple legal entities per account, Shopify order processing, GST-compliant invoice generation, and a comprehensive audit trail.

### Authentication & Authorization
Authentication is JWT-based and stateless, utilizing bcrypt for password hashing. Tokens include role information for efficient permission checks, and all protected endpoints enforce account-level data isolation.

### Frontend Architecture
A React SPA built with TypeScript and Vite. It uses `shadcn/ui` components with Tailwind CSS, `Radix UI` for primitives, `TanStack Query` for server state, `React Hook Form` with Zod for validation, and Wouter for routing. The design prioritizes data density and professional aesthetics. Invoice creation uses a dedicated full-page experience at `/invoices/create/:orderId` with pre-populated order data for better UX.

### Data Import Pipeline
Supports bulk CSV imports for products and orders from Shopify exports. The service uses streaming parsers for efficiency, offering detailed error reporting and smart grouping for order data.

### Invoice Generation Engine
A server-side service handling complex GST scenarios, including automatic CGST/SGST/IGST calculations and support for various pricing models. It uses Puppeteer for HTML-to-PDF conversion with custom GST-compliant templates and manages entity-specific invoice numbering. Signature images are embedded in PDFs as base64-encoded data URLs for reliable rendering. PDF output features modern system fonts, professional spacing, and a polished color palette matching the preview interface. Puppeteer is configured to use system-installed Chromium with container-optimized launch arguments.

### Backend Services
Built with Node.js and Express in TypeScript. It utilizes Drizzle ORM with Neon for PostgreSQL, `csv-parser` for stream-based processing, Puppeteer for PDF generation, and local filesystem storage for invoices. The architecture follows a conventional route-handler pattern with middleware for security and error handling, ensuring multi-tenant isolation in all database queries.

## External Dependencies

### Database
- **PostgreSQL** (via Neon serverless)
- **Drizzle ORM**

### Authentication
- **jsonwebtoken**
- **bcrypt**

### File Processing
- **csv-parser**
- **multer**
- **Puppeteer**

### Frontend Libraries
- **React 18**
- **TanStack Query**
- **Radix UI**
- **Tailwind CSS**
- **React Hook Form**
- **Zod**
- **Wouter**

### Development Tools
- **Vite**
- **TypeScript**
- **ESBuild**

## Recent Changes

**November 9, 2025**
- **Invoice Editing**: Implemented full invoice editing capability. Users can now edit existing invoices via the Edit action in the invoices table. The edit page pre-populates all invoice data (items, customer details, amounts, etc.) and allows modifications to be saved via PUT request to `/api/invoices/:id`.
- **CSV Discount Import**: Fixed bug where the "Discount Amount" field from Shopify CSV exports was not being saved to orders. The CSV import now properly reads the "Discount Amount" column and saves it to `orders.discountTotal`. This ensures that when invoices are created from orders, the discount is correctly applied and reflected in the invoice totals.
- **Default GST Rate**: Changed the default GST rate from 18% to 5% across all CSV imports and invoice line items. When products or orders are imported without a specified GST rate, the system now defaults to 5% instead of 18%.

**November 8, 2025**
- **Tax-Inclusive Pricing**: Changed invoice calculations from tax-exclusive to tax-inclusive. GST is now included in the unit price rather than added on top. For example, a unit price of ₹999 with 18% GST now calculates as: Taxable Value = ₹846.61, IGST = ₹152.39, Total = ₹999 (instead of adding GST on top to get ₹1178.82).
- **Auto-Invoice Numbering**: Invoices created from orders are now automatically finalized with invoice numbers (e.g., INV-0001) instead of being saved as drafts. This ensures PDFs display proper invoice numbers instead of "DRAFT".
- **Order-Level Discounts**: Fully implemented order-level discount support with tax-inclusive pricing. Discounts are stored in `orders.discountTotal` (not per line item) matching Shopify's CSV format. The system applies discounts proportionally across taxable value and GST amounts. Handles edge cases including 100% and >100% discounts correctly. Invoice display flow: Subtotal → Discount → Taxable Amount → IGST → Grand Total. Both preview and PDF show identical totals.
- Implemented signature rendering in invoice preview and PDFs using base64 encoding with proper path resolution.
- Enhanced PDF styling with modern system fonts, professional spacing, subtle color palette, and improved visual hierarchy.
- Fixed static file serving by adding express.static middleware for /attached_assets directory.
- Resolved Puppeteer PDF generation by installing Chromium and creating dynamic executable path resolver.
- PDF download endpoint functional at GET /api/invoices/:id/pdf with automatic generation if PDF doesn't exist.
- Provisioned PostgreSQL database for production deployment to resolve blank screen issue.