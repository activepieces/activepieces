import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaUtils } from '../common/helpers';
import { sallaOutputSchemas } from '../common/output-schemas';
import { ProductStatus, ProductType, WeightType, sallaProducts } from '../common/products';
import { sallaProps } from '../common/props';

export const createProductAction = createAction({
  auth: sallaAuth,
  name: 'create_product',
  classification: 'WRITE',
  displayName: 'Create Product',
  description:
    'Creates a product in the store. Salla keeps a new product hidden until it has an image, and shows it as out of stock until it has a quantity.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates one new Salla product with its type, price, stock, categories, brand and image URLs. Use Update Product to change a product that already exists. Each call creates a separate product, so do not retry blindly.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.product,
  propertyGroups: [
    {
      key: 'basics',
      display: 'section',
      label: 'Basics',
      icon: 'file',
      props: ['name', 'product_type', 'description', 'status', 'categories', 'brand'],
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
      description: 'Without a quantity (or Unlimited Quantity) Salla shows the product as out of stock.',
      icon: 'inbox',
      props: ['sku', 'quantity', 'unlimited_quantity', 'weight', 'weight_type', 'require_shipping'],
    },
    {
      key: 'media',
      display: 'section',
      label: 'Media',
      description: 'Salla keeps the product hidden until it has at least one image.',
      icon: 'paperclip',
      props: ['image_urls'],
    },
  ],
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Product name shown in the store, for example "Cotton T-Shirt".',
      placeholder: 'Cotton T-Shirt',
      required: true,
    }),
    product_type: Property.StaticDropdown<ProductType, true>({
      displayName: 'Product Type',
      description: 'What kind of product this is, for example Physical product. Salla does not let you change the type after the product is created.',
      required: true,
      defaultValue: 'product',
      options: { options: productTypeOptions() },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Product description shown on the product page. HTML is allowed, for example "<p>100% cotton, machine washable.</p>".',
      required: false,
    }),
    status: Property.StaticDropdown<ProductStatus, false>({
      displayName: 'Status',
      description: 'On Sale, Out of Stock or Hidden. Leave empty to let Salla decide. On Sale needs at least one image.',
      required: false,
      options: { options: productStatusOptions() },
    }),
    categories: sallaProps.categories({
      required: false,
      description: 'Store categories to list the product in, for example Clothes > Shirts. In a flow, map numeric category IDs such as 1937598462.',
    }),
    brand: sallaProps.brand({
      required: false,
      description: 'Brand of the product. In a flow, map the numeric brand ID, for example 1473353380.',
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'Regular price in the store currency, for example 99.5.',
      placeholder: '99.5',
      width: 'half',
      required: true,
    }),
    sale_price: Property.Number({
      displayName: 'Sale Price',
      description: 'Discounted price in the store currency, lower than the price, for example 79.',
      placeholder: '79',
      width: 'half',
      required: false,
    }),
    cost_price: Property.Number({
      displayName: 'Cost Price',
      description: 'What the product costs you, for reports only, for example 40.',
      placeholder: '40',
      width: 'half',
      required: false,
    }),
    sale_start: Property.DateTime({
      displayName: 'Sale Starts',
      description: 'First day of the sale price, in store time (Asia/Riyadh), for example 2026-11-20. Salla keeps the day only.',
      width: 'half',
      required: false,
    }),
    sale_end: Property.DateTime({
      displayName: 'Sale Ends',
      description: 'Last day of the sale price, in store time (Asia/Riyadh), for example 2026-11-30. Salla keeps the day only.',
      width: 'half',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Your stock code for the product, unique in the store, for example TSHIRT-RED-M.',
      placeholder: 'TSHIRT-RED-M',
      width: 'half',
      required: false,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Units in stock, a whole number such as 25. Ignored when Unlimited Quantity is on.',
      placeholder: '25',
      width: 'half',
      required: false,
    }),
    unlimited_quantity: Property.Checkbox({
      displayName: 'Unlimited Quantity',
      description: 'Never run out of stock, for services or made-to-order products.',
      required: false,
      defaultValue: false,
    }),
    weight: Property.Number({
      displayName: 'Weight',
      description: 'Shipping weight in the unit picked next to it, for example 0.4.',
      placeholder: '0.4',
      width: 'half',
      required: false,
    }),
    weight_type: Property.StaticDropdown<WeightType, false>({
      displayName: 'Weight Unit',
      description: 'Unit of the weight, for example Kilograms (kg).',
      width: 'half',
      required: false,
      options: { options: weightUnitOptions() },
    }),
    require_shipping: sallaProps.triState({
      displayName: 'Requires Shipping',
      description: 'Whether the product has to be shipped. Choose No for services and digital products.',
      unchangedLabel: 'Salla default',
    }),
    image_urls: Property.Array({
      displayName: 'Image URLs',
      description: 'Public image links that start with https://, one per row, up to 10 images, for example https://cdn.example.com/shirt-front.jpg. The first one becomes the main image.',
      required: false,
    }),
    mpn: Property.ShortText({
      displayName: 'MPN',
      description: 'Manufacturer part number, for example MPN-44521.',
      placeholder: 'MPN-44521',
      advanced: true,
      required: false,
    }),
    gtin: Property.ShortText({
      displayName: 'GTIN (Barcode)',
      description: 'Global trade item number from the barcode, 8 to 14 digits, for example 6281234567890.',
      placeholder: '6281234567890',
      advanced: true,
      required: false,
    }),
    maximum_quantity_per_order: Property.Number({
      displayName: 'Maximum Quantity per Order',
      description: 'Most units one customer can buy in one order, a whole number such as 3.',
      placeholder: '3',
      advanced: true,
      required: false,
    }),
    hide_quantity: Property.Checkbox({
      displayName: 'Hide Quantity',
      description: 'Hide the remaining stock count from customers.',
      advanced: true,
      required: false,
      defaultValue: false,
    }),
    enable_upload_image: Property.Checkbox({
      displayName: 'Let Customers Upload an Image',
      description: 'Ask the customer for an image when ordering, for example a photo to print.',
      advanced: true,
      required: false,
      defaultValue: false,
    }),
    enable_note: Property.Checkbox({
      displayName: 'Let Customers Add a Note',
      description: 'Let the customer write a note on this product when ordering.',
      advanced: true,
      required: false,
      defaultValue: false,
    }),
    subtitle: Property.ShortText({
      displayName: 'Subtitle',
      description: 'Short line shown under the product name, for example "Soft summer cotton".',
      advanced: true,
      required: false,
    }),
    promotion_title: Property.ShortText({
      displayName: 'Promotion Title',
      description: 'Badge text shown on the product card, for example "New".',
      advanced: true,
      required: false,
    }),
    promotion_subtitle: Property.ShortText({
      displayName: 'Promotion Subtitle',
      description: 'Promotion line shown on the product page, for example "Free shipping this week".',
      advanced: true,
      required: false,
    }),
    metadata_title: Property.ShortText({
      displayName: 'SEO Title',
      description: 'Page title for search engines, for example "Cotton T-Shirt | My Store".',
      advanced: true,
      required: false,
    }),
    metadata_description: Property.LongText({
      displayName: 'SEO Description',
      description: 'Page description for search engines, one or two sentences, for example "Soft 100% cotton T-shirt in five colors."',
      advanced: true,
      required: false,
    }),
    metadata_url: Property.ShortText({
      displayName: 'SEO URL Slug',
      description: 'Custom end of the product link, lowercase words joined by dashes, for example cotton-t-shirt.',
      placeholder: 'cotton-t-shirt',
      advanced: true,
      required: false,
    }),
    calories: Property.Number({
      displayName: 'Calories',
      description: 'Calories per serving for food products, for example 250.',
      placeholder: '250',
      advanced: true,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaProducts.createProduct({
      auth,
      input: {
        name: propsValue.name,
        productType: propsValue.product_type,
        price: propsValue.price,
        description: propsValue.description ?? undefined,
        status: propsValue.status ?? undefined,
        categoryIds: propsValue.categories ?? [],
        brandId: propsValue.brand ?? undefined,
        salePrice: propsValue.sale_price ?? undefined,
        costPrice: propsValue.cost_price ?? undefined,
        saleStart: sallaUtils.wallClockFromDateTimeProp(propsValue.sale_start),
        saleEnd: sallaUtils.wallClockFromDateTimeProp(propsValue.sale_end),
        sku: propsValue.sku ?? undefined,
        quantity: propsValue.quantity ?? undefined,
        unlimitedQuantity: onlyWhenTicked(propsValue.unlimited_quantity),
        weight: propsValue.weight ?? undefined,
        weightType: propsValue.weight_type ?? undefined,
        requireShipping: propsValue.require_shipping ?? undefined,
        imageUrls: sallaUtils.toStringList(propsValue.image_urls),
        mpn: propsValue.mpn ?? undefined,
        gtin: propsValue.gtin ?? undefined,
        maximumQuantityPerOrder: propsValue.maximum_quantity_per_order ?? undefined,
        hideQuantity: onlyWhenTicked(propsValue.hide_quantity),
        enableUploadImage: onlyWhenTicked(propsValue.enable_upload_image),
        enableNote: onlyWhenTicked(propsValue.enable_note),
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

export function productStatusOptions(): Array<{ label: string; value: ProductStatus; description: string }> {
  return [
    { label: 'On Sale', value: 'sale', description: 'Customers can see and buy it.' },
    { label: 'Out of Stock', value: 'out', description: 'Customers can see it but cannot buy it.' },
    { label: 'Hidden', value: 'hidden', description: 'Customers cannot see it.' },
  ];
}

export function weightUnitOptions(): Array<{ label: string; value: WeightType }> {
  return [
    { label: 'Kilograms (kg)', value: 'kg' },
    { label: 'Grams (g)', value: 'g' },
    { label: 'Pounds (lb)', value: 'lb' },
    { label: 'Ounces (oz)', value: 'oz' },
  ];
}

function productTypeOptions(): Array<{ label: string; value: ProductType; description: string }> {
  return [
    { label: 'Physical product', value: 'product', description: 'A product you ship or hand over.' },
    { label: 'Service', value: 'service', description: 'Work you do for the customer, no shipping.' },
    { label: 'Product group', value: 'group_products', description: 'A bundle of other products sold together.' },
    { label: 'Digital codes', value: 'codes', description: 'Codes or cards sent to the customer, such as gift cards.' },
    { label: 'Digital file', value: 'digital', description: 'A file the customer downloads, such as an e-book.' },
    { label: 'Food', value: 'food', description: 'Food or drinks, with calories.' },
    { label: 'Booking', value: 'booking', description: 'An appointment or reservation.' },
    { label: 'Donation', value: 'donating', description: 'A donation the customer pays.' },
  ];
}

function onlyWhenTicked(value: boolean | undefined | null): true | undefined {
  return value === true ? true : undefined;
}
