import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaUtils } from '../../common/helpers';
import { sallaOutputSchemas } from '../../common/output-schemas';
import { PRODUCT_STATUSES, PRODUCT_TYPES, ProductStatus, ProductType, sallaProducts, WEIGHT_TYPES, WeightType } from '../../common/products';

const DEFAULT_YES_NO = [
  { label: 'Salla default', value: 'default' },
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

const STATUS_OPTIONS = [
  { label: 'On Sale', value: 'sale' },
  { label: 'Out of Stock', value: 'out' },
  { label: 'Hidden', value: 'hidden' },
];

const WEIGHT_OPTIONS = WEIGHT_TYPES.map((type) => ({ label: type, value: type }));

export const aiCreateProductAction = createAction({
  auth: sallaAuth,
  name: 'ai_create_product',
  classification: 'WRITE',
  displayName: 'Create Product',
  description: 'Creates a new product in the store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Salla product from a name, product_type and price, with optional pricing, stock, shipping, category, brand, image URL and SEO fields. Use Update Product to change an existing product and Add Product Image to add one image; get category_ids from List Categories and brand_id from List Brands. Each call creates a separate product, so a retry creates a duplicate.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.product,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Product name shown in the store, for example Cotton T-Shirt.',
      required: true,
    }),
    product_type: Property.StaticDropdown({
      displayName: 'Product Type',
      description: `One of: ${PRODUCT_TYPES.join(', ')}. Use product for a physical item that ships, for example product. It cannot be changed after the product is created.`,
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Physical Product', value: 'product' },
          { label: 'Service', value: 'service' },
          { label: 'Group of Products', value: 'group_products' },
          { label: 'Digital Codes', value: 'codes' },
          { label: 'Digital File', value: 'digital' },
          { label: 'Food', value: 'food' },
          { label: 'Booking', value: 'booking' },
          { label: 'Donation', value: 'donating' },
        ],
      },
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'Regular price in the store currency, 0 or more, for example 99.5.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'sale (on sale), out (out of stock) or hidden. Leave empty for the Salla default. sale needs at least one image in image_urls.',
      required: false,
      options: { disabled: false, options: STATUS_OPTIONS },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Product description, plain text or HTML, for example <p>Soft cotton, regular fit.</p>.',
      required: false,
    }),
    sale_price: Property.Number({
      displayName: 'Sale Price',
      description: 'Discounted price, lower than price, for example 79. Leave empty for no sale.',
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
      description: 'Units in stock, a whole number, for example 25. Ignored when unlimited_quantity is yes.',
      required: false,
    }),
    unlimited_quantity: Property.StaticDropdown({
      displayName: 'Unlimited Quantity',
      description: 'yes means stock is never counted, no means quantity is tracked, default keeps the Salla default. Default default.',
      required: false,
      defaultValue: 'default',
      options: { disabled: false, options: DEFAULT_YES_NO },
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Unique stock code for the product, for example TSHIRT-RED-M.',
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
      description: `Unit of weight, one of: ${WEIGHT_TYPES.join(', ')}, for example kg.`,
      required: false,
      options: { disabled: false, options: WEIGHT_OPTIONS },
    }),
    require_shipping: Property.StaticDropdown({
      displayName: 'Requires Shipping',
      description: 'yes when the product must be shipped, no when it is not (services, digital), default keeps the Salla default. Default default.',
      required: false,
      defaultValue: 'default',
      options: { disabled: false, options: DEFAULT_YES_NO },
    }),
    category_ids: Property.Array({
      displayName: 'Category IDs',
      description: 'Numeric category IDs from List Categories, for example ["1340423950", "752848962"]. Leave empty for no category.',
      required: false,
    }),
    brand_id: Property.Number({
      displayName: 'Brand ID',
      description: 'Numeric brand ID from List Brands, for example 1473353380.',
      required: false,
    }),
    image_urls: Property.Array({
      displayName: 'Image URLs',
      description: 'Public image links starting with https://, up to 10 images, for example ["https://cdn.example.com/shirt-front.jpg"]. The first one becomes the main image.',
      required: false,
    }),
    maximum_quantity_per_order: Property.Number({
      displayName: 'Maximum Quantity per Order',
      description: 'Most units one customer can buy in one order, a whole number, for example 3.',
      required: false,
    }),
    hide_quantity: Property.StaticDropdown({
      displayName: 'Hide Quantity',
      description: 'yes hides the stock count from customers, no shows it, default keeps the Salla default. Default default.',
      required: false,
      defaultValue: 'default',
      options: { disabled: false, options: DEFAULT_YES_NO },
    }),
    enable_upload_image: Property.StaticDropdown({
      displayName: 'Customer Can Upload Image',
      description: 'yes lets customers attach an image to their order of this product, no does not, default keeps the Salla default. Default default.',
      required: false,
      defaultValue: 'default',
      options: { disabled: false, options: DEFAULT_YES_NO },
    }),
    enable_note: Property.StaticDropdown({
      displayName: 'Customer Can Add Note',
      description: 'yes lets customers write a note for this product, no does not, default keeps the Salla default. Default default.',
      required: false,
      defaultValue: 'default',
      options: { disabled: false, options: DEFAULT_YES_NO },
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
  async run({ auth, propsValue }) {
    return sallaProducts.createProduct({
      auth,
      input: {
        name: propsValue.name,
        productType: toProductType(propsValue.product_type),
        price: propsValue.price,
        status: toStatus(propsValue.status),
        description: propsValue.description,
        salePrice: propsValue.sale_price ?? undefined,
        saleStart: propsValue.sale_start,
        saleEnd: propsValue.sale_end,
        costPrice: propsValue.cost_price ?? undefined,
        quantity: propsValue.quantity ?? undefined,
        unlimitedQuantity: sallaUtils.triState(propsValue.unlimited_quantity),
        sku: propsValue.sku,
        mpn: propsValue.mpn,
        gtin: propsValue.gtin,
        weight: propsValue.weight ?? undefined,
        weightType: toWeightType(propsValue.weight_type),
        requireShipping: sallaUtils.triState(propsValue.require_shipping),
        categoryIds: sallaUtils.toStringList(propsValue.category_ids),
        brandId: propsValue.brand_id ?? undefined,
        imageUrls: sallaUtils.toStringList(propsValue.image_urls),
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

function toProductType(value: unknown): ProductType {
  const match = PRODUCT_TYPES.find((type) => type === value);
  if (!match) {
    throw new Error(`product_type must be one of: ${PRODUCT_TYPES.join(', ')}. Got "${String(value ?? '')}".`);
  }
  return match;
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
