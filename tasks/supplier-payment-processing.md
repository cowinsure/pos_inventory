# Task: Supplier Payment Processing Feature

## Overview

Add a **Supplier Payment** form to the Finance page (`app/dashboard/finance/page.tsx`) that allows users to record payments made to suppliers against their balance.

---

## API

### Create Payment

**Endpoint:** `POST /accounting/supplier-payments`

**Payload:**
```json
{
  "supplierId": 1,
  "amount": 180.75,
  "description": "Paid April supplier balance"
}
```

**Response:** The created payment record (id, supplierId, amount, description, createdAt, etc.)

---

### Get Supplier Ledger

**Endpoint:** `GET /accounting/ledger/suppliers/:supplierId`

**Example:** `GET /accounting/ledger/suppliers/1`

**Response:** Ledger summary and payment history for the specified supplier.

```json
{
  "supplierId": 1,
  "supplierName": "Supplier Name",
  "totalPaid": 360.50,
  "payments": [
    {
      "id": 1,
      "amount": 180.75,
      "description": "Paid April supplier balance",
      "createdAt": "2026-05-15T10:00:00.000Z"
    }
  ]
}
```

---

## UI — Finance Page (`app/dashboard/finance/page.tsx`)

The page is currently empty. Build it out starting with the Supplier Payment section.

### Layout

```
Finance
└── Supplier Payments card
    ├── Supplier dropdown (searchable, same pattern as other pages)
    ├── Amount input (number, currency prefix $, required)
    ├── Description textarea (optional)
    └── [Record Payment] button
```

### Behaviour

- Load all suppliers on mount via `realApi.getSuppliers()`.
- Supplier dropdown is searchable (filter by name).
- Amount must be > 0 before the button is enabled.
- On success: reset form, show a brief success toast/message, and refresh the payments list.
- On error: display the API error message inline.

---

## API Integration (`lib/api.ts`)

Add to `realApi`:

```ts
createSupplierPayment: (data: { supplierId: number; amount: number; description?: string }) =>
  api.post<SupplierPayment>('/accounting/supplier-payments', data),

getSupplierLedger: (supplierId: number) =>
  api.get<SupplierLedger>(`/accounting/ledger/suppliers/${supplierId}`),
```

Add interfaces:

```ts
export interface SupplierPayment {
  id: number;
  supplierId: number;
  amount: number;
  description: string | null;
  createdAt: string;
}

export interface SupplierLedger {
  supplierId: number;
  supplierName: string;
  totalPaid: number;
  payments: SupplierPayment[];
}
```

---

## Payments History Table

When a supplier is selected in the dropdown, fetch their ledger via `GET /accounting/ledger/suppliers/:supplierId` and display:

**Ledger summary bar:**
```
Supplier Name — Total Paid: $360.50
```

**Payments table:**

| Date | Amount | Description |
|------|--------|-------------|
| 2026-05-15 | $180.75 | Paid April supplier balance |

- Fetch ledger when the selected supplier changes (and after each successful submission).
- Show `totalPaid` as a summary above the table.
- Format amounts as currency.
- Sort payments by `createdAt` descending (newest first).
- Show an empty state message if the supplier has no payments yet.

---

## Acceptance Criteria

- [ ] Finance page renders with a "Supplier Payments" heading and form.
- [ ] Supplier dropdown populates from `GET /suppliers`.
- [ ] Submitting the form calls `POST /accounting/supplier-payments` with the correct payload.
- [ ] Form resets on success.
- [ ] Selecting a supplier fetches their ledger via `GET /accounting/ledger/suppliers/:id`.
- [ ] Ledger shows `totalPaid` summary and payments table, refreshed after each new payment.
- [ ] Button is disabled when supplierId is unset or amount ≤ 0.
- [ ] Dark mode works (follows existing theme conventions).
