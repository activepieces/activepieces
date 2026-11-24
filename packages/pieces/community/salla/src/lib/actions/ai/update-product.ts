import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaUtils } from '../../common/helpers';
import { sallaOutputSchemas } from '../../common/output-schemas';
import { PRODUCT_STATUSES, ProductLookup, ProductStatus, sallaProducts, WEIGHT_TYPES, WeightType } from '../../common/products';

const UNCHANGED_YES_NO = [
  { label: 'Leave unchanged', value: 'unchanged' },
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

const STATUS_OPTIONS = [
  { label: 'On Sale', value: 'sale' },
  { label: 'Out of Stock', value: 'out' },
  { label: 'Hidden', value: 'hidden' },
];

const WEIGHT_OPTIONS = WEIGHT_TYPES.map((type) => ({ label: type, value: type }));

export const aiUpdateProductAction = createAction({
  auth: sallaAuth,
  name: 'ai_update_product',
  classification: 'WRITE',
  displayName: 'Update Product',
  description: 'Changes the details of an existing product, found by ID or SKU. Use Add Product Image to add an image.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes an existing Salla product found by product_id or product_sku; only the fields you fill are sent and the rest stay as they are. For a price-only change by SKU use Update Product Price, for status only use Change Product Status, for stock counts use Adjust Stock and to add an image use Add Product Image. The product type cannot be changed.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.product,
  props: {
    product_id: Property.Number({
      displayName: 'Product ID',
      description: 'Numeric Salla product ID, for example 1672932878. Find it with List Products. Fill this or product_sku; product_id wins when both are set.',
      required: false,
    }),
    product_sku: Property.ShortText({
      displayName: 'Find by SKU',
      description: 'Current SKU of the product to update, for example TSHIRT-RED-M. Used only when product_id is empty. To change the SKU itself, use new_sku.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New product name, for example Cotton T-Shirt.',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'New regular price in the store currency, 0 or more, for example 99.5.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'sale (on sale), out (out of stock) or hidden. Leave empty to keep the current status.',
      required: false,
      options: { disabled: false, options: STATUS_OPTIONS },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description, plain text or HTML, for example <p>Soft cotton, regular fit.</p>. Replaces the current description.',
      required: false,
    }),
    sale_price: Property.Number({
      displayName: 'Sale Price',
      description: 'Discounted price, lower than price, for example 79.',
      required: false,
    }),
    sale_start: Property.ShortText({
      displayName: 'Sale Start Date',
      description: 'First day of the sale price, format YYYY-MM-DD, for example 2026-12-01.',
      required: false,
    }),
    sale_end: Property.ShortText({
      displayName: 'Sale End Date',
      description: 'Last day of the sale price, format YYYY-MM-DD, for example 2026-12-31.',
      required: false,
    }),
    cost_price: Property.Number({
      displayName: 'Cost Price',
      description: 'What the product costs the merchant, for reports only, for example 40.',
      required: false,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'New stock count, a whole number, for example 25. Overwrites the count; to add or remove units use Adjust Stock. Ignored when unlimited_quantity is yes.',
      required: false,
    }),
    unlimited_quantity: Property.StaticDropdown({
      displayName: 'Unlimited Quantity',
      description: 'yes stops counting stock, no tracks quantity, unchanged sends nothing. Default unchanged.',
      required: false,
      defaultValue: 'unchanged',
      options: { disabled: false, options: UNCHANGED_YES_NO },
    }),
    new_sku: Property.ShortText({
      displayName: 'New SKU',
      description: 'New unique stock code for the product, for example TSHIRT-RED-M-2026.',
      required: false,
    }),
    mpn: Property.ShortText({
      displayName: 'MPN',
      description: 'Manufacturer part number, for example MPN-44521.',
      required: false,
    }),
    gtin: Property.ShortText({
      displayName: 'GTIN',
      description: 'Global trade item number or barcode, for example 6281000000012.',
      required: false,
    }),
    weight: Property.Number({
      displayName: 'Weight',
      description: 'Shipping weight in weight_type units, for example 0.5.',
      required: false,
    }),
    weight_type: Property.StaticDropdown({
      displayName: 'Weight Unit',
      description: `Unit of weight, one of: ${WEIGHT_TYPES.join(', ')}, for example kg. Leave empty to keep it.`,
      required: false,
      options: { disabled: false, options: WEIGHT_OPTIONS },
    }),
    require_shipping: Property.StaticDropdown({
      displayName: 'Requires Shipping',
      description: 'yes when the product must be shipped, no when it is not, unchanged sends nothing. Default unchanged.',
      required: false,
      defaultValue: 'unchanged',
      options: { disabled: false, options: UNCHANGED_YES_NO },
    }),
    category_ids: Property.Array({
      displayName: 'Category IDs',
      description: 'Numeric category IDs from List Categories, for example ["1340423950"]. Replaces the product\'s categories. Leave empty to keep them.',
      required: false,
    }),
    brand_id: Property.Number({
      displayName: 'Brand ID',
      description: 'Numeric brand ID from List Brands, for example 1473353380.',
      required: false,
    }),
    maximum_quantity_per_order: Property.Number({
      displayName: 'Maximum Quantity per Order',
      description: 'Most units one customer can buy in one order, a whole number, for example 3.',
      required: false,
    }),
    hide_quantity: Property.StaticDropdown({
      displayName: 'Hide Quantity',
      description: 'yes hides the stock count from customers, no shows it, unchanged sends nothing. Default unchanged.',
      required: false,
      defaultValue: 'unchanged',
      options: { disabled: false, options: UNCHANGED_YES_NO },
    }),
    enable_upload_image: Property.StaticDropdown({
      displayName: 'Customer Can Upload Image',
      description: 'yes lets customers attach an image to their order of this product, no does not, unchanged sends nothing. Default unchanged.',
      required: false,
      defaultValue: 'unchanged',
      options: { disabled: false, options: UNCHANGED_YES_NO },
    }),
    enable_note: Property.StaticDropdown({
      displayName: 'Customer Can Add Note',
      description: 'yes lets customers write a note for this product, no does not, unchanged sends nothing. Default unchanged.',
      required: false,
      defaultValue: 'unchanged',
      options: { disabled: false, options: UNCHANGED_YES_NO },
    }),
    subtitle: Property.ShortText({
      displayName: 'Subtitle',
      description: 'Short line shown under the name, for example 100% cotton.',
      required: false,
    }),
    promotion_title: Property.ShortText({
      displayName: 'Promotion Title',
      description: 'Badge text on the product card, for example New.',
      required: false,
    }),
    promotion_subtitle: Property.ShortText({
      displayName: 'Promotion Subtitle',
      description: 'Promotion text on the product page, for example Free shipping over 200 SAR.',
      required: false,
    }),
    metadata_title: Property.ShortText({
      displayName: 'SEO Title',
      description: 'Page title for search engines, for example Cotton T-Shirt | My Store.',
      required: false,
    }),
    metadata_description: Property.ShortText({
      displayName: 'SEO Description',
      description: 'Page description for search engines, for example Soft cotton T-shirt in 5 colours.',
      required: false,
    }),
    metadata_url: Property.ShortText({
      displayName: 'SEO URL Slug',
      description: 'Custom URL slug for the product page, for example cotton-t-shirt.',
      required: false,
    }),
    calories: Property.Number({
      displayName: 'Calories',
      description: 'Calories for food products, for example 250.',
      required: false,
    }),
  },
  async run({ auth, propsValue, store }) {
    const target = resolveTarget({ productId: propsValue.product_id, productSku: propsValue.product_sku });
    return sallaProducts.updateProduct({
      auth,
      store,
      by: target.by,
      value: target.value,
      input: {
        name: propsValue.name,
        price: propsValue.price ?? undefined,
        status: toStatus(propsValue.status),
        description: propsValue.description,
        salePrice: propsValue.sale_price ?? undefined,
        saleStart: propsValue.sale_start,
        saleEnd: propsValue.sale_end,
        costPrice: propsValue.cost_price ?? undefined,
        quantity: propsValue.quantity ?? undefined,
        unlimitedQuantity: sallaUtils.triState(propsValue.unlimited_quantity),
        sku: propsValue.new_sku,
        mpn: propsValue.mpn,
        gtin: propsValue.gtin,
        weight: propsValue.weight ?? undefined,
        weightType: toWeightType(propsValue.weight_type),
        requireShipping: sallaUtils.triState(propsValue.require_shipping),
        categoryIds: sallaUtils.toStringList(propsValue.category_ids),
        brandId: propsValue.brand_id ?? undefined,
        maximumQuantityPerOrder: propsValue.maximum_quantity_per_order ?? undefined,
        hideQuantity: sallaUtils.triState(propsValue.hide_quantity),
        enableUploadImage: sallaUtils.triState(propsValue.enable_upload_image),
        enableNote: sallaUtils.triState(propsValue.enable_note),
        subtitle: propsValue.subtitle,
        promotionTitle: propsValue.promotion_title,
        promotionSubtitle: propsValue.promotion_subtitle,
        metadataTitle: propsValue.metadata_title,
        metadataDescription: propsValue.metadata_description,
        metadataUrl: propsValue.metadata_url,
        calories: propsValue.calories ?? undefined,
      },
    });
  },
});

function resolveTarget({ productId, productSku }: { productId: number | undefined | null; productSku: string | undefined }): {
  by: ProductLookup;
  value: string | number;
} {
  if (productId !== undefined && productId !== null) {
    return { by: 'id', value: productId };
  }
  const sku = productSku?.trim();
  if (sku) {
    return { by: 'sku', value: sku };
  }
  throw new Error('Give product_id (for example 1672932878) or product_sku (for example TSHIRT-RED-M) to say which product to update.');
}

function toStatus(value: unknown): ProductStatus | undefined {
  if (isBlank(value)) {
    return undefined;
  }
  const match = PRODUCT_STATUSES.find((status) => status === value);
  if (!match) {
    throw new Error(`status must be sale, out or hidden. Got "${String(value)}".`);
  }
  return match;
}

function toWeightType(value: unknown): WeightType | undefined {
  if (isBlank(value)) {
    return undefined;
  }
  const match = WEIGHT_TYPES.find((type) => type === value);
  if (!match) {
    throw new Error(`weight_type must be one of: ${WEIGHT_TYPES.join(', ')}. Got "${String(value)}".`);
  }
  return match;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}
