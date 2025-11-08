# GST Invoicing SaaS Platform

## Overview

This is a production-ready invoicing application built for Indian businesses selling through Shopify. The platform enables multi-tenant GST-compliant invoice generation with full support for tax calculations, order imports, and document management. It serves businesses ranging from small operations (1-2k orders/month) to larger enterprises (100k+ orders), with configurable workflows that can be adapted to specific accounting requirements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Multi-Tenant Data Model

The application implements strict account-level isolation using a multi-tenant PostgreSQL schema. Every data entity (users, orders, invoices, products) is scoped to an `account_id`, ensuring complete data separation between businesses. The database schema supports:

- **Account Management**: Root-level tenant isolation with cascading relationships
- **Role-Based Access Control**: Four-tier permission system (admin, staff, viewer, read-only) with granular operation controls
- **Business Entities**: Support for multiple legal entities per account, each with independent GSTIN, PAN, and invoice numbering sequences
- **Order Processing**: Direct Shopify order imports with line-item tracking and automatic HSN/GST rate mapping
- **Invoice Generation**: GST-compliant documents with support for tax invoices, bills of supply, export invoices, and credit notes
- **Audit Trail**: Complete change tracking for compliance and troubleshooting

### Authentication & Authorization

JWT-based stateless authentication with bcrypt password hashing (10 salt rounds). Tokens expire after 7 days and include embedded role information for efficient permission checks. All protected endpoints verify token validity and enforce account-level data isolation at the query level.

Role capabilities:
- **Admin**: Full CRUD on entities, banks, signatures, user management, system settings
- **Staff**: Create/edit orders, products, and invoices; cannot modify business configuration
- **Viewer**: Read-only access to all data; cannot perform modifications
- **Read-only**: Limited visibility (specific implementation varies by endpoint)

### Frontend Architecture

React SPA with TypeScript, built using Vite for fast development and optimized production builds. Design system based on shadcn/ui components with Tailwind CSS for styling. Key architectural decisions:

- **Component Library**: Radix UI primitives for accessibility and flexibility
- **State Management**: TanStack Query for server state with optimistic updates
- **Form Handling**: React Hook Form with Zod schema validation
- **Routing**: Wouter for lightweight client-side navigation
- **Design Tokens**: HSL-based color system with dark mode support via CSS variables

The UI follows a design-system approach inspired by Linear and Stripe, prioritizing data density, scannable layouts, and professional aesthetics suitable for enterprise productivity tools.

### Data Import Pipeline

Bulk CSV import system supporting both products and orders from Shopify exports. The import service uses streaming parsers to handle large files efficiently:

- **Product Import**: Upserts by SKU, extracts HSN codes and GST rates from tax codes, handles HTML descriptions
- **Order Import**: Smart grouping by Shopify order name, automatic line-item aggregation, province-to-state mapping, customer detail extraction
- **Error Handling**: Detailed import statistics with per-row error reporting for data quality issues

### Invoice Generation Engine

Server-side invoice calculation service that handles complex GST scenarios:

- **Tax Logic**: Automatic CGST/SGST split for intra-state transactions, IGST for inter-state, zero-tax for exports
- **Price Calculations**: Support for both tax-inclusive and tax-exclusive pricing with discount application
- **Document Templates**: HTML-to-PDF conversion using Puppeteer with custom templates matching Indian GST invoice formats
- **Numbering System**: Entity-specific invoice prefixes with auto-incrementing counters

### Backend Services

Node.js + Express REST API with TypeScript. Key service layers:

- **Database Layer**: Drizzle ORM with Neon serverless PostgreSQL connection pooling
- **CSV Processing**: Stream-based parsing with `csv-parser` for memory-efficient imports
- **PDF Generation**: Headless Chrome via Puppeteer for high-fidelity document rendering
- **File Storage**: Local filesystem for invoice PDFs (stored in `attached_assets/invoices/`)

The backend follows a conventional route-handler pattern with middleware for authentication, logging, and error handling. All database queries enforce multi-tenant isolation via WHERE clause filtering on `account_id`.

## External Dependencies

### Database
- **PostgreSQL** (via Neon serverless): Primary data store with connection pooling for serverless environments
- **Drizzle ORM**: Type-safe query builder with schema migrations

### Authentication
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Password hashing with configurable salt rounds

### File Processing
- **csv-parser**: Streaming CSV parsing for bulk imports
- **multer**: Multipart form-data handling for file uploads
- **Puppeteer**: Headless browser for PDF generation from HTML templates

### Frontend Libraries
- **React 18**: UI framework with TypeScript
- **TanStack Query**: Server state management with caching
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, accordions, etc.)
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **React Hook Form + Zod**: Form validation and data sanitization
- **Wouter**: Lightweight client-side routing

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Production bundling for server code

### Future Integration Points
The architecture supports planned integrations for:
- Shopify API for real-time order syncing
- E-way bill generation services
- E-invoice (IRN) generation via government portals
- Payment gateway reconciliation
- Email delivery services for invoice distribution

## Recent Changes

### November 8, 2025

**PDF Download and Automatic Generation**

Fixed PDF download functionality and implemented automatic PDF generation:

1. **GET Endpoint for PDF Downloads**
   - Added GET `/api/invoices/:id/pdf` endpoint to serve actual PDF files
   - Frontend can now download PDFs as blob files
   - Automatically generates PDF on first download if not already created

2. **Automatic PDF Generation**
   - PDFs are now automatically generated when creating invoices from orders
   - No manual step required to generate PDFs
   - PDF files are stored in `attached_assets/invoices/` directory

3. **File Serving**
   - Proper Content-Type and Content-Disposition headers for downloads
   - Stream-based file serving for efficient memory usage
   - Filename includes invoice number for easy identification

**CSV Import Compatibility Fix**

Fixed CSV import to handle standard Shopify order exports:

1. **Column Name Compatibility**
   - Updated parser to accept both "Shipping Province" and "Shipping Province Code"
   - Updated parser to accept both "Billing Province" and "Billing Province Code"
   - Made all address and shipping fields optional to handle multi-line item orders
   - Prioritizes Shipping Province over Billing Province when both are available

2. **Flexible Field Handling**
   - All fields except core order identifiers (Name, Email, Created at, Lineitem name/quantity/price) are now optional
   - Falls back gracefully when shipping information is missing
   - Properly handles Shopify exports with both condensed and full column sets

**Invoice Generation Workflow - Complete Implementation**

Completed the core invoicing workflow with CSV import, invoice generation, and PDF downloads:

1. **Orders CSV Import**
   - Added CSV upload dialog on Orders page
   - Connected to `/api/orders/import-csv` endpoint
   - Displays import statistics (imported, skipped, duplicates, errors)
   - Auto-refreshes orders table after import

2. **Invoice Generation from Orders**
   - Fixed endpoint: Now correctly calls `/api/orders/:id/create-invoice`
   - Added automatic entity selection (uses first entity from account)
   - Implemented race condition prevention for entity loading
   - Shows helpful error if no business entity configured
   - Updates order status after invoice creation

3. **Real Data Integration**
   - Connected Orders page to `/api/orders` endpoint
   - Connected Invoices page to `/api/invoices` endpoint
   - Fixed status mapping to show real backend values (unpaid, paid, partial, overdue, etc.)
   - Removed status collapsing that was hiding true invoice/order states

4. **PDF Download**
   - Added conditional PDF download based on `pdfUrl` field
   - Download button only appears when PDF is available
   - Connects to `/api/invoices/:id/pdf` endpoint

**Technical Improvements**

- **Status Fidelity**: Frontend now displays exact status values from backend without transformation, improving data accuracy
- **Type Safety**: Updated TypeScript interfaces to accept any string status values, preventing future type errors
- **Error Handling**: Added comprehensive validation with helpful error messages
- **Loading States**: Proper handling of async entity loading to prevent race conditions

**Business Profile Settings**

Fixed critical bug where business profile form was non-functional:

1. **Form Implementation**
   - Implemented react-hook-form with Zod validation for business profile
   - Added proper form state management and error handling
   - Required fields: Legal Name and Display Name
   - Optional fields: GSTIN, PAN, Address details, phone, email

2. **Backend Integration**
   - Connected to POST /api/entities for creating new business entities
   - Connected to PUT /api/entities/:id for updating existing entities
   - Automatic form population when existing entity data loads
   - Cache invalidation to keep UI in sync with backend

3. **User Experience**
   - Success/error toast notifications
   - Loading state during save operation
   - Validation messages for required fields
   - Form automatically resets with loaded entity data

**PDF Template and Settings Enhancement**

Enhanced invoice PDF template and settings page for complete GST compliance:

1. **PDF Template Improvements**
   - Updated bank details section to display branch field
   - Place of supply already formatted as "StateCode-StateName" (e.g., "29-Karnataka")
   - Invoice header includes all business entity details (name, GSTIN, address, phone, email, website)
   - Signature display integrated when signature is configured

2. **Business Profile Form Enhancement**
   - Added State Code field for GST state code (e.g., "20" for Jharkhand)
   - Added Website field for company website URL
   - Added Invoice Prefix field (defaults to "INV")
   - All fields properly validated and saved to database

3. **Bank Details Form Implementation**
   - Fully functional react-hook-form with Zod validation
   - Fields: Label, Bank Name*, Account Number*, IFSC Code*, Branch, UPI ID
   - Connected to GET /api/banks and POST/PUT /api/banks/:id endpoints
   - Automatic form population with existing bank data
   - Success/error toast notifications

4. **Signature Management**
   - Display existing signature if configured
   - Shows signature preview in settings
   - Signature automatically included in PDF invoice template
   - Instructions for adding signature image URL

5. **PDF Generation Resilience**
   - Made PDF generation non-blocking with try-catch
   - Invoice creation succeeds even if PDF generation fails
   - Error logged to console without blocking invoice creation
   - Puppeteer system dependencies installed (glib, nss, Chrome libs)

**Editable Invoice Creation Dialog**

Implemented editable invoice creation workflow for review before generation:

1. **Invoice Creation Dialog**
   - Clicking "Generate Invoice" on Orders page now opens an editable form dialog
   - Form pre-populated with all customer and order data
   - All fields editable: customer name, company, email, phone, GSTIN, addresses, place of supply, notes, terms
   - Order summary displayed showing subtotal, tax, and total
   - Form validation with Zod schema

2. **Smart Data Population**
   - Customer details automatically filled from order
   - Place of supply formatted as "StateCode-StateName" from shipping state
   - Entity ID automatically selected from first configured business entity
   - Form resets properly when dialog is closed

3. **Invoice Submission**
   - Form submits to create invoice with edited data
   - Shows loading state during creation
   - Success/error toast notifications
   - Automatically refreshes orders and invoices lists
   - Dialog closes after successful creation

**Company Logo Upload**

Added company logo support for invoice branding:

1. **Logo Field in Business Profile**
   - New "Company Logo URL" field in Settings > Business Profile
   - Logo preview shown when URL is provided
   - Logo URL saved to entity record

2. **Logo in PDF Template**
   - Logo displayed at top of invoice header (if configured)
   - Centered above company name with max 120px width, 80px height
   - Gracefully omitted if no logo URL provided
   - Proper styling to maintain professional invoice appearance

**Known Limitations**

- Fulfillment status is currently a placeholder (backend doesn't track this field yet)
- E2E testing with OIDC authentication requires HttpOnly cookie setup
- Signature and logo upload require manual file hosting and URL entry (direct file upload not yet implemented)