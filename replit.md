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
A server-side service handling complex GST scenarios, including automatic CGST/SGST/IGST calculations and support for various pricing models. It uses Puppeteer for HTML-to-PDF conversion with custom GST-compliant templates and manages entity-specific invoice numbering. Signature images are embedded in PDFs as base64-encoded data URLs for reliable rendering. PDF output features modern system fonts, professional spacing, and a polished color palette matching the preview interface.

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