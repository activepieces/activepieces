import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { talkableAuth } from '../../..';

export const updateReferralStatus = createAction({
  name: 'update-referral-status', // Must be a unique across the piece, this shouldn't be changed.
  auth: talkableAuth,
  displayName: 'Update referral status',
  description: 'You can void or approve referral',
  audience: 'both',
  aiMetadata: { description: 'Set the status of a referral tied to a purchase/event origin in Talkable to either "approved" or "voided", identified by its order/event number (origin slug). Use to manually approve a pending referral reward or void a fraudulent/invalid one. Idempotent: re-applying the same status leaves it unchanged; origin slug and a status of approved or voided are required.', idempotent: true },
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
    const { site, api_key } = context.auth.props;
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
