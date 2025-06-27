import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { talkableAuth } from '../../..';

export const updateReferralStatus = createAction({
  name: 'update-referral-status', // Must be a unique across the piece, this shouldn't be changed.
  auth: talkableAuth,
  displayName: 'Update referral status',
  description: 'You can void or approve referral',
  props: {
    origin_slug: Property.ShortText({
      displayName: 'Order or event number',
      description: undefined,
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description:
        'Select referral status. Only "approved" or "voided" are accepted',
      required: true,
      options: {
        options: [
          { label: 'approved', value: 'approved' },
          { label: 'voided', value: 'voided' },
        ],
      },
    }),
  },
  async run(context) {
    const TALKABLE_API_URL = 'https://www.talkable.com/api/v2';
    const { site, api_key } = context.auth;
    const updateReferralStatusResponse = await httpClient
      .sendRequest<string[]>({
        method: HttpMethod.POST,
        url: `${TALKABLE_API_URL}/origins/${context.propsValue['origin_slug']}/referral`,
        headers: {
          Authorization: `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        body: {
          site_slug: site,
          status: context.propsValue['status'], // we have only one status so it's hardcoded
        },
      });
    return updateReferralStatusResponse.body;
  },
});
