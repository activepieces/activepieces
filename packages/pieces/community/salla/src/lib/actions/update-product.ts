import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaUtils } from '../common/helpers';
import { sallaOutputSchemas } from '../common/output-schemas';
import { ProductLookup, ProductStatus, WeightType, sallaProducts } from '../common/products';
import { sallaProps } from '../common/props';
import { productStatusOptions, weightUnitOptions } from './create-product';

export const updateProductAction = createAction({
  auth: sallaAuth,
  name: 'update_product',
  classification: 'WRITE',
  displayName: 'Update Product',
  description: 'Changes the details, prices or stock of a product, found by product or SKU. Use Add Product Image to add an image.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates one Salla product, found by numeric product ID or by SKU, and changes only the fields you fill. Use Update Product Price for a quick price change by SKU, Change Product Status for the status alone, Adjust Stock to add or remove units, and Add Product Image to add an image. Sending the same values again gives the same result, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.product,
  propertyGroups: [
    {
      key: 'target',
      display: 'section',
      label: 'Product to Update',
      description: 'Pick the product, or switch Find By to SKU and type its SKU.',
      icon: 'filter',
      props: ['find_by', 'product', 'lookup_sku'],
    },
    {
      key: 'basics',
      display: 'section',
      label: 'Basics',
      description: 'Fill only what changes. The product type cannot be changed.',
      icon: 'file',
      props: ['name', 'description', 'status', 'categories', 'brand'],
    },
    {
      key: 'pricing',
      display: 'section',
      label: 'Pricing',
      icon: 'tag',
      props: ['price', 'sale_price', 'cost_price', 'sale_start', 'sale_end'],
    },
    {
      key: 'inventory',
      display: 'section',
      label: 'Inventory',
      icon: 'inbox',
      props: ['sku', 'quantity', 'unlimited_quantity', 'weight', 'weight_type', 'require_shipping'],
    },
  ],
  props: {
    find_by: Property.StaticDropdown<ProductLookup, true>({
      displayName: 'Find By',
      description: 'How to find the product: pick it from the list (Product) or by its SKU, for example TSHIRT-RED-M.',
      display: 'cards',
      required: true,
      defaultValue: 'id',
      options: {
        options: [
          { label: 'Product', value: 'id', description: 'Pick the product from the list.' },
          { label: 'SKU', value: 'sku', description: 'Type or map the product SKU.' },
        ],
      },
    }),
    product: sallaProps.product({
      required: false,
      description: 'The product to update. Needed when Find By is Product. In a flow, map the numeric product ID, for example 1672932878.',
    }),
    lookup_sku: Property.ShortText({
      displayName: 'Product SKU',
      description: 'SKU of the product to update, for example TSHIRT-RED-M. Needed when Find By is SKU.',
      placeholder: 'TSHIRT-RED-M',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New product name, for example "Cotton T-Shirt". Leave empty to keep it.',
      placeholder: 'Cotton T-Shirt',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New product description. HTML is allowed, for example "<p>100% cotton, machine washable.</p>". Leave empty to keep it.',
      required: false,
    }),
    status: Property.StaticDropdown<ProductStatus, false>({
      displayName: 'Status',
      description: 'On Sale, Out of Stock or Hidden. Leave empty to keep it.',
      required: false,
      options: { options: productStatusOptions() },
    }),
    categories: sallaProps.categories({
      required: false,
      description: 'Categories to list the product in, for example Clothes > Shirts. Replaces the current categories. Leave empty to keep them.',
    }),
    brand: sallaProps.brand({
      required: false,
      description: 'New brand of the product. In a flow, map the numeric brand ID, for example 1473353380. Leave empty to keep it.',
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'New regular price in the store currency, for example 99.5. Leave empty to keep it.',
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
      description: 'What the product costs you, for reports only, for example 40. Leave empty to keep it.',
      placeholder: '40',
      width: 'half',
      required: false,
    }),
    sale_start: Property.DateTime({
      displayName: 'Sale Starts',
      description: 'First day of the sale price, in store time (Asia/Riyadh), for example 2026-11-20. Leave empty to keep it.',
      width: 'half',
      required: false,
    }),
    sale_end: Property.DateTime({
      displayName: 'Sale Ends',
      description: 'Last day of the sale price, in store time (Asia/Riyadh), for example 2026-11-30. Leave empty to keep it.',
      width: 'half',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'New SKU',
      description: 'Give the product a new SKU, for example TSHIRT-RED-M. Leave empty to keep the current one.',
      placeholder: 'TSHIRT-RED-M',
      width: 'half',
      required: false,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Set the units in stock to this whole number, for example 25. Use Adjust Stock to add or remove units instead. Leave empty to keep it.',
      placeholder: '25',
      width: 'half',
      required: false,
    }),
    unlimited_quantity: sallaProps.triState({
      displayName: 'Unlimited Quantity',
      description: 'Yes makes the product never run out of stock; No goes back to a counted quantity.',
    }),
    weight: Property.Number({
      displayName: 'Weight',
      description: 'New shipping weight in the unit picked next to it, for example 0.4. Leave empty to keep it.',
      placeholder: '0.4',
      width: 'half',
      required: false,
    }),
    weight_type: Property.StaticDropdown<WeightType, false>({
      displayName: 'Weight Unit',
      description: 'Unit of the weight, for example Kilograms (kg). Leave empty to keep it.',
      width: 'half',
      required: false,
      options: { options: weightUnitOptions() },
    }),
    require_shipping: sallaProps.triState({
      displayName: 'Requires Shipping',
      description: 'Whether the product has to be shipped. No suits services and digital products.',
    }),
    mpn: Property.ShortText({
      displayName: 'MPN',
      description: 'New manufacturer part number, for example MPN-44521. Leave empty to keep it.',
      placeholder: 'MPN-44521',
      advanced: true,
      required: false,
    }),
    gtin: Property.ShortText({
      displayName: 'GTIN (Barcode)',
      description: 'New global trade item number, 8 to 14 digits, for example 6281234567890. Leave empty to keep it.',
      placeholder: '6281234567890',
      advanced: true,
      required: false,
    }),
    maximum_quantity_per_order: Property.Number({
      displayName: 'Maximum Quantity per Order',
      description: 'Most units one customer can buy in one order, a whole number such as 3. Leave empty to keep it.',
      placeholder: '3',
      advanced: true,
      required: false,
    }),
    hide_quantity: {
      ...sallaProps.triState({
        displayName: 'Hide Quantity',
        description: 'Hide the remaining stock count from customers.',
      }),
      advanced: true,
    },
    enable_upload_image: {
      ...sallaProps.triState({
        displayName: 'Let Customers Upload an Image',
        description: 'Ask the customer for an image when ordering, for example a photo to print.',
      }),
      advanced: true,
    },
    enable_note: {
      ...sallaProps.triState({
        displayName: 'Let Customers Add a Note',
        description: 'Let the customer write a note on this product when ordering.',
      }),
      advanced: true,
    },
    subtitle: Property.ShortText({
      displayName: 'Subtitle',
      description: 'Short line shown under the product name, for example "Soft summer cotton". Leave empty to keep it.',
      advanced: true,
      required: false,
    }),
    promotion_title: Property.ShortText({
      displayName: 'Promotion Title',
      description: 'Badge text shown on the product card, for example "New". Leave empty to keep it.',
      advanced: true,
      required: false,
    }),
    promotion_subtitle: Property.ShortText({
      displayName: 'Promotion Subtitle',
      description: 'Promotion line shown on the product page, for example "Free shipping this week". Leave empty to keep it.',
      advanced: true,
      required: false,
    }),
    metadata_title: Property.ShortText({
      displayName: 'SEO Title',
      description: 'Page title for search engines, for example "Cotton T-Shirt | My Store". Leave empty to keep it.',
      advanced: true,
      required: false,
    }),
    metadata_description: Property.LongText({
      displayName: 'SEO Description',
      description: 'Page description for search engines, for example "Soft 100% cotton T-shirt in five colors." Leave empty to keep it.',
      advanced: true,
      required: false,
    }),
    metadata_url: Property.ShortText({
      displayName: 'SEO URL Slug',
      description: 'Custom end of the product link, lowercase words joined by dashes, for example cotton-t-shirt. Leave empty to keep it.',
      placeholder: 'cotton-t-shirt',
      advanced: true,
      required: false,
    }),
    calories: Property.Number({
      displayName: 'Calories',
      description: 'Calories per serving for food products, for example 250. Leave empty to keep it.',
      placeholder: '250',
      advanced: true,
      required: false,
    }),
  },
  async run({ auth, propsValue, store }) {
    const by: ProductLookup = propsValue.find_by === 'sku' ? 'sku' : 'id';
    const value = by === 'sku' ? requireText({ value: propsValue.lookup_sku, message: SKU_MISSING }) : requireText({ value: propsValue.product, message: PRODUCT_MISSING });
    return sallaProducts.updateProduct({
      auth,
      store,
      by,
      value,
      input: {
        name: propsValue.name ?? undefined,
        description: propsValue.description ?? undefined,
        status: propsValue.status ?? undefined,
        categoryIds: propsValue.categories ?? [],
        brandId: propsValue.brand ?? undefined,
        price: propsValue.price ?? undefined,
        salePrice: propsValue.sale_price ?? undefined,
        costPrice: propsValue.cost_price ?? undefined,
        saleStart: sallaUtils.wallClockFromDateTimeProp(propsValue.sale_start),
        saleEnd: sallaUtils.wallClockFromDateTimeProp(propsValue.sale_end),
        sku: propsValue.sku ?? undefined,
        quantity: propsValue.quantity ?? undefined,
        unlimitedQuantity: propsValue.unlimited_quantity ?? undefined,
        weight: propsValue.weight ?? undefined,
        weightType: propsValue.weight_type ?? undefined,
        requireShipping: propsValue.require_shipping ?? undefined,
        mpn: propsValue.mpn ?? undefined,
        gtin: propsValue.gtin ?? undefined,
        maximumQuantityPerOrder: propsValue.maximum_quantity_per_order ?? undefined,
        hideQuantity: propsValue.hide_quantity ?? undefined,
        enableUploadImage: propsValue.enable_upload_image ?? undefined,
        enableNote: propsValue.enable_note ?? undefined,
        subtitle: propsValue.subtitle ?? undefined,
        promotionTitle: propsValue.promotion_title ?? undefined,
        promotionSubtitle: propsValue.promotion_subtitle ?? undefined,
        metadataTitle: propsValue.metadata_title ?? undefined,
        metadataDescription: propsValue.metadata_description ?? undefined,
        metadataUrl: propsValue.metadata_url ?? undefined,
        calories: propsValue.calories ?? undefined,
      },
    });
  },
});

function requireText({ value, message }: { value: string | number | undefined | null; message: string }): string {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (text.length === 0) {
    throw new Error(message);
  }
  return text;
}

const PRODUCT_MISSING = 'Pick the product to update, or switch Find By to SKU and give its SKU.';
const SKU_MISSING = 'Give the SKU of the product to update, for example TSHIRT-RED-M, or switch Find By to Product.';
