# Dealer Portal Imports & Verification

## Tier Pricing Logic (dev note)
- Source: `lib/pricing.ts`
- Tier selection: `resolveTierForCategory` chooses the dealer tier based on part category:
  - `GENUINE` → `genuineTier`
  - `AFTERMARKET` → `aftermarketTier`
  - `BRANDED` → `brandedTier`
  - fallback defaults to `aftermarketTier` for unknown categories
- Price columns: `getTierPrice` maps tiers A–F to `CatalogPart.bandA`–`CatalogPart.bandF`.
- Fallback: `resolveUnitPrice` uses the tier price unless it is below `minimumPrice`, in which case `minimumPrice` is used.

## A) Dealer import (script)
1. Run: `npm run import:dealers -- "mnt/data/Dealer_Accounts_Sample_30_NetTiers.xlsx"`
2. Confirm console summary shows created/updated counts.
3. Go to Admin → Users → Dealer Users and verify account numbers and tiers.
4. Log in as an imported dealer using the email and the Temp password from the file.

## B) Products import (Admin uploads)
1. Go to Admin → Uploads.
2. Upload the XLSX in **Parts (Aftermarket)** to import ES (aftermarket) rows.
3. Upload the same XLSX in **Parts (Genuine)** to import GN + BR rows.
4. Go to the portal Parts search page and search for a known product code.
5. Confirm category tagging (Genuine / Aftermarket / Branded) and tier pricing shown.
6. Quick checklist (using an imported dealer with known tiers):
   - Genuine: `AKA710840LYQ` (Discount code `gn`)
   - Aftermarket: `AKA710840LYQES` (Discount code `es`)
   - Branded: `C2C38925ES` (Discount code `br`)

## C) Backorders upload
1. Go to Admin → Backorders.
2. Upload `mnt/data/order_status.csv`.
3. Confirm the “Uploaded successfully” toast appears.
4. Verify order line statuses update in the Backorders table (or order detail pages).

## D) Order export
1. Place an order as an imported dealer in the portal.
2. Go to Admin → Order Export.
3. Download CSV.
4. Confirm the CSV includes dealer fields and one row per item line with status and qty fields.
