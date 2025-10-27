import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const getProductFields = (): DynamicPropsValue => {
  return {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Product name (required)',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      description: 'Type of product',
      required: false,
      defaultValue: 'physical',
      options: {
        disabled: false,
        options: [
          { label: 'Physical', value: 'physical' },
          { label: 'Digital', value: 'digital' },
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Product description',
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
      required: false,
    }),
    is_visible: Property.Checkbox({
      displayName: 'Is Visible',
      description: 'Whether product is visible in storefront',
      required: false,
      defaultValue: true,
    }),
  };
};

export const findOrCreateProduct = createAction({
  auth: bigcommerceAuth,
  name: 'find_or_create_product',
  displayName: 'Find or Create Product',
  description: 'Finds an existing product by SKU or name, or creates a new one if not found',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Field to search by',
      required: true,
      defaultValue: 'sku',
      options: {
        disabled: false,
        options: [
          { label: 'SKU', value: 'sku' },
          { label: 'Name', value: 'name' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for',
      required: true,
    }),
    productFields: Property.DynamicProperties({
      displayName: 'Product Fields (for creation)',
      description: 'Product information to use if creating a new product',
      required: true,
      refreshers: [],
      props: async () => {
        return getProductFields();
      },
    }),
  },
  async run(context) {
    const { searchBy, searchValue, productFields } = context.propsValue;

    if (!searchBy || !searchValue || !productFields || typeof productFields !== 'object') {
      throw new Error('Search field, search value, and product fields are required');
    }

    const { name, price, categories, type } = productFields as any;

    if (!name) {
      throw new Error('Product name is required for product creation');
    }

    if (!price || price <= 0) {
      throw new Error('Product price is required and must be greater than 0');
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      throw new Error('At least one category ID is required for product creation');
    }

    try {
      const searchQueryParam = searchBy === 'name' ? 'name:like' : searchBy;
      const searchResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/catalog/products',
        method: HttpMethod.GET,
        queryParams: { [searchQueryParam]: searchValue, limit: '1' },
      });

      const existingProducts = (searchResponse.body as { data: any[] }).data || [];

      if (existingProducts.length > 0) {
        return {
          success: true,
          found: true,
          message: `Product with ${searchBy} "${searchValue}" found`,
          data: existingProducts[0],
        };
      }

      const productData: any = {
        name,
        price,
        categories: categories.map((id: any) => parseInt(id.toString())),
        type: type || 'physical',
      };

      // Add other fields if provided
      Object.entries(productFields).forEach(([key, value]) => {
        if (key !== 'name' && key !== 'price' && key !== 'categories' && key !== 'type' && 
            value !== undefined && value !== null && value !== '') {
          productData[key] = value;
        }
      });

      if (searchBy === 'sku') {
        productData.sku = searchValue;
      }

      // Ensure weight is provided for physical products
      if (productData.type === 'physical' && !productData.weight) {
        productData.weight = 0;
      }

      const createResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/catalog/products',
        method: HttpMethod.POST,
        body: productData,
      });

      const product = (createResponse.body as { data: any }).data;

      return {
        success: true,
        found: false,
        message: `Product "${name}" created successfully`,
        data: product,
      };
    } catch (error) {
      throw handleBigCommerceError(error, 'Failed to find or create product');
    }
  },
});