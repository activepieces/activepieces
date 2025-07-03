import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { talkableAuth } from '../../..';

export const findPerson = createAction({
  name: 'find_person', // Must be a unique across the piece, this shouldn't be changed.
  auth: talkableAuth,
  displayName: 'Find person',
  description: 'Find person by email',
  props: {
    email: Property.ShortText({
      displayName: 'Person email',
      description: undefined,
      required: true,
    }),
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      description: 'Select scope',
      required: true,
      options: {
        options: [
          {
            label: 'General information',
            value: '/',
          },
          {
            label: 'Referrals as advocate',
            value: '/referrals_as_advocate',
          },
          {
            label: 'Referrals as friend',
            value: '/referrals_as_friend',
          },
          {
            label: 'Rewards',
            value: '/rewards',
          },
          {
            label: 'Shares',
            value: '/shares_by',
          },
          {
            label: 'Personal data',
            value: '/personal_data',
          },
        ],
      },
    }),
  },
  async run(context) {
    const TALKABLE_API_URL = 'https://www.talkable.com/api/v2';
    const { site, api_key } = context.auth;
    const personInfoResponse = await httpClient
      .sendRequest<string[]>({
        method: HttpMethod.GET,
        url: `${TALKABLE_API_URL}/people/${context.propsValue['email']}${context.propsValue['scope']}`,
        headers: {
          Authorization: `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        body: {
          site_slug: site,
        },
      });
    return personInfoResponse.body;
  },
});
