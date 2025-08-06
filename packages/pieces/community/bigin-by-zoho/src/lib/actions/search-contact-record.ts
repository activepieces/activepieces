import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { biginApiService } from '../common/request';

export const searchContactRecord = createAction({
  auth: biginAuth,
  name: 'searchContactRecord',
  displayName: 'Search Contact Record',
  description: 'Searches for a contact record in Bigin by contact name',
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Search for contact by name, email, or mobile number',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { searchTerm } = propsValue;

    const { access_token, api_domain } = auth as any;

    const criteriaValue = ['First_Name', 'Last_Name', 'Email', 'Mobile']
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
        'Contacts',
        {
          key: 'criteria',
          value: criteriaValue,
        }
      );

      return {
        message: 'Contact record search completed successfully',
        data: response.data,
      };
    } catch (error: any) {
      throw new Error(`Error searching contact record: ${error.message}`);
    }
  },
});
