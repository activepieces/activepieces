import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { biginApiService } from '../common/request';

export const searchContactRecord = createAction({
  auth: biginAuth,
  name: 'searchContactRecord',
  displayName: 'Search Contact Record',
  description: 'Searches contacts by criteria, email, phone, or word',
  props: {
    mode: Property.StaticDropdown({
      displayName: 'Search Mode',
      description: 'Choose how to search Contacts',
      required: true,
      defaultValue: 'criteria',
      options: {
        options: [
          { label: 'Criteria (name/email/mobile)', value: 'criteria' },
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Word', value: 'word' },
        ],
      },
    }),
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Text, email, phone, or word based on the selected mode',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { searchTerm, mode } = propsValue as any;

    const { access_token, api_domain } = auth as any;

    let queryKey = 'criteria';
    let queryValue = '';
    if (mode === 'email') {
      queryKey = 'email';
      queryValue = searchTerm;
    } else if (mode === 'phone') {
      queryKey = 'phone';
      queryValue = searchTerm;
    } else if (mode === 'word') {
      queryKey = 'word';
      queryValue = searchTerm;
    } else {
      queryValue = ['First_Name', 'Last_Name', 'Email', 'Mobile']
        .flatMap((key) => [
          `${key}:equals:${searchTerm}`,
          `${key}:starts_with:${searchTerm}`,
        ])
        .map((condition) => `(${condition})`)
        .join('OR');
    }

    try {
      const response = await biginApiService.searchRecords(
        access_token,
        api_domain,
        'Contacts',
        {
          key: queryKey,
          value: queryValue,
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
