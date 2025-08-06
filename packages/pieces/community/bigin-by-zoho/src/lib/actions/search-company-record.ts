import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { biginApiService } from '../common/request';

export const searchCompanyRecord = createAction({
  auth: biginAuth,
  name: 'searchCompanyRecord',
  displayName: 'Search Company Record',
  description: 'Searches for a company record in Bigin by company name',
  props: {
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: 'Full Name of the company to search for',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { companyName } = propsValue;

    const { access_token, api_domain } = auth as any;

    try {
      const response = await biginApiService.searchRecords(
        access_token,
        api_domain,
        'Accounts',
        {
          key: 'criteria',
          value: `(Account_Name:equals:${companyName})OR(Account_Name:starts_with:${companyName})`,
        }
      );

      return {
        message: 'Company record search completed successfully',
        data: response.data,
      };
    } catch (error: any) {
      throw new Error(`Error searching company record: ${error.message}`);
    }
  },
});
