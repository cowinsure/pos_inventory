# Task: Sales History Feature

## Overview

Add a **Sales History** page that lets staff view all past sales, drill into a single sale's details, and filter the list by customer.

---

## Where This Fits

| What | Where |
|------|-------|
| TypeScript interfaces | `lib/api.ts` — add `SaleLine`, `SaleRecord`, `SalesListResponse` |
| API methods | `lib/api.ts` → `realApi` object |
| Page | `app/dashboard/sales/history/page.tsx` *(new)* |
| Component | `app/components/SalesHistoryTab.tsx` *(new)* |
| Nav link | `app/dashboard/layout.tsx` → `navItems` array |

---

## API

### 1. Get All Sales

**Endpoint:** `GET /sales`

**Query params (all optional):**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Pagination page (default 1) |
| `limit` | number | Items per page (default 20) |

**Example:** `GET /sales?page=1&limit=5`

**Response:**
```json
{
    "items": [
        {
            "id": 1,
            "tenantId": 1,
            "saleNumber": "SALE-1778827067393-0C3C86A4",
            "customerId": 1,
            "customer": {
                "id": 1,
                "tenantId": 1,
                "name": "John Doe",
                "phone": "+1234567890",
                "email": "john@example.com",
                "address": "123 Main St",
                "active": true,
                "createdAt": "2026-04-24T06:03:58.027Z",
                "updatedAt": "2026-04-24T06:03:58.027Z"
            },
            "paymentMethod": "CASH",
            "grossAmount": "10.00",
            "discountAmount": "0.00",
            "netAmount": "10.00",
            "totalCost": "99.97",
            "status": "COMPLETED",
            "soldAt": "2026-05-15T06:37:47.372Z",
            "journalEntryId": 2,
            "lines": [
                {
                    "id": 1,
                    "tenantId": 1,
                    "salesRecordId": 1,
                    "inventoryItemId": 66,
                    "productId": 2,
                    "product": {
                        "id": 2,
                        "name": "Cotton t-shirt 007 (S)",
                        "sku": "COTTON-T-SHIRT-007-S",
                        "basePrice": "10.00",
                        "attributes": { "Size": "S" }
                    },
                    "barcode": "150C5053D6",
                    "salePrice": "10.00",
                    "discountAmount": "0.00",
                    "netAmount": "10.00",
                    "acquisitionCost": "99.97"
                }
            ],
            "createdAt": "2026-05-15T06:37:47.364Z",
            "updatedAt": "2026-05-15T06:37:47.364Z"
        }
    ],
    "page": 1,
    "limit": 5,
    "total": 1,
    "pageCount": 1,
    "hasNext": false
}
```

---

### 2. Get Sale by ID

**Endpoint:** `GET /sales/:id`

**Example:** `GET /sales/1`

**Response:** Same shape as a single item from the list, plus a `journalEntry` object:
```json
{
    "id": 1,
    "tenantId": 1,
    "saleNumber": "SALE-1778827067393-0C3C86A4",
    "customerId": 1,
    "customer": {
        "id": 1,
        "name": "John Doe",
        "phone": "+1234567890",
        "email": "john@example.com",
        "address": "123 Main St",
        "active": true,
        "createdAt": "2026-04-24T06:03:58.027Z",
        "updatedAt": "2026-04-24T06:03:58.027Z"
    },
    "paymentMethod": "CASH",
    "grossAmount": "10.00",
    "discountAmount": "0.00",
    "netAmount": "10.00",
    "totalCost": "99.97",
    "status": "COMPLETED",
    "soldAt": "2026-05-15T06:37:47.372Z",
    "journalEntryId": 2,
    "journalEntry": {
        "id": 2,
        "date": "2026-05-15",
        "reference": "SALE-CASH-1778827067449",
        "description": "Cash sale for 10",
        "eventType": "SALE",
        "createdAt": "2026-05-15T06:37:47.364Z"
    },
    "lines": [
        {
            "id": 1,
            "salesRecordId": 1,
            "inventoryItemId": 66,
            "productId": 2,
            "product": {
                "id": 2,
                "name": "Cotton t-shirt 007 (S)",
                "sku": "COTTON-T-SHIRT-007-S",
                "basePrice": "10.00",
                "attributes": { "Size": "S" }
            },
            "barcode": "150C5053D6",
            "salePrice": "10.00",
            "discountAmount": "0.00",
            "netAmount": "10.00",
            "acquisitionCost": "99.97"
        }
    ],
    "createdAt": "2026-05-15T06:37:47.364Z",
    "updatedAt": "2026-05-15T06:37:47.364Z"
}
```

---

### 3. Get Sales by Customer

**Endpoint:** `GET /sales/customers/:customerId`

**Example:** `GET /sales/customers/1`

**Response:** Same paginated shape as `GET /sales` — `items`, `page`, `limit`, `total`, `pageCount`, `hasNext`.

---

## TypeScript Interfaces (`lib/api.ts`)

```ts
export interface SaleLine {
  id: number;
  tenantId: number;
  salesRecordId: number;
  inventoryItemId: number;
  productId: number;
  product: Product;
  barcode: string;
  salePrice: string;
  discountAmount: string;
  netAmount: string;
  acquisitionCost: string;
}

export interface JournalEntry {
  id: number;
  tenantId?: number;
  date: string;
  reference: string;
  description: string;
  eventType: string;
  createdAt: string;
}

export interface SaleRecord {
  id: number;
  tenantId: number;
  saleNumber: string;
  customerId: number | null;
  customer: Customer | null;
  paymentMethod: string;
  grossAmount: string;
  discountAmount: string;
  netAmount: string;
  totalCost: string;
  status: string;
  soldAt: string;
  journalEntryId: number | null;
  journalEntry?: JournalEntry | null;
  lines: SaleLine[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesListResponse {
  items: SaleRecord[];
  page: number;
  limit: number;
  total: number;
  pageCount: number;
  hasNext: boolean;
}
```

> `grossAmount`, `discountAmount`, `netAmount`, `totalCost`, `salePrice`, `acquisitionCost` come back as **strings** from the API — parse with `parseFloat()` before arithmetic or display.

---

## API Methods (`lib/api.ts`)

Add to `realApi`:

```ts
getSales: (params?: { page?: number; limit?: number }) =>
  api.get<SalesListResponse>('/sales', params),

getSale: (id: number) =>
  api.get<SaleRecord>(`/sales/${id}`),

getSalesByCustomer: (customerId: number, params?: { page?: number; limit?: number }) =>
  api.get<SalesListResponse>(`/sales/customers/${customerId}`, params),
```

---

## Navigation (`app/dashboard/layout.tsx`)

Add to `navItems` after the `'Sell'` entry:

```ts
{ href: '/dashboard/sales/history', label: 'Sales History', icon: 'history' },
```

Add `history` icon to the `icons` map (in the same file):

```tsx
history: (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
),
```

---

## Page (`app/dashboard/sales/history/page.tsx`)

Thin wrapper — just renders `<SalesHistoryTab />`.

```tsx
import SalesHistoryTab from '@/app/components/SalesHistoryTab';

export default function SalesHistoryPage() {
  return <SalesHistoryTab />;
}
```

---

## Component (`app/components/SalesHistoryTab.tsx`)

### Layout

```
Sales History
├── Filter bar
│   ├── Customer dropdown (searchable, "All customers" default)
│   └── [Clear filter] button (shown only when a customer is selected)
├── Sales table
│   ├── Sale # | Date | Customer | Payment | Status | Discount | Net Amount | [View]
│   └── Pagination controls (Prev / Page X of Y / Next)
└── Sale Detail modal/panel (shown when [View] is clicked)
    ├── Header: Sale Number, Status badge, soldAt date
    ├── Customer: name, phone, email
    ├── Payment method, Journal reference
    ├── Lines table: Barcode | Product | SKU | Sale Price | Discount | Net
    └── Footer: Gross | Discount | Net Amount
```

### Behaviour

- On mount: load customers (`realApi.getCustomers()`) for the dropdown, then fetch `realApi.getSales({ page: 1, limit: 20 })`.
- Customer filter: when a customer is selected, switch to `realApi.getSalesByCustomer(customerId, { page: 1 })` and reset pagination. Clearing the filter goes back to `getSales`.
- Pagination: Prev/Next buttons pass `{ page }` to whichever endpoint is active.
- [View] button: calls `realApi.getSale(id)` and opens a detail panel/modal.
- Amount display: parse string amounts with `parseFloat()` then format as `$${value.toFixed(2)}`.
- Loading state: spinner in the table area while any fetch is in flight.
- Empty state: "No sales found." when `items` is empty.
- Error state: show the API error message inline.

### Amount formatting

```ts
const fmt = (s: string | number) => `$${parseFloat(String(s)).toFixed(2)}`;
```

---

## Acceptance Criteria

- [ ] Sales History page reachable via `/dashboard/sales/history` and the sidebar link.
- [ ] Table lists sales with sale number, date (`soldAt`), customer name, payment method, status, discount, and net amount.
- [ ] Customer dropdown filters using `GET /sales/customers/:id`; clearing it reverts to `GET /sales`.
- [ ] Pagination (Prev / Next / page count) works correctly for both endpoints.
- [ ] Clicking [View] fetches `GET /sales/:id` and shows the detail panel with `journalEntry` info and full `lines` table.
- [ ] String amounts (`grossAmount`, `netAmount`, etc.) are parsed to floats before display.
- [ ] Loading, empty, and error states are handled.
- [ ] Dark mode works (follows existing theme conventions).
