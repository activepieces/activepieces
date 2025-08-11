import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { biginApiService } from '../common/request';

export const searchProductRecord = createAction({
  auth: biginAuth,
  name: 'searchProductRecord',
  displayName: 'Search Product Record',
  description: 'Searches products by name/code via criteria or word',
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
    const { searchTerm, mode } = propsValue as any;

    const { access_token, api_domain } = auth as any;

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
