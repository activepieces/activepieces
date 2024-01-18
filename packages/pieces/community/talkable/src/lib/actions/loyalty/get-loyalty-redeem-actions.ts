import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { talkableAuth } from '../../..';

export const getLoyaltyRedeemActions = createAction({
  name: 'get_loyalty_redeem_actions', // Must be a unique across the piece, this shouldn't be changed.
  auth: talkableAuth,
  displayName: 'Get loyalty actions',
  description: 'Get array of loyalty actions',
  props: {
    person_email: Property.ShortText({
      displayName: 'Person email',
      description: undefined,
      required: true,
    }),
    failsafe: Property.Checkbox({
      displayName: 'No Error On Failure',
      required: false,
    }),
  },
  async run(context) {
    const TALKABLE_API_URL = 'https://www.talkable.com/api/v2';
    const { site, api_key } = context.auth;
    const getLoyaltyRedeemActionsResponse = await httpClient
      .sendRequest<string[]>({
        method: HttpMethod.GET,
        url: `${TALKABLE_API_URL}/loyalty/members/${context.propsValue['person_email']}/redeem_actions`,
        headers: {
          Authorization: `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        body: {
          site_slug: site,
        },
      })
      .catch((error) => {
        if (context.propsValue.failsafe) {
          return error.errorMessage();
        }
        throw error;
      });
    return getLoyaltyRedeemActionsResponse.body;
  },
});
