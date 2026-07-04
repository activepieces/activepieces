import { biginAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { biginApiService } from '../common/request';

export const searchCompanyRecord = createAction({
  auth: biginAuth,
  name: 'searchCompanyRecord',
  displayName: 'Search Company Record',
  description: 'Searches companies by full name (criteria) or word',
  audience: 'both',
  aiMetadata: { description: 'Searches company (account) records in Bigin CRM and returns matches. Choose between Criteria mode (matches the Account Name with equals or starts-with) and Word mode (a free-text word search across the module). Use to find a company by name before referencing or updating it. Idempotent: read-only, repeating the search returns the same matches.', idempotent: true },
  props: {
    mode: Property.StaticDropdown({
      displayName: 'Search Mode',
      required: true,
      defaultValue: 'criteria',
      options: {
        options: [
          { label: 'Criteria (full name)', value: 'criteria' },
          { label: 'Word', value: 'word' },
        ],
      },
    }),
    companyName: Property.ShortText({
      displayName: 'Search Term',
      description: 'Company full name (criteria) or word',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { companyName, mode } = propsValue;

    const { access_token, data } = auth;
    const api_domain = data['api_domain'];

    try {
      const response = await biginApiService.searchRecords(
        access_token,
        api_domain,
        'Accounts',
        mode === 'word'
          ? { key: 'word', value: companyName }
          : {
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
