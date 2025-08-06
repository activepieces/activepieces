import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { biginApiService } from '../common/request';

export const searchProductRecord = createAction({
  auth: biginAuth,
  name: 'searchProductRecord',
  displayName: 'Search Product Record',
  description: 'Searches for a product record in Bigin by product name',
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Search for product by name or Code',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { searchTerm } = propsValue;

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
        {
          key: 'criteria',
          value: criteriaValue,
        }
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
