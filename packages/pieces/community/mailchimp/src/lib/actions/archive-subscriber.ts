import { createAction, Property } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import crypto from 'crypto';

export const mailChimpArchiveSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'archive-subscriber',
  displayName: 'Archive Subscriber',
  description: 'Archives a subscriber from the selected audience.',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({ displayName: 'Email', required: true }),
  },
  async run(ctx) {
    const token = getAccessTokenOrThrow(ctx.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    const listId = ctx.propsValue.list_id!;
    const emailHash = crypto
      .createHash('md5')
      .update(ctx.propsValue.email!.trim().toLowerCase())
      .digest('hex');

    const resp = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`,
      headers: { Authorization: `OAuth ${token}` },
      body: { status: 'archived' },
    });

    return resp.body;
  },
});
