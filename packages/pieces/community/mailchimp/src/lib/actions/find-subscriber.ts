import { createAction, Property } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import crypto from 'crypto';

export const mailChimpFindSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'find-subscriber',
  displayName: 'Find Subscriber',
  description: 'Finds a subscriber by email in the selected audience.',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run(context) {
    const token = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    const listId = context.propsValue.list_id!;
    const email = context.propsValue.email!.trim().toLowerCase();
    const emailHash = crypto.createHash('md5').update(email).digest('hex');

    const url = `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`;

    const resp = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: { Authorization: `OAuth ${token}` },
    });

    return resp.body;
  },
});
