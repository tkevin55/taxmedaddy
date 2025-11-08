# GST Invoicing API Documentation

## Base URL
All API endpoints are prefixed with `/api`

## Authentication

### Signup
```http
POST /api/auth/signup
Content-Type: application/json

{
  "accountName": "My Business",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "accountId": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:** Same as signup

### Authentication Header
All protected endpoints require:
```http
Authorization: Bearer <token>
```

## Role-Based Access

- **admin**: Full access to all operations
- **staff**: Can create/edit entities, banks, signatures, products, orders, invoices
- **viewer**: Read-only access

## Entities API

### List Entities
```http
GET /api/entities
Authorization: Bearer <token>
```

### Create Entity
```http
POST /api/entities
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "Maachis",
  "legalName": "Maachis Private Limited",
  "gstin": "29AABCT1332L1ZZ",
  "pan": "AABCT1332L",
  "addressLine1": "123 Business Street",
  "city": "Bangalore",
  "state": "Karnataka",
  "stateCode": "29",
  "pincode": "560001",
  "phone": "+91 9876543210",
  "email": "contact@maachis.com",
  "website": "https://maachis.com",
  "invoicePrefix": "MAAC"
}
```

### Update Entity
```http
PUT /api/entities/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "Updated Name",
  ...
}
```

## Banks API

### List Banks
```http
GET /api/banks
Authorization: Bearer <token>
```

### Create Bank
```http
POST /api/banks
Authorization: Bearer <token>
Content-Type: application/json

{
  "entityId": 1,
  "label": "Primary Bank",
  "bankName": "HDFC Bank",
  "accountNumber": "50200012345678",
  "ifsc": "HDFC0001234",
  "branch": "MG Road",
  "upiId": "maachis@hdfcbank",
  "isDefault": true
}
```

### Update Bank
```http
PUT /api/banks/:id
Authorization: Bearer <token>
```

### Delete Bank
```http
DELETE /api/banks/:id
Authorization: Bearer <token>
```

## Signatures API

### List Signatures
```http
GET /api/signatures
Authorization: Bearer <token>
```

### Create Signature
```http
POST /api/signatures
Authorization: Bearer <token>
Content-Type: application/json

{
  "entityId": 1,
  "label": "Director Signature",
  "imageUrl": "https://example.com/signature.png"
}
```

### Update Signature
```http
PUT /api/signatures/:id
Authorization: Bearer <token>
```

### Delete Signature
```http
DELETE /api/signatures/:id
Authorization: Bearer <token>
```

## Products API

### List Products
```http
GET /api/products
Authorization: Bearer <token>
```

### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premium T-Shirt",
  "sku": "TS-001",
  "description": "Cotton T-Shirt with print",
  "defaultPrice": "599.00",
  "hsnCode": "6109",
  "gstRate": "12.00"
}
```

### Update Product
```http
PUT /api/products/:id
Authorization: Bearer <token>
```

### Import Products from CSV
```http
POST /api/products/import-csv
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- file: [CSV file]
```

**CSV Format (Shopify Export):**
- Columns: Handle, Title, Body (HTML), Vendor, Product Category, Type, Tags, Published, Option1 Name, Option1 Value, Variant SKU, Variant Price, Variant Tax Code, Image Src
- Column mapping:
  - `Title` → `name`
  - `Variant SKU` → `sku`
  - `Body (HTML)` → `description`
  - `Variant Price` → `defaultPrice`
  - `Variant Tax Code` → `hsnCode` + `gstRate` (parsed)
  - `Handle` → `shopifyProductId`

**Response:**
```json
{
  "message": "Products import completed",
  "importedCount": 10,
  "updatedCount": 5,
  "skipped": 2,
  "errors": []
}
```

**Note:** Products are upserted by SKU - existing products are updated, new products are created.

### Download Products CSV Template
```http
GET /api/products/sample-csv
```

Returns a CSV template with sample data showing the expected column format.

## Orders API

### List Orders
```http
GET /api/orders
Authorization: Bearer <token>
```

### Import Orders
```http
POST /api/orders/import
Authorization: Bearer <token>
Content-Type: application/json

{
  "orders": [
    {
      "shopifyOrderId": "12345",
      "shopifyOrderNumber": "ORD-001",
      "entityId": 1,
      "orderDate": "2025-11-08T10:00:00Z",
      "customerName": "Jane Smith",
      "customerEmail": "jane@example.com",
      "customerPhone": "+91 9876543210",
      "billingAddress": "456 Customer St, City",
      "shippingAddress": "456 Customer St, City",
      "shippingState": "Karnataka",
      "shippingStateCode": "29",
      "currency": "INR",
      "subtotal": "1000.00",
      "total": "1180.00",
      "items": [
        {
          "productId": 1,
          "name": "Premium T-Shirt",
          "sku": "TS-001",
          "quantity": "2",
          "unitPrice": "500.00",
          "hsnCode": "6109",
          "gstRate": "18.00"
        }
      ]
    }
  ]
}
```

### Import Orders from CSV
```http
POST /api/orders/import-csv
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- file: [CSV file]
```

**CSV Format (Shopify Export):**
- Columns: Name, Email, Created at, Lineitem name, Lineitem quantity, Lineitem price, Shipping Province Code, Billing Province Code, Shipping Name, Shipping Address1, Shipping City, Shipping Zip, Lineitem sku, Lineitem tax, etc.
- **Important:** Multiple rows with the same `Name` are grouped into a single order with multiple line items
- Column mapping:
  - `Name` → `shopifyOrderNumber` (order identifier)
  - `Email` → `customerEmail`
  - `Created at` → `orderDate`
  - `Shipping Name` → `customerName`
  - `Lineitem name` → order item `name`
  - `Lineitem sku` → order item `sku` (used to fetch HSN/GST from products)
  - `Lineitem quantity` → order item `quantity`
  - `Lineitem price` → order item `unitPrice`
  - `Shipping Province Code` → `shippingStateCode` (mapped to full state name)

**Response:**
```json
{
  "message": "Orders import completed",
  "importedCount": 25,
  "skipped": 1,
  "duplicates": 3,
  "errors": []
}
```

**Note:** 
- Orders are identified by `Name` (Shopify order number) - duplicates are skipped
- HSN codes and GST rates are automatically fetched from products by matching SKU
- Multiple CSV rows with same order name are combined into one order with multiple items

### Download Orders CSV Template
```http
GET /api/orders/sample-csv
```

Returns a CSV template with sample data showing the expected column format.

### Create Invoice from Order
```http
POST /api/orders/:id/create-invoice
Authorization: Bearer <token>
Content-Type: application/json

{
  "entityId": 1
}
```

**Response:** Returns the created draft invoice with all fields pre-filled and GST calculated based on entity state vs shipping state.

## Invoices API

### List Invoices
```http
GET /api/invoices
Authorization: Bearer <token>
```

### Get Invoice
```http
GET /api/invoices/:id
Authorization: Bearer <token>
```

### Create Invoice
```http
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoice": {
    "entityId": 1,
    "invoiceDate": "2025-11-08T10:00:00Z",
    "dueDate": "2025-11-15T10:00:00Z",
    "type": "regular",
    "buyerName": "ABC Corporation",
    "buyerCompany": "ABC Corp Pvt Ltd",
    "buyerEmail": "accounts@abc.com",
    "buyerGstin": "29AABCT1332L1ZZ",
    "billingAddress": "123 Buyer Street, City",
    "shippingAddress": "123 Buyer Street, City",
    "placeOfSupply": "29-Karnataka",
    "bankId": 1,
    "signatureId": 1,
    "notes": "Thank you for your business",
    "terms": "Payment due within 7 days"
  },
  "items": [
    {
      "productId": 1,
      "description": "Premium T-Shirt",
      "hsnCode": "6109",
      "quantity": "2",
      "unit": "PCS",
      "rate": "500.00",
      "priceIncludesTax": false,
      "discountPercent": "0",
      "taxableValue": "1000.00",
      "gstRate": "18.00",
      "cgstAmount": "90.00",
      "sgstAmount": "90.00",
      "igstAmount": "0",
      "cessAmount": "0",
      "lineTotal": "1180.00"
    }
  ]
}
```

### Update Invoice
```http
PUT /api/invoices/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoice": { ... },
  "items": [ ... ]
}
```

### Finalize Invoice
```http
POST /api/invoices/:id/finalize
Authorization: Bearer <token>
```

**Note:** This assigns an invoice number, locks the invoice (isDraft = false), and increments the entity's invoice counter.

### Generate PDF
```http
POST /api/invoices/:id/pdf
Authorization: Bearer <token>
```

**Response:**
```json
{
  "pdfUrl": "/attached_assets/invoices/invoice-INV-0001.pdf"
}
```

## Payments API

### List Payments for Invoice
```http
GET /api/invoices/:id/payments
Authorization: Bearer <token>
```

### Add Payment
```http
POST /api/invoices/:id/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": "1180.00",
  "mode": "UPI",
  "notes": "Payment received",
  "utrOrRef": "UTR12345678"
}
```

**Note:** Payment status is automatically updated based on total paid vs invoice total.

## Shopify Integration

### Import Products from Shopify
```http
POST /api/shopify/products/import
Authorization: Bearer <token>
Content-Type: application/json

{
  "products": [
    {
      "shopifyProductId": "12345",
      "name": "Product Name",
      "sku": "SKU-001",
      "defaultPrice": "999.00",
      "hsnCode": "6109",
      "gstRate": "18.00"
    }
  ]
}
```

### Import Orders from Shopify
```http
POST /api/shopify/orders/import
Authorization: Bearer <token>
Content-Type: application/json

{
  "orders": [
    {
      "shopifyOrderId": "67890",
      "shopifyOrderNumber": "ORD-002",
      ...
    }
  ]
}
```

## GST Calculation Logic

The system automatically determines whether to use CGST+SGST or IGST based on:

1. **Intra-state (same state)**: Uses CGST + SGST
   - Entity state code === Place of Supply state code
   - Example: Entity in Karnataka (29), Supply to Karnataka (29)

2. **Inter-state (different states)**: Uses IGST
   - Entity state code !== Place of Supply state code
   - Example: Entity in Karnataka (29), Supply to Kerala (32)

## Frontend Integration Example

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
};

// Fetch invoices
const fetchInvoices = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/invoices', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

// Import products from CSV
const importProductsCSV = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/products/import-csv', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  return response.json();
};

// Import orders from CSV
const importOrdersCSV = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/orders/import-csv', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  return response.json();
};

// Download sample CSV templates
const downloadProductTemplate = () => {
  window.open('/api/products/sample-csv', '_blank');
};

const downloadOrderTemplate = () => {
  window.open('/api/orders/sample-csv', '_blank');
};

// Create invoice from order
const createInvoiceFromOrder = async (orderId, entityId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/orders/${orderId}/create-invoice`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ entityId }),
  });
  return response.json();
};

// Generate PDF
const generatePDF = async (invoiceId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await response.json();
  window.open(data.pdfUrl, '_blank');
};
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Resource not found
- `500`: Server error

Error response format:
```json
{
  "error": "Error message description"
}
```

## Audit Logging

All write operations (create, update, delete) are automatically logged in the `audit_logs` table with:
- User ID
- Account ID
- Action type
- Target type and ID
- Before/after JSON snapshots
- Timestamp

## Multi-Tenant Isolation

All data is automatically scoped by `account_id`. Users can only access data belonging to their account. This is enforced at the database query level using the authenticated user's account ID.
