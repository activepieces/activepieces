import { createAction, Property } from '@activepieces/pieces-framework';
import { bigCommerceAuth } from '../..';
import { sendBigCommerceRequest, BigCommerceAuth, bigCommerceCommon } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const createProduct = createAction({
  auth: bigCommerceAuth,
  name: 'create_product',
  displayName: 'Create Product',
  description: 'Create a new product in BigCommerce',
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'The name of the product (1-250 characters)',
      required: true,
    }),
    type: bigCommerceCommon.product_type,
    price: Property.Number({
      displayName: 'Price',
      description: 'The price of the product',
      required: true,
    }),
    weight: Property.Number({
      displayName: 'Weight',
      description: 'The weight of the product (required for physical products, used for shipping)',
      required: true,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Stock Keeping Unit - unique identifier for the product',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The product description (HTML supported)',
      required: false,
    }),
    categories: Property.Array({
      displayName: 'Category IDs',
      description: 'Array of category IDs to assign the product to',
      required: false,
    }),
    brand_id: Property.Number({
      displayName: 'Brand ID',
      description: 'The ID of the brand',
      required: false,
    }),
    is_visible: Property.Checkbox({
      displayName: 'Is Visible',
      description: 'Whether the product is visible on the storefront',
      required: false,
      defaultValue: true,
    }),
    availability: bigCommerceCommon.availability,
    inventory_tracking: bigCommerceCommon.inventory_tracking,
    inventory_level: Property.Number({
      displayName: 'Inventory Level',
      description: 'Current stock level (only used when inventory tracking is set to "product")',
      required: false,
    }),
    cost_price: Property.Number({
      displayName: 'Cost Price',
      description: 'The cost price of the product',
      required: false,
    }),
    retail_price: Property.Number({
      displayName: 'Retail Price',
      description: 'The retail price (MSRP) of the product',
      required: false,
    }),
    sale_price: Property.Number({
      displayName: 'Sale Price',
      description: 'The sale price of the product',
      required: false,
    }),
    condition: bigCommerceCommon.product_condition,
  },
  async run(context) {
    const {
      name,
      type,
      price,
      weight,
      sku,
      description,
      categories,
      brand_id,
      is_visible,
      availability,
      inventory_tracking,
      inventory_level,
      cost_price,
      retail_price,
      sale_price,
      condition,
    } = context.propsValue;

    // Build product object
    const productData: Record<string, any> = {
      name,
      type,
      price,
      weight,
    };

    // Add optional fields
    if (sku) productData['sku'] = sku;
    if (description) productData['description'] = description;
    if (categories && Array.isArray(categories) && categories.length > 0) {
      productData['categories'] = categories.map((id) => Number(id));
    }
    if (brand_id) productData['brand_id'] = brand_id;
    if (is_visible !== undefined) productData['is_visible'] = is_visible;
    if (availability) productData['availability'] = availability;
    if (inventory_tracking) productData['inventory_tracking'] = inventory_tracking;
    if (inventory_level !== undefined && inventory_tracking === 'product') {
      productData['inventory_level'] = inventory_level;
    }
    if (cost_price !== undefined) productData['cost_price'] = cost_price;
    if (retail_price !== undefined) productData['retail_price'] = retail_price;
    if (sale_price !== undefined) productData['sale_price'] = sale_price;
    if (condition) productData['condition'] = condition;

    // Send request to create product
    const response = await sendBigCommerceRequest<{
      data: {
        id: number;
        name: string;
        type: string;
        sku: string;
        description: string;
        price: number;
        weight: number;
        categories: number[];
        brand_id: number;
        is_visible: boolean;
        availability: string;
        inventory_tracking: string;
        inventory_level: number;
        cost_price: number;
        retail_price: number;
        sale_price: number;
        condition: string;
        date_created: string;
        date_modified: string;
      };
      meta: Record<string, any>;
    }>({
      auth: context.auth as BigCommerceAuth,
      method: HttpMethod.POST,
      url: '/catalog/products',
      body: productData,
    });

    return response.body;
  },
});
