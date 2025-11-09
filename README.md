# TaxMeDaddy 💰

A production-ready **GST-compliant invoicing SaaS platform** for Indian businesses selling through Shopify. Built with React, Node.js, TypeScript, and Drizzle ORM.

## 🎯 Features

- **Multi-Tenant System** - Multiple accounts with role-based access control
- **Smart GST Calculations** - Automatic CGST/SGST vs IGST detection based on state
- **Shopify CSV Import** - Bulk import products and orders from Shopify exports
- **Professional Invoice PDFs** - Generated with Puppeteer, includes company logos and signatures
- **Complete Compliance** - Full audit logging for GST compliance requirements
- **Payment Tracking** - UPI, NEFT, Cash, Cheque with reconciliation

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (server state)
- shadcn/ui + Radix UI (components)
- Tailwind CSS (styling)
- Wouter (routing)

### Backend
- Node.js + Express + TypeScript
- Drizzle ORM
- Neon Postgres (serverless database)
- Puppeteer (PDF generation)
- JWT + Passport.js (authentication)
- Multer (file uploads)

## 📋 Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **PostgreSQL** database (Neon recommended)

## 🚀 Getting Started

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd taxmedaddy
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env and add your DATABASE_URL from Neon
nano .env  # or your preferred editor

# Push database schema to Neon
npm run db:push

# Start backend server (runs on port 3000)
npm run dev
```

The backend will be available at `http://localhost:3000`

**Health Check:** `curl http://localhost:3000/api/health`

### 3. Frontend Setup

Open a **new terminal** and run:

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (optional, proxy is configured in vite.config.ts)
cp .env.example .env

# Start frontend dev server (runs on port 5173)
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Verify Everything Works

1. **Backend health check:**
   ```bash
   curl http://localhost:3000/api/health
   # Should return: {"status":"ok"}
   ```

2. **Open frontend:**
   - Visit `http://localhost:5173`
   - You should see the TaxMeDaddy login page
   - API calls are automatically proxied to the backend

## 📁 Project Structure

```
taxmedaddy/
├── frontend/              # React frontend (port 5173)
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── lib/          # Utilities
│   │   └── hooks/        # React hooks
│   ├── package.json
│   └── vite.config.ts
│
├── backend/              # Express backend (port 3000)
│   ├── server/
│   │   ├── index.ts      # Server entry point
│   │   ├── routes.ts     # API endpoints
│   │   ├── auth.ts       # JWT authentication
│   │   ├── db.ts         # Database connection
│   │   ├── invoice-service.ts
│   │   ├── pdf-service.ts
│   │   └── csv-service.ts
│   ├── shared/
│   │   └── schema.ts     # Drizzle database schema
│   ├── attached_assets/  # PDFs, signatures
│   ├── migrations/       # Database migrations
│   ├── package.json
│   └── drizzle.config.ts
│
├── .env.example          # Environment variables template
└── README.md
```

## 🔧 Development Commands

### Backend (`backend/` directory)

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run start      # Start production server
npm run check      # TypeScript type checking
npm run db:push    # Push schema changes to database
npm run db:generate # Generate migration files
```

### Frontend (`frontend/` directory)

```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run check      # TypeScript type checking
```

## 🗄️ Database Setup

### Using Neon (Recommended)

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string (looks like: `postgresql://user:pass@ep-xxx.neon.tech/neondb`)
4. Add to `backend/.env`:
   ```
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   ```
5. Push schema:
   ```bash
   cd backend && npm run db:push
   ```

### Database Schema

The application uses 12 tables:
- `accounts` - Multi-tenant isolation
- `users` - Authentication with roles
- `entities` - Business entities with GSTIN
- `banks` - Bank account details
- `signatures` - Digital signatures
- `products` - Product catalog with HSN codes
- `orders` - Orders from Shopify
- `order_items` - Line items
- `invoices` - GST-compliant invoices
- `invoice_items` - Invoice line items
- `payments` - Payment tracking
- `audit_logs` - Complete audit trail

## 🔐 Environment Variables

### Backend (`backend/.env`)

```bash
DATABASE_URL=postgresql://...         # Neon Postgres connection string
PORT=3000                             # Backend server port
NODE_ENV=development                  # Environment (development/production)
JWT_SECRET=your-secret-key           # JWT signing secret (min 32 chars)
FRONTEND_URL=http://localhost:5173   # Frontend URL for CORS
```

### Frontend (`frontend/.env`)

```bash
VITE_API_URL=http://localhost:3000   # Backend API URL
```

## 🚢 Production Deployment

### Backend

```bash
cd backend
npm run build
npm run start
```

Ensure environment variables are set:
- `DATABASE_URL` - Production database
- `JWT_SECRET` - Strong random secret
- `PORT` - Server port (default 3000)
- `NODE_ENV=production`

### Frontend

```bash
cd frontend
npm run build
# Deploy the 'dist' folder to your hosting provider
```

For Vite build, update `VITE_API_URL` to your production API endpoint.

## 📖 API Documentation

See `API_DOCUMENTATION.md` for complete API reference.

Key endpoints:
- `GET /api/health` - Health check
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/entities` - List business entities
- `GET /api/products` - List products
- `GET /api/orders` - List orders
- `GET /api/invoices` - List invoices
- `POST /api/invoices/:id/generate-pdf` - Generate invoice PDF

## 🐛 Troubleshooting

### Backend won't start
- Check `DATABASE_URL` is set correctly
- Ensure Postgres database is accessible
- Verify all dependencies installed: `npm install`

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check Vite proxy config in `vite.config.ts`
- Verify CORS settings in `backend/server/index.ts`

### Database errors
- Run `npm run db:push` to sync schema
- Check Neon dashboard for connection issues
- Verify DATABASE_URL format includes `?sslmode=require`

### PDF generation fails
- Puppeteer may need additional system dependencies
- Check logs for Chromium installation errors
- On Linux: `apt-get install chromium`

## 📝 License

MIT

## 🤝 Contributing

This is a Replit project restructured for local development. Contributions welcome!

---

**Built with ❤️ for Indian businesses** 🇮🇳
