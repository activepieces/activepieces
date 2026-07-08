import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

/**
 * Create one or more filament spool records.
 *
 * `filament/Create` accepts a single spool description; the backend handles
 * "amount > 1" by replicating the payload server-side. We expose `amount`
 * here for convenience (capped at 500 by the backend at create-time).
 *
 * Catalog mapping: pass either free-text `brand` + `colorName` + `colorHex`
 * (creates a free-form spool), OR the catalog `brandId` / `brandFilamentId`
 * / `brandColorId` / `brandVariantId` chain to attach a known SKU. Free-text
 * fields stay required even when the catalog ids are passed; the backend
 * uses both to populate the spool record.
 */
export const createFilamentAction = createAction({
  auth: simplyprintAuth,
  name: 'create_filament',
  displayName: 'Create Filament',
  description:
    'Add a new filament spool to your inventory. Use the free-text brand/color fields for ad-hoc spools or the catalog ids for known SKUs.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create one or more new filament spool records in inventory, supplying brand/color/diameter and total length-or-weight, optionally via catalog SKU IDs instead of free-text. Use the "Number of spools" field to create N identical spools at once (capped at 500). Not idempotent — each call adds new spools, so re-running creates duplicates; either a material type ID or a catalog filament-ID chain is required.',
    idempotent: false,
  },
  props: {
    brand: Property.ShortText({
      displayName: 'Brand',
      description: 'Free-text brand name (always required, even when catalog ids are set).',
      required: true,
    }),
    colorName: Property.ShortText({
      displayName: 'Color name',
      required: true,
    }),
    colorHex: Property.ShortText({
      displayName: 'Color hex',
      description: 'Hex color (e.g. `#FF8800`). For multi-color spools, comma-separate (e.g. `#FF8800,#0044CC`).',
      required: true,
    }),
    width: Property.StaticDropdown<'1.75' | '2.85' | '3.00'>({
      displayName: 'Filament diameter (mm)',
      required: true,
      defaultValue: '1.75',
      options: {
        options: [
          { label: '1.75 mm', value: '1.75' },
          { label: '2.85 mm', value: '2.85' },
          { label: '3.00 mm', value: '3.00' },
        ],
      },
    }),
    totalLength: Property.Number({
      displayName: 'Total length / weight',
      description: 'Spool size — interpretation depends on "Length type" below. Required when creating a new spool.',
      required: true,
    }),
    totalLengthType: Property.StaticDropdown<'g' | 'kg' | 'm' | 'mm'>({
      displayName: 'Length type',
      description: 'Unit for "Total length / weight" and "Length used".',
      required: true,
      defaultValue: 'g',
      options: {
        options: [
          { label: 'Grams', value: 'g' },
          { label: 'Kilograms', value: 'kg' },
          { label: 'Meters', value: 'm' },
          { label: 'Millimeters', value: 'mm' },
        ],
      },
    }),
    lengthRemaining: Property.Number({
      displayName: 'Length remaining',
      description:
        'Amount of filament still on the spool. For a brand-new untouched spool, set this equal to "Total length / weight". For a partially-used spool, set this lower. Same unit as "Length type". (Backend\'s `length_used` POST param is, despite its name, semantically "remaining" — see Create.php math.)',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Number of spools',
      description: 'Create N identical spools at once (capped at 500). Defaults to 1.',
      required: false,
      defaultValue: 1,
    }),
    filamentType: Property.Number({
      displayName: 'Material type ID',
      description:
        'Numeric id of the material type / profile (look up via "List Filaments" results — `type.id` on each spool — or via your filament management page). EITHER this OR a "Catalog filament ID" (+ optional "Catalog variant ID") pair is required when creating a new spool — the backend uses the catalog chain to auto-resolve / auto-import a profile. Throws "The Filament type is required" if neither is set.',
      required: false,
    }),
    cost: Property.Number({
      displayName: 'Cost (per spool)',
      description: 'Optional. Spool cost in account currency (cents/whole-units depending on your currency).',
      required: false,
    }),
    locationId: Property.Number({
      displayName: 'Location ID',
      description: 'Optional. Numeric id of the storage location.',
      required: false,
    }),
    nfcId: Property.ShortText({
      displayName: 'NFC ID',
      description: 'Optional. NFC tag identifier for app tracking.',
      required: false,
    }),
    qrId: Property.ShortText({
      displayName: 'QR ID (short ID)',
      description: 'Optional. 4-character short id printed on the spool QR sticker. Auto-generated if omitted.',
      required: false,
    }),
    brandId: Property.Number({
      displayName: 'Catalog brand ID',
      required: false,
    }),
    brandFilamentId: Property.Number({
      displayName: 'Catalog filament ID',
      required: false,
    }),
    brandColorId: Property.Number({
      displayName: 'Catalog color ID',
      required: false,
    }),
    brandVariantId: Property.Number({
      displayName: 'Catalog variant ID',
      required: false,
    }),
  },
  async run(context) {
    const v = context.propsValue;
    // filament/Create requires ALL FOUR of total_length / length_used /
    // total_length_type / left_length_type when creating a new spool
    // (see Create.php line 416). We standardise both -types to the same
    // unit and default lengthUsed to 0 for a brand-new spool.
    if (typeof v.totalLength !== 'number' || v.totalLength <= 0) {
      throw new Error('"Total length / weight" is required and must be > 0 when creating a new spool.');
    }
    const lengthType = v.totalLengthType ?? 'g';
    // Default to "untouched" (remaining = total) when caller doesn't say.
    const lengthRemaining =
      typeof v.lengthRemaining === 'number' && v.lengthRemaining >= 0
        ? v.lengthRemaining
        : v.totalLength;
    const body: Record<string, unknown> = {
      brand: v.brand,
      color_name: v.colorName,
      color_hex: v.colorHex,
      width: v.width,
      amount: Math.min(500, Math.max(1, Math.floor(v.amount ?? 1))),
      total_length: v.totalLength,
      // NB: backend POST field is `length_used` but it's actually
      // "amount remaining" — the math at Create.php:466 sets
      // `spool.lengthUsed = mmLength - gramToMm(length_used)`, so
      // passing `length_used: 0` results in a fully-consumed spool.
      length_used: lengthRemaining,
      total_length_type: lengthType,
      left_length_type: lengthType,
    };
    if (typeof v.filamentType === 'number') body['filament_type'] = v.filamentType;
    if (typeof v.cost === 'number') body['cost'] = v.cost;
    if (typeof v.locationId === 'number') body['location_id'] = v.locationId;
    if (v.nfcId) body['nfc_id'] = v.nfcId;
    if (v.qrId) body['qr_id'] = v.qrId;
    if (typeof v.brandId === 'number') body['brand_id'] = v.brandId;
    if (typeof v.brandFilamentId === 'number') body['brand_filament_id'] = v.brandFilamentId;
    if (typeof v.brandColorId === 'number') body['brand_color_id'] = v.brandColorId;
    if (typeof v.brandVariantId === 'number') body['brand_variant_id'] = v.brandVariantId;

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'filament/Create',
      body,
    });
  },
});
