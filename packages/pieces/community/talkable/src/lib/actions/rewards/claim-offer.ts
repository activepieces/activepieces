import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { talkableAuth } from '../../..';

export const claimOffer = createAction({
  name: 'claim-offer', // Must be a unique across the piece, this shouldn't be changed.
  auth: talkableAuth,
  displayName: 'Share and claim offer',
  description: "Using this action, you can share and get a friend's reward",
  props: {
    advocate_email: Property.ShortText({
      displayName: 'Advocate email',
      description: "Example : advocate@example.com",
      required: true,
    }),
    friend_email: Property.ShortText({
      displayName: 'Friend email',
      description: "Example : friend@example.com",
      required: true,
    }),
    campaign_tag: Property.ShortText({
      displayName: 'Campaign tag',
      description: "Example : invite",
      required: true,
    }),
  },
  async run(context) {
    const TALKABLE_API_URL = 'https://www.talkable.com/api/v2';
    const { site, api_key } = context.auth;
    const claimOffer = await httpClient
      .sendRequest<string[]>({
        method: HttpMethod.POST,
        url: `${TALKABLE_API_URL}/offer_claims`,
        headers: {
          Authorization: `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        body: {
          site_slug: site,
          advocate_email: context.propsValue['advocate_email'],
          friend_email: context.propsValue['friend_email'],
          campaign_tag: context.propsValue['campaign_tag'],
        },
      });
    return claimOffer.body;
  },
});
