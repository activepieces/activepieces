import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaApi } from '../../common/client';
import { sallaUtils } from '../../common/helpers';
import { sallaOutputSchemas } from '../../common/output-schemas';
import { sallaProducts, STOCK_IDENTIFIER_TYPES, STOCK_MODES, StockIdentifierType, StockLineInput, StockMode } from '../../common/products';

export const aiAdjustStockAction = createAction({
  auth: sallaAuth,
  name: 'ai_adjust_stock',
  classification: 'WRITE',
  displayName: 'Adjust Stock',
  description: 'Adds, removes or sets stock for one or more products or variants.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds to, removes from or sets the stock count of one or more Salla products or variants in one request, found by product ID, variant ID or SKU, optionally per branch. Use it for stock changes rather than Update Product or Update Variant; find ids with List Products or Get Product and branch IDs with List Branches. Salla queues the change, so new counts can take a few minutes to show, and a retry of increment or decrement lines changes stock again.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.stockAdjustment,
  props: {
    lines: Property.Array({
      displayName: 'Stock Lines',
      description:
        'One entry per product or variant, for example [{"identifier_type":"sku","identifier":"TSHIRT-RED-M","quantity":5,"mode":"increment"},{"identifier_type":"variant_id","identifier":"1395346624","quantity":0,"mode":"overwrite","branch_id":999858679}]. identifier_type is id (product ID), variant_id or sku; mode is increment (add), decrement (remove) or overwrite (set to exactly quantity).',
      required: true,
      properties: {
        identifier_type: Property.StaticDropdown({
          displayName: 'Identifier Type',
          description: 'id when identifier is the numeric product ID, variant_id when it is a variant ID from Get Product skus, sku when it is a SKU.',
          required: true,
          options: {
            disabled: false,
            options: [
              { label: 'Product ID', value: 'id' },
              { label: 'Variant ID', value: 'variant_id' },
              { label: 'SKU', value: 'sku' },
            ],
          },
        }),
        identifier: Property.ShortText({
          displayName: 'Identifier',
          description: 'The product ID (for example 1672932878), variant ID (for example 1395346624) or SKU (for example TSHIRT-RED-M).',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'Whole number of units, for example 5. Must be above 0 for increment and decrement; 0 is allowed for overwrite.',
          required: true,
        }),
        mode: Property.StaticDropdown({
          displayName: 'Mode',
          description: 'increment adds quantity, decrement removes it, overwrite sets the stock to exactly quantity.',
          required: true,
          options: {
            disabled: false,
            options: [
              { label: 'Add (increment)', value: 'increment' },
              { label: 'Remove (decrement)', value: 'decrement' },
              { label: 'Set (overwrite)', value: 'overwrite' },
            ],
          },
        }),
        branch_id: Property.Number({
          displayName: 'Branch ID',
          description: 'Numeric branch ID from List Branches, for example 999858679. Leave empty for the store default.',
          required: false,
        }),
        reason_id: Property.Number({
          displayName: 'Reason ID',
          description: 'Numeric Salla stock change reason ID, for example 1473353380, from List Stock Change Reasons. Leave empty for no reason.',
          required: false,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    return sallaProducts.adjustStock({
      auth,
      input: { lines: toStockLines(propsValue.lines) },
    });
  },
});

function toStockLines(value: unknown): StockLineInput[] {
  const entries = sallaUtils.toRecordList({ value, label: 'lines' });
  return entries.map((entry, index) => {
    const line = index + 1;
    if (!sallaApi.isRecord(entry)) {
      throw new Error(
        `Stock line ${line} must be an object such as {"identifier_type":"sku","identifier":"TSHIRT-RED-M","quantity":5,"mode":"increment"}.`,
      );
    }
    return {
      identifierType: toIdentifierType({ value: entry['identifier_type'], line }),
      identifier: toScalar(entry['identifier']) ?? '',
      quantity: toScalar(entry['quantity']) ?? '',
      mode: toMode({ value: entry['mode'], line }),
      branchId: toScalar(entry['branch_id']),
      reasonId: toScalar(entry['reason_id']),
    };
  });
}

function toIdentifierType({ value, line }: { value: unknown; line: number }): StockIdentifierType {
  const match = STOCK_IDENTIFIER_TYPES.find((type) => type === value);
  if (!match) {
    throw new Error(`Stock line ${line}: identifier_type must be id, variant_id or sku, but got "${String(value ?? '')}".`);
  }
  return match;
}

function toMode({ value, line }: { value: unknown; line: number }): StockMode {
  const match = STOCK_MODES.find((mode) => mode === value);
  if (!match) {
    throw new Error(`Stock line ${line}: mode must be increment, decrement or overwrite, but got "${String(value ?? '')}".`);
  }
  return match;
}

function toScalar(value: unknown): string | number | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}
