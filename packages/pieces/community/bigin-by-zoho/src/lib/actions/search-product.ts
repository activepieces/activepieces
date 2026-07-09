import { biginAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { biginApiService } from '../common/request';

export const searchProductRecord = createAction({
  auth: biginAuth,
  name: 'searchProductRecord',
  displayName: 'Search Product Record',
  description: 'Searches products by name/code via criteria or word',
  audience: 'both',
  aiMetadata: { description: 'Searches product records in Bigin CRM and returns matches. Choose between Criteria mode (matches Product Name or Product Code with equals or starts-with) and Word mode (a free-text word search across the module). Use to find a product by name or code before associating it with a deal. Idempotent: read-only, repeating the search returns the same matches.', idempotent: true },
  props: {
    mode: Property.StaticDropdown({
      displayName: 'Search Mode',
      required: true,
      defaultValue: 'criteria',
      options: {
        options: [
          { label: 'Criteria (name/code)', value: 'criteria' },
          { label: 'Word', value: 'word' },
        ],
      },
    }),
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Product name/code (criteria) or word',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { searchTerm, mode } = propsValue;

    const { access_token, data } = auth;
    const api_domain = data['api_domain'];

    const criteriaValue = ['Product_Name', 'Product_Code']
      .flatMap((key) => [
        `${key}:equals:${searchTerm}`,
        `${key}:starts_with:${searchTerm}`,
      ])
      .map((condition) => `(${condition})`)
      .join('OR');

    try {
      const response = await biginApiService.searchRecords(
        access_token,
        api_domain,
        'Products',
        mode === 'word' ? { key: 'word', value: searchTerm } : { key: 'criteria', value: criteriaValue }
      );

      return {
        message: 'Product record search completed successfully',
        data: response.data,
      };
    } catch (error: any) {
      throw new Error(`Error searching product record: ${error.message}`);
    }
  },
});
