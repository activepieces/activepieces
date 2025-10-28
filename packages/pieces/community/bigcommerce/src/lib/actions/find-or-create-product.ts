import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const getProductFields = (): DynamicPropsValue => {
  return {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Product name (required, max 250 characters)',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      description: 'Type of product (required)',
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
    weight: Property.Number({
      displayName: 'Weight',
      description: 'Product weight (required, used for shipping calculations)',
      required: true,
      defaultValue: 0,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'Product price (required, minimum 0)',
      required: true,
    }),
    categories: Property.MultiSelectDropdown({
      displayName: 'Categories',
      description: 'Product categories (optional, but recommended)',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        try {
          const response = await sendBigCommerceRequest({
            auth: auth as any,
            url: '/catalog/categories',
            method: HttpMethod.GET,
            queryParams: { limit: '250' },
          });

          const categories = (response.body as { data: any[] }).data || [];

          if (categories.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No categories found - create categories in BigCommerce first',
            };
          }

          return {
            disabled: false,
            options: categories.map((category: any) => ({
              label: category.name,
              value: category.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error fetching categories',
          };
        }
      },
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Product SKU (optional, max 255 characters)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Product description (can include HTML)',
      required: false,
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
      description: 'Product availability status',
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

    const { name, type, weight, price, categories } = productFields as any;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Product name is required for product creation');
    }

    if (name.length > 250) {
      throw new Error('Product name cannot exceed 250 characters');
    }

    if (!type || (type !== 'physical' && type !== 'digital')) {
      throw new Error('Product type is required and must be either "physical" or "digital"');
    }

    if (weight === undefined || weight === null || weight < 0) {
      throw new Error('Weight is required and must be 0 or greater');
    }

    if (price === undefined || price === null || price < 0) {
      throw new Error('Price is required and must be 0 or greater');
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

      // Validate categories (optional)
      let categoryArray: number[] = [];
      
      if (categories) {
        if (Array.isArray(categories)) {
          categoryArray = categories.map((id: any) => {
            const numId = typeof id === 'string' ? parseInt(id) : id;
            if (isNaN(numId)) {
              throw new Error(`Invalid category ID: ${id}`);
            }
            return numId;
          });
        } else if (typeof categories === 'number' || typeof categories === 'string') {
          const numId = typeof categories === 'string' ? parseInt(categories) : categories;
          if (isNaN(numId)) {
            throw new Error(`Invalid category ID: ${categories}`);
          }
          categoryArray = [numId];
        }
      }

      const productData: any = {
        name: name.trim(),
        type,
        weight: Number(weight),
        price: Number(price),
      };

      // Add categories only if provided
      if (categoryArray.length > 0) {
        productData.categories = categoryArray;
      }

      // Add optional fields if provided
      const optionalFields = [
        'sku', 'description', 'is_visible', 'is_featured', 'availability', 'condition'
      ];

      optionalFields.forEach(field => {
        const value = (productFields as any)[field];
        if (value !== undefined && value !== null && value !== '') {
          productData[field] = value;
        }
      });

      if (searchBy === 'sku') {
        productData.sku = searchValue;
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