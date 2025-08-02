import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { formSlugOrIdDropdown } from '../common/props';

export const findFormProduct = createAction({
  auth: PaperformAuth,
  name: 'findFormProduct',
  displayName: 'Find Form Product',
  description: 'Retrieve product metadata from a form by product ID or name',
  props: {
    slug_or_id: formSlugOrIdDropdown,
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'How to search for the product',
      required: true,
      options: {
        options: [
          { label: 'Product ID', value: 'id' },
          { label: 'Product Name', value: 'name' },
          { label: 'Product SKU', value: 'sku' },
        ],
      },
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The ID, name, or SKU of the product to find',
      required: true,
    }),
  },
  async run(context) {
    const { slug_or_id, search_by, search_value } = context.propsValue;
    const apiKey = context.auth as string;

    // Get all products from the form
    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/forms/${slug_or_id}/products`
    );

    const products = response.data || response;

    if (!Array.isArray(products)) {
      return {
        success: false,
        error: 'invalid_response',
        message: 'Invalid response format from API',
      };
    }

    // Find the product based on search criteria
    let foundProduct;

    switch (search_by) {
      case 'id':
        foundProduct = products.find(
          (product: any) =>
            product.id === search_value || product.id === parseInt(search_value)
        );
        break;
      case 'name':
        foundProduct = products.find(
          (product: any) =>
            product.name &&
            product.name.toLowerCase().includes(search_value.toLowerCase())
        );
        break;
      case 'sku':
        foundProduct = products.find(
          (product: any) =>
            product.SKU === search_value || product.sku === search_value
        );
        break;
      default:
        return {
          success: false,
          error: 'invalid_search_type',
          message: 'Invalid search type specified',
        };
    }

    if (!foundProduct) {
      return {
        success: false,
        error: 'product_not_found',
        message: `Product with ${search_by} "${search_value}" was not found in form ${slug_or_id}`,
        search_by,
        search_value,
        form_slug_or_id: slug_or_id,
      };
    }

    return {
      success: true,
      message: `Successfully found product with ${search_by} "${search_value}"`,
      product: foundProduct,
      search_by,
      search_value,
      form_slug_or_id: slug_or_id,
    };
  },
});
