import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { talkableAuth } from '../../..';

export const findPerson = createAction({
  name: 'find_person', // Must be a unique across the piece, this shouldn't be changed.
  auth: talkableAuth,
  displayName: 'Find person',
  description: 'Find person by email',
  audience: 'both',
  aiMetadata: { description: 'Look up a Talkable person record by email and return the requested slice of their data; the scope selector switches between general profile info, referrals as advocate, referrals as friend, rewards, shares, or personal data. Use to fetch a known customer\'s referral/loyalty details. Read-only; the email and chosen scope are required.', idempotent: true },
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
    const { site, api_key } = context.auth.props;
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
