import { zohoAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const searchProduct = createAction({
  auth: zohoAuth,
  name: 'search-product',
  displayName: 'Search Product',
  description: 'Search products by name or code in Bigin',
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Product name or code to search for',
      required: true,
    }),
    searchField: Property.StaticDropdown({
      displayName: 'Search Field',
      description: 'Field to search in',
      required: true,
      options: {
        options: [
          { label: 'Product Name', value: 'name' },
          { label: 'Product Code', value: 'code' },
          { label: 'Description', value: 'description' },
        ],
      },
    }),
    category: Property.ShortText({
      displayName: 'Category Filter',
      description: 'Filter products by category (optional)',
      required: false,
    }),
    priceMin: Property.Number({
      displayName: 'Minimum Price',
      description: 'Minimum price to filter by (optional)',
      required: false,
    }),
    priceMax: Property.Number({
      displayName: 'Maximum Price',
      description: 'Maximum price to filter by (optional)',
      required: false,
    }),
    isActive: Property.Checkbox({
      displayName: 'Active Products Only',
      description: 'Show only active products',
      required: false,
      defaultValue: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 50)',
      required: false,
      defaultValue: 50,
    }),
    includeDetails: Property.Checkbox({
      displayName: 'Include Full Details',
      description: 'Include complete product information in results',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const {
      searchTerm,
      searchField,
      category,
      priceMin,
      priceMax,
      isActive,
      limit,
      includeDetails,
    } = propsValue;

    // Construct the API endpoint
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/products/search`;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('search_term', searchTerm);
    queryParams.append('search_field', searchField);
    
    if (category) {
      queryParams.append('category', category);
    }
    
    if (priceMin) {
      queryParams.append('price_min', priceMin.toString());
    }
    
    if (priceMax) {
      queryParams.append('price_max', priceMax.toString());
    }
    
    if (isActive !== undefined) {
      queryParams.append('is_active', isActive.toString());
    }
    
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    if (includeDetails) {
      queryParams.append('include_details', 'true');
    }

    const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to search products: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    return {
      products: result.data || result,
      total_count: result.total_count || result.length,
      search_term: searchTerm,
      search_field: searchField,
      search_filters: {
        category,
        price_min: priceMin,
        price_max: priceMax,
        is_active: isActive,
      },
    };
  },
}); 