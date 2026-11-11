import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { BranchQuantityInput, sallaProducts } from '../common/products';
import { sallaProps } from '../common/props';

export const updateVariantAction = createAction({
  auth: sallaAuth,
  name: 'update_variant',
  classification: 'WRITE',
  displayName: 'Update Variant',
  description: 'Changes the SKU, prices, stock or barcode of one product variant (such as Red / M).',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates one Salla product variant (one option combination such as Red / M) by its variant ID and changes only the fields you fill: SKU, barcode, prices, stock, weight, MPN, GTIN or low stock alert. Use Update Product for the product itself and Adjust Stock to add or remove units. Sending the same values again gives the same result, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.variant,
  propertyGroups: [
    {
      key: 'target',
      display: 'section',
      label: 'Variant to Update',
      icon: 'filter',
      props: ['product', 'variant'],
    },
    {
      key: 'pricing',
      display: 'section',
      label: 'Pricing',
      description: 'Fill only what changes.',
      icon: 'tag',
      props: ['price', 'sale_price', 'cost_price'],
    },
    {
      key: 'inventory',
      display: 'section',
      label: 'Inventory',
      description: 'Fill only what changes.',
      icon: 'inbox',
      props: ['sku', 'barcode', 'stock_quantity', 'notify_low', 'weight'],
    },
  ],
  props: {
    product: sallaProps.product({
      required: false,
      description:
        'The product the variant belongs to. Only needed to pick the variant from the list. In a flow you can leave it empty and map the variant ID directly, or map the numeric product ID, for example 1672932878.',
    }),
    variant: sallaProps.variant({
      required: true,
      description: 'The variant to update, such as Red / M. Lists the variants of the product above. In a flow, map the numeric variant ID, for example 1980012345.',
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'New regular price of this variant in the store currency, for example 99.5. Leave empty to keep it.',
      placeholder: '99.5',
      width: 'half',
      required: false,
    }),
    sale_price: Property.Number({
      displayName: 'Sale Price',
      description: 'New discounted price, lower than the price, for example 79. Leave empty to keep it.',
      placeholder: '79',
      width: 'half',
      required: false,
    }),
    cost_price: Property.Number({
      displayName: 'Cost Price',
      description: 'What this variant costs you, for reports only, for example 40. Leave empty to keep it.',
      placeholder: '40',
      width: 'half',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'New SKU of this variant, unique in the store, for example TSHIRT-RED-M. Leave empty to keep it.',
      placeholder: 'TSHIRT-RED-M',
      width: 'half',
      required: false,
    }),
    barcode: Property.ShortText({
      displayName: 'Barcode',
      description: 'New barcode of this variant, for example 6281234567890. Leave empty to keep it.',
      placeholder: '6281234567890',
      width: 'half',
      required: false,
    }),
    stock_quantity: Property.Number({
      displayName: 'Stock Quantity',
      description: 'Set the units in stock to this whole number, for example 25. With a Branch under Advanced, sets the stock of that branch only. Leave empty to keep it.',
      placeholder: '25',
      width: 'half',
      required: false,
    }),
    notify_low: Property.Number({
      displayName: 'Low Stock Alert At',
      description: 'Salla warns you when the stock falls to this whole number, for example 3. Leave empty to keep it.',
      placeholder: '3',
      width: 'half',
      required: false,
    }),
    weight: Property.Number({
      displayName: 'Weight',
      description: 'New shipping weight of this variant in the product weight unit, for example 0.4. Leave empty to keep it.',
      placeholder: '0.4',
      width: 'half',
      required: false,
    }),
    mpn: Property.ShortText({
      displayName: 'MPN',
      description: 'New manufacturer part number, for example MPN-44521. Leave empty to keep it.',
      placeholder: 'MPN-44521',
      advanced: true,
      required: false,
    }),
    gtin: Property.ShortText({
      displayName: 'GTIN',
      description: 'New global trade item number, 8 to 14 digits, for example 6281234567890. Leave empty to keep it.',
      placeholder: '6281234567890',
      advanced: true,
      required: false,
    }),
    branch: {
      ...sallaProps.branch({
        required: false,
        description: 'Set Stock Quantity for this branch or warehouse only. Needs Stock Quantity. In a flow, map the numeric branch ID, for example 1473353380.',
      }),
      advanced: true,
    },
    reason: {
      ...sallaProps.stockChangeReason({
        required: false,
        description: 'Why the branch stock changed, saved in the Salla quantity history, for example Restock. Used with Branch only.',
      }),
      advanced: true,
    },
  },
  async run({ auth, propsValue }) {
    return sallaProducts.updateVariant({
      auth,
      variantId: propsValue.variant,
      productId: propsValue.product,
      input: {
        sku: propsValue.sku ?? undefined,
        barcode: propsValue.barcode ?? undefined,
        price: propsValue.price ?? undefined,
        salePrice: propsValue.sale_price ?? undefined,
        costPrice: propsValue.cost_price ?? undefined,
        stockQuantity: propsValue.stock_quantity ?? undefined,
        weight: propsValue.weight ?? undefined,
        mpn: propsValue.mpn ?? undefined,
        gtin: propsValue.gtin ?? undefined,
        notifyLow: propsValue.notify_low ?? undefined,
        branchQuantities: branchQuantities({
          branch: propsValue.branch,
          reason: propsValue.reason,
          quantity: propsValue.stock_quantity,
        }),
      },
    });
  },
});

function branchQuantities({
  branch,
  reason,
  quantity,
}: {
  branch: string | undefined | null;
  reason: string | undefined | null;
  quantity: number | undefined | null;
}): BranchQuantityInput[] | undefined {
  const branchId = filled(branch);
  const reasonId = filled(reason);
  if (branchId === undefined) {
    if (reasonId !== undefined) {
      throw new Error('Reason is saved with a branch stock change. Pick a Branch and fill Stock Quantity, or clear Reason.');
    }
    return undefined;
  }
  if (quantity === undefined || quantity === null) {
    throw new Error('Fill Stock Quantity to set the stock of the picked branch, or clear Branch.');
  }
  return [{ branchId, quantity, reasonId }];
}

function filled(value: string | undefined | null): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : undefined;
}
