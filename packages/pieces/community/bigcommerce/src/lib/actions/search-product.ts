import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchProduct = createAction({
  auth: bigcommerceAuth,
  name: 'search_product',
  displayName: 'Search Product',
  description: 'Searches for products in BigCommerce',
  props: {
    searchType: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Type of search to perform',
      required: true,
      defaultValue: 'name',
      options: {
        disabled: false,
        options: [
          { label: 'Name', value: 'name' },
          { label: 'SKU', value: 'sku' },
          { label: 'UPC', value: 'upc' },
          { label: 'MPN', value: 'mpn' },
          { label: 'GTIN', value: 'gtin' },
          { label: 'Keyword', value: 'keyword' },
          { label: 'Brand ID', value: 'brand_id' },
          { label: 'Category ID', value: 'categories' },
          { label: 'Product ID', value: 'id' },
          { label: 'Type', value: 'type' },
          { label: 'Availability', value: 'availability' },
          { label: 'Condition', value: 'condition' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for',
      required: true,
    }),
    includeFields: Property.ShortText({
      displayName: 'Include Fields',
      description: 'Comma-separated list of fields to include (e.g., name,sku,price)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 50, max: 250)',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { searchType, searchValue, includeFields, limit } = context.propsValue;

    if (!searchType || !searchValue) {
      throw new Error('Search type and search value are required');
    }

    try {
      const queryParams: Record<string, string> = {
        limit: Math.min(limit || 50, 250).toString(),
      };

      // Use correct BigCommerce API query parameter names
      switch (searchType) {
        case 'name':
          queryParams['name:like'] = searchValue;
          break;
        case 'sku':
          queryParams['sku:like'] = searchValue;
          break;
        case 'upc':
          queryParams['upc'] = searchValue;
          break;
        case 'mpn':
          queryParams['mpn'] = searchValue;
          break;
        case 'gtin':
          queryParams['gtin'] = searchValue;
          break;
        case 'keyword':
          queryParams['keyword'] = searchValue;
          break;
        case 'brand_id':
          queryParams['brand_id'] = searchValue;
          break;
        case 'categories':
          queryParams['categories:in'] = searchValue;
          break;
        case 'id':
          queryParams['id:in'] = searchValue;
          break;
        case 'type':
          queryParams['type'] = searchValue;
          break;
        case 'availability':
          queryParams['availability'] = searchValue;
          break;
        case 'condition':
          queryParams['condition'] = searchValue;
          break;
        default:
          queryParams[searchType] = searchValue;
      }

      if (includeFields) {
        queryParams['include_fields'] = includeFields;
      }

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/catalog/products',
        method: HttpMethod.GET,
        queryParams,
      });

      const products = (response.body as { data: any[] }).data || [];

      return {
        success: true,
        products,
        count: products.length,
        message: `Found ${products.length} product(s) matching "${searchValue}"`,
      };
    } catch (error) {
      throw handleBigCommerceError(error, 'Failed to search products');
    }
  },
});