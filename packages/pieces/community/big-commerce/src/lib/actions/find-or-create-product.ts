import { createAction, Property } from '@activepieces/pieces-framework';
import { bigCommerceAuth } from '../..';
import { sendBigCommerceRequest, BigCommerceAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const findOrCreateProduct = createAction({
  auth: bigCommerceAuth,
  name: 'find_or_create_product',
  displayName: 'Find or Create Product',
  description: 'Find an existing product by SKU or create a new one if not found',
  props: {
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Stock Keeping Unit - unique identifier used to search for the product',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'The name of the product (used when creating)',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      description: 'The type of product (used when creating)',
      required: true,
      options: {
        options: [
          { label: 'Physical', value: 'physical' },
          { label: 'Digital', value: 'digital' },
        ],
      },
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'The price of the product (used when creating)',
      required: true,
    }),
    weight: Property.Number({
      displayName: 'Weight',
      description: 'The weight of the product (used when creating)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The product description (used when creating)',
      required: false,
    }),
    categories: Property.Array({
      displayName: 'Category IDs',
      description: 'Array of category IDs (used when creating)',
      required: false,
    }),
    brand_id: Property.Number({
      displayName: 'Brand ID',
      description: 'The ID of the brand (used when creating)',
      required: false,
    }),
    is_visible: Property.Checkbox({
      displayName: 'Is Visible',
      description: 'Whether the product is visible on storefront (used when creating)',
      required: false,
      defaultValue: true,
    }),
    inventory_tracking: Property.StaticDropdown({
      displayName: 'Inventory Tracking',
      description: 'How to track inventory (used when creating)',
      required: false,
      options: {
        options: [
          { label: 'None', value: 'none' },
          { label: 'Product', value: 'product' },
          { label: 'Variant', value: 'variant' },
        ],
      },
      defaultValue: 'none',
    }),
    inventory_level: Property.Number({
      displayName: 'Inventory Level',
      description: 'Current stock level (used when creating, only when inventory tracking is "product")',
      required: false,
    }),
  },
  async run(context) {
    const {
      sku,
      name,
      type,
      price,
      weight,
      description,
      categories,
      brand_id,
      is_visible,
      inventory_tracking,
      inventory_level,
    } = context.propsValue;

    // Step 1: Search for existing product by SKU
    const searchResponse = await sendBigCommerceRequest<{
      data: Array<{
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
        inventory_tracking: string;
        inventory_level: number;
        date_created: string;
        date_modified: string;
      }>;
      meta: {
        pagination: {
          total: number;
        };
      };
    }>({
      auth: context.auth as BigCommerceAuth,
      method: HttpMethod.GET,
      url: '/catalog/products',
      queryParams: {
        'sku': sku,
        'limit': '1',
      },
    });

    // If product exists, return it
    if (searchResponse.body.data && searchResponse.body.data.length > 0) {
      const existingProduct = searchResponse.body.data[0];
      return {
        found: true,
        created: false,
        product: existingProduct,
        message: `Found existing product with ID: ${existingProduct.id}`,
      };
    }

    // Step 2: Product not found, create a new one
    const productData: Record<string, any> = {
      name,
      type,
      price,
      weight,
      sku,
    };

    // Add optional fields
    if (description) productData['description'] = description;
    if (categories && Array.isArray(categories) && categories.length > 0) {
      productData['categories'] = categories.map((id) => Number(id));
    }
    if (brand_id) productData['brand_id'] = brand_id;
    if (is_visible !== undefined) productData['is_visible'] = is_visible;
    if (inventory_tracking) productData['inventory_tracking'] = inventory_tracking;
    if (inventory_level !== undefined && inventory_tracking === 'product') {
      productData['inventory_level'] = inventory_level;
    }

    const createResponse = await sendBigCommerceRequest<{
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
        inventory_tracking: string;
        inventory_level: number;
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

    const newProduct = createResponse.body.data;
    return {
      found: false,
      created: true,
      product: newProduct,
      message: `Created new product with ID: ${newProduct.id}`,
    };
  },
});
