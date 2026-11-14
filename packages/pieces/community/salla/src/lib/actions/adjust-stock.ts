import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaUtils } from '../common/helpers';
import { sallaOutputSchemas } from '../common/output-schemas';
import { StockIdentifierType, StockMode, sallaProducts } from '../common/products';
import { sallaProps } from '../common/props';

export const adjustStockAction = createAction({
  auth: sallaAuth,
  name: 'adjust_stock',
  classification: 'WRITE',
  displayName: 'Adjust Stock',
  description:
    'Adds units to, removes units from, or sets the stock of a product or variant. Salla queues the change, so it can take a few minutes to show in the store.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds, removes or sets the stock quantity of one Salla product or variant, found by product ID, variant ID or SKU, optionally for one branch and with a stock change reason. Use Update Variant to change other variant fields. Salla queues the change and it can take minutes to show; Add and Remove stack up on every call, so do not retry blindly.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.stockAdjustment,
  props: {
    mode: Property.StaticDropdown<StockMode, true>({
      displayName: 'Change',
      description: 'Add (increment) or Remove (decrement) units from the current stock, or Set (overwrite) the stock to the quantity below.',
      display: 'cards',
      required: true,
      defaultValue: 'increment',
      options: {
        options: [
          { label: 'Add', value: 'increment', description: 'Add units to the current stock.' },
          { label: 'Remove', value: 'decrement', description: 'Take units out of the current stock.' },
          { label: 'Set', value: 'overwrite', description: 'Replace the stock with this number.' },
        ],
      },
    }),
    find_by: Property.StaticDropdown<StockIdentifierType, true>({
      displayName: 'Find By',
      description:
        'Product for a product without options, Variant for one option combination such as Red / M, or SKU (works for both, for example TSHIRT-RED-M).',
      required: true,
      defaultValue: 'id',
      options: {
        options: [
          { label: 'Product', value: 'id' },
          { label: 'Variant', value: 'variant_id' },
          { label: 'SKU', value: 'sku' },
        ],
      },
    }),
    product: sallaProps.product({
      required: false,
      description: 'Needed when Find By is Product or Variant. Pick it or search by name or SKU. In a flow, map the numeric product ID, for example 1672932878.',
    }),
    variant: sallaProps.variant({
      required: false,
      description: 'Needed when Find By is Variant. Lists the variants of the product above. In a flow, map the numeric variant ID, for example 1980012345.',
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'SKU of the product or variant, for example TSHIRT-RED-M. Needed when Find By is SKU.',
      placeholder: 'TSHIRT-RED-M',
      required: false,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Whole number of units. Above 0 for Add and Remove, for example 5; 0 or more for Set.',
      placeholder: '5',
      required: true,
    }),
    branch: {
      ...sallaProps.branch({
        required: false,
        description: 'Branch or warehouse whose stock changes. Leave empty for the store default. In a flow, map the numeric branch ID, for example 1473353380.',
      }),
      advanced: true,
    },
    reason: {
      ...sallaProps.stockChangeReason({
        required: false,
        description: 'Why the stock changed, saved in the Salla quantity history, for example Restock or Damaged. In a flow, map the numeric reason ID.',
      }),
      advanced: true,
    },
  },
  async run({ auth, propsValue }) {
    const identifierType = propsValue.find_by;
    return sallaProducts.adjustStock({
      auth,
      input: {
        lines: [
          {
            identifierType,
            identifier: identifierFor({
              identifierType,
              product: propsValue.product,
              variant: propsValue.variant,
              sku: propsValue.sku,
            }),
            quantity: propsValue.quantity,
            mode: propsValue.mode,
            branchId: propsValue.branch ?? undefined,
            reasonId: propsValue.reason ?? undefined,
          },
        ],
      },
    });
  },
});

function identifierFor({
  identifierType,
  product,
  variant,
  sku,
}: {
  identifierType: StockIdentifierType;
  product: unknown;
  variant: unknown;
  sku: unknown;
}): string {
  if (identifierType === 'sku') {
    return requireText({ value: sku, label: 'SKU', message: 'Give the SKU of the product or variant, for example TSHIRT-RED-M.' });
  }
  if (identifierType === 'variant_id') {
    return requireText({ value: variant, label: 'Variant', message: 'Pick the product and then the variant whose stock changes.' });
  }
  return requireText({ value: product, label: 'Product', message: 'Pick the product whose stock changes.' });
}

function requireText({ value, label, message }: { value: unknown; label: string; message: string }): string {
  const text = sallaUtils.dropdownText({ value, label });
  if (text === undefined) {
    throw new Error(message);
  }
  return text;
}
