import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { KLAVIYO_API_URL, KLAVIYO_API_REVISION } from '../common';

export const findProfileByEmailOrPhone = createAction({
  auth: klaviyoAuth,
  name: 'find_profile_by_email_or_phone',
  displayName: 'Find Profile by Email/Phone',
  description: 'Look up a Klaviyo profile by email address or phone number.',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      required: true,
      defaultValue: 'email',
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone Number', value: 'phone_number' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'The email address or phone number to search for.',
      required: true,
    }),
  },
  async run(context) {
    const { searchBy, searchValue } = context.propsValue;

    const filter = `equals(${searchBy},"${searchValue}")`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${KLAVIYO_API_URL}/profiles`,
      queryParams: { filter },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      headers: {
        Accept: 'application/vnd.api+json',
        revision: KLAVIYO_API_REVISION,
      },
    });

    return response.body;
  },
});
