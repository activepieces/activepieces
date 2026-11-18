import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaApi } from '../../common/client';
import { sallaUtils } from '../../common/helpers';
import { sallaOutputSchemas } from '../../common/output-schemas';
import { BranchQuantityInput, sallaProducts } from '../../common/products';

export const aiUpdateVariantAction = createAction({
  auth: sallaAuth,
  name: 'ai_update_variant',
  classification: 'WRITE',
  displayName: 'Update Variant',
  description: 'Changes the SKU, prices, stock or codes of one product variant.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one Salla product variant (for example the Red / M option of a T-shirt): SKU, barcode, prices, stock count, weight, MPN, GTIN or low stock threshold; only the fields you fill are sent. Find the variant_id in the skus list that Get Product returns. Use Update Product for product-level fields and Adjust Stock to add or remove units instead of setting an exact count.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.variant,
  props: {
    variant_id: Property.Number({
      displayName: 'Variant ID',
      description: 'Numeric variant ID, the id of an entry in the skus list of Get Product, for example 1395346624.',
      required: true,
    }),
    product_id: Property.Number({
      displayName: 'Product ID',
      description: 'Numeric product ID the variant belongs to, for example 1672932878; optional, only fills product_id in the output.',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'New SKU for the variant, for example TSHIRT-RED-M.',
      required: false,
    }),
    barcode: Property.ShortText({
      displayName: 'Barcode',
      description: 'New barcode, for example 6281000000029.',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'New variant price in the store currency, 0 or more, for example 109.',
      required: false,
    }),
    sale_price: Property.Number({
      displayName: 'Sale Price',
      description: 'Discounted variant price, lower than price, for example 90.5.',
      required: false,
    }),
    cost_price: Property.Number({
      displayName: 'Cost Price',
      description: 'What the variant costs the merchant, for reports only, for example 45.',
      required: false,
    }),
    stock_quantity: Property.Number({
      displayName: 'Stock Quantity',
      description: 'New total stock count, a whole number, for example 12. Ignored when branch_quantities is filled.',
      required: false,
    }),
    weight: Property.Number({
      displayName: 'Weight',
      description: 'Variant shipping weight in the product weight unit, for example 0.5.',
      required: false,
    }),
    mpn: Property.ShortText({
      displayName: 'MPN',
      description: 'Manufacturer part number, for example MPN-44521-RM.',
      required: false,
    }),
    gtin: Property.ShortText({
      displayName: 'GTIN',
      description: 'Global trade item number, for example 6281000000029.',
      required: false,
    }),
    notify_low: Property.Number({
      displayName: 'Low Stock Threshold',
      description: 'Salla alerts the merchant when stock falls to this whole number, for example 3.',
      required: false,
    }),
    branch_quantities: Property.Array({
      displayName: 'Branch Quantities',
      description:
        'Stock per branch, for example [{"branch_id":999858679,"quantity":10},{"branch_id":1218712637,"quantity":4,"reason_id":1473353380}]. Sets each listed branch to exactly quantity. Branch IDs come from List Branches. Leave empty to keep branch stock as is.',
      required: false,
      properties: {
        branch_id: Property.Number({
          displayName: 'Branch ID',
          description: 'Numeric branch ID from List Branches, for example 999858679.',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'Stock count for this branch, a whole number, for example 10.',
          required: true,
        }),
        reason_id: Property.Number({
          displayName: 'Reason ID',
          description: 'Numeric Salla stock change reason ID, for example 1473353380, from List Stock Change Reasons. Optional.',
          required: false,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    return sallaProducts.updateVariant({
      auth,
      variantId: propsValue.variant_id,
      productId: propsValue.product_id,
      input: {
        sku: propsValue.sku,
        barcode: propsValue.barcode,
        price: propsValue.price ?? undefined,
        salePrice: propsValue.sale_price ?? undefined,
        costPrice: propsValue.cost_price ?? undefined,
        stockQuantity: propsValue.stock_quantity ?? undefined,
        weight: propsValue.weight ?? undefined,
        mpn: propsValue.mpn,
        gtin: propsValue.gtin,
        notifyLow: propsValue.notify_low ?? undefined,
        branchQuantities: toBranchQuantities(propsValue.branch_quantities),
      },
    });
  },
});

function toBranchQuantities(value: unknown): BranchQuantityInput[] {
  const entries = sallaUtils.toRecordList({ value, label: 'branch_quantities' });
  return entries.map((entry, index) => {
    if (!sallaApi.isRecord(entry)) {
      throw new Error(`Branch quantity ${index + 1} must be an object such as {"branch_id":999858679,"quantity":10}.`);
    }
    return {
      branchId: toScalar(entry['branch_id']) ?? '',
      quantity: toScalar(entry['quantity']) ?? '',
      reasonId: toScalar(entry['reason_id']),
    };
  });
}

function toScalar(value: unknown): string | number | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}
