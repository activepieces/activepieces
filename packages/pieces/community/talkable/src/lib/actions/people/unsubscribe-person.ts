import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { talkableAuth } from '../../..';

export const unsubscribePerson = createAction({
  name: 'unsubscribe_person', // Must be a unique across the piece, this shouldn't be changed.
  auth: talkableAuth,
  displayName: 'Unsubscribe person',
  description: 'Unsubscribe person by email',
  audience: 'both',
  aiMetadata: { description: 'Mark a Talkable person, identified by email, as unsubscribed from referral/marketing communications. Use to honor an opt-out request. Idempotent: an already-unsubscribed person stays unsubscribed with no extra effect; the email is required.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'Person email',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    const TALKABLE_API_URL = 'https://www.talkable.com/api/v2';
    const { site, api_key } = context.auth.props;
    const personUnsubscribeResponse = await httpClient
      .sendRequest<string[]>({
        method: HttpMethod.POST,
        url: `${TALKABLE_API_URL}/people/${context.propsValue['email']}/unsubscribe`,
        headers: {
          Authorization: `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        body: {
          site_slug: site,
        },
      });
    return personUnsubscribeResponse.body;
  },
});
