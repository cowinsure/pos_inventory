# Dark Theme Implementation Tasks

## Chunk 1 — Foundation ✅
- [x] Add `ThemeProvider` context in `lib/theme-context.tsx` (persists to localStorage)
- [x] Wire `ThemeProvider` into root `app/layout.tsx`
- [x] Add `dark` class toggle to `<html>` element

## Chunk 2 — Global Styles ✅
- [x] Add dark CSS variables to `app/globals.css` (background, foreground, card, border, muted, primary)
- [x] Add dark variants for utility classes (`.btn`, `.btn-primary`, `.btn-secondary`, `.input`, `.label`, `.badge`, `.card`, `.stat-card`, `.table-container`)

## Chunk 3 — Dashboard Layout + Toggle ✅
- [x] Add dark mode `dark:` classes to `app/dashboard/layout.tsx` (sidebar, nav, mobile header)
- [x] Add theme toggle button (sun/moon icon) in the dashboard header

## Chunk 4 — Auth Pages ✅
- [x] `app/login/page.tsx` — dark background, card, inputs, buttons
- [x] `app/signup/page.tsx` — dark background, card, inputs, buttons

## Chunk 5 — Inventory Components ✅
- [x] `app/components/InventoryListTab.tsx`
- [x] `app/components/ReceiveTab.tsx`
- [x] `app/components/SellTab.tsx`
- [x] `app/components/AdjustTab.tsx`
- [x] `app/components/BarcodeTab.tsx`
- [x] `app/components/DailyStockTab.tsx`

## Chunk 6 — Dashboard Pages ✅
- [x] `app/dashboard/page.tsx`
- [x] `app/dashboard/categories/page.tsx`
- [x] `app/dashboard/products/page.tsx`
- [x] `app/dashboard/suppliers/page.tsx`
- [x] `app/dashboard/inventory/page.tsx`
- [x] `app/dashboard/inventory/list/page.tsx`
- [x] `app/dashboard/inventory/receive/page.tsx`
- [x] `app/dashboard/inventory/sell/page.tsx`
- [x] `app/dashboard/inventory/adjust/page.tsx`
- [x] `app/dashboard/inventory/daily-stock/page.tsx`
- [x] `app/dashboard/inventory/barcode/page.tsx`
