import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const getProductFields = (productType: string): DynamicPropsValue => {
  const commonFields = {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Product name (required)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Product description',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Product SKU',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'Product price (required)',
      required: true,
    }),
    categories: Property.Array({
      displayName: 'Category IDs',
      description: 'Array of category IDs (at least one required)',
      required: true,
    }),
    weight: Property.Number({
      displayName: 'Weight',
      description: 'Product weight (required for physical products)',
      required: productType === 'physical',
    }),
    is_visible: Property.Checkbox({
      displayName: 'Is Visible',
      description: 'Whether product is visible in storefront',
      required: false,
      defaultValue: true,
    }),
    is_featured: Property.Checkbox({
      displayName: 'Is Featured',
      description: 'Whether product is featured',
      required: false,
      defaultValue: false,
    }),
    availability: Property.StaticDropdown({
      displayName: 'Availability',
      description: 'Product availability',
      required: false,
      defaultValue: 'available',
      options: {
        disabled: false,
        options: [
          { label: 'Available', value: 'available' },
          { label: 'Disabled', value: 'disabled' },
          { label: 'Preorder', value: 'preorder' },
        ],
      },
    }),
    condition: Property.StaticDropdown({
      displayName: 'Condition',
      description: 'Product condition',
      required: false,
      defaultValue: 'New',
      options: {
        disabled: false,
        options: [
          { label: 'New', value: 'New' },
          { label: 'Used', value: 'Used' },
          { label: 'Refurbished', value: 'Refurbished' },
        ],
      },
    }),
  };

  if (productType === 'physical') {
    return {
      ...commonFields,
      inventory_level: Property.Number({
        displayName: 'Inventory Level',
        description: 'Current inventory level',
        required: false,
      }),
      inventory_warning_level: Property.Number({
        displayName: 'Inventory Warning Level',
        description: 'Low stock warning level',
        required: false,
      }),
      inventory_tracking: Property.StaticDropdown({
        displayName: 'Inventory Tracking',
        description: 'Inventory tracking method',
        required: false,
        defaultValue: 'none',
        options: {
          disabled: false,
          options: [
            { label: 'None', value: 'none' },
            { label: 'Simple', value: 'simple' },
            { label: 'SKU', value: 'sku' },
          ],
        },
      }),
      width: Property.Number({
        displayName: 'Width',
        description: 'Product width',
        required: false,
      }),
      height: Property.Number({
        displayName: 'Height',
        description: 'Product height',
        required: false,
      }),
      depth: Property.Number({
        displayName: 'Depth',
        description: 'Product depth',
        required: false,
      }),
      is_free_shipping: Property.Checkbox({
        displayName: 'Free Shipping',
        description: 'Whether product has free shipping',
        required: false,
        defaultValue: false,
      }),
    };
  }

  return commonFields;
};

export const createProduct = createAction({
  auth: bigcommerceAuth,
  name: 'create_product',
  displayName: 'Create Product',
  description: 'Creates a new product in BigCommerce',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      description: 'Type of product',
      required: true,
      defaultValue: 'physical',
      options: {
        disabled: false,
        options: [
          { label: 'Physical', value: 'physical' },
          { label: 'Digital', value: 'digital' },
        ],
      },
    }),
    productFields: Property.DynamicProperties({
      displayName: 'Product Fields',
      description: 'Product information',
      required: true,
      refreshers: ['type'],
      props: async ({ type }) => {
        if (!type) {
          return {};
        }
        return getProductFields(type as unknown as string);
      },
    }),
  },
  async run(context) {
    const { type, productFields } = context.propsValue;

    if (!type || !productFields || typeof productFields !== 'object') {
      throw new Error('Product type and fields are required');
    }

    const { name, price, categories } = productFields as any;

    if (!name) {
      throw new Error('Product name is required');
    }

    if (!price || price <= 0) {
      throw new Error('Product price is required and must be greater than 0');
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      throw new Error('At least one category ID is required');
    }

    try {
      const productData: any = {
        type,
        name,
        price,
        categories: categories.map((id: any) => parseInt(id.toString())),
      };

      // Add other fields if provided
      Object.entries(productFields).forEach(([key, value]) => {
        if (key !== 'name' && key !== 'price' && key !== 'categories' && 
            value !== undefined && value !== null && value !== '') {
          productData[key] = value;
        }
      });

      // Ensure weight is provided for physical products
      if (type === 'physical' && !productData.weight) {
        productData.weight = 0;
      }

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/catalog/products',
        method: HttpMethod.POST,
        body: productData,
      });

      const product = (response.body as { data: any }).data;

      return {
        success: true,
        message: `Product "${name}" created successfully`,
        data: product,
      };
    } catch (error) {
      throw handleBigCommerceError(error, 'Failed to create product');
    }
  },
});