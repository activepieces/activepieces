import { createAction, Property } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import crypto from 'crypto';

export const mailChimpAddOrUpdateSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'add-or-update-subscriber',
  displayName: 'Add or Update Subscriber',
  description:
    'Adds a new member or updates an existing one in the selected audience.',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Subscribed', value: 'subscribed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Transactional', value: 'transactional' },
        ],
      },
      defaultValue: 'subscribed',
    }),
  },
  async run(context) {
    const token = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    const listId = context.propsValue.list_id!;
    const email = context.propsValue.email!.trim().toLowerCase();
    const emailHash = crypto.createHash('md5').update(email).digest('hex');

    const body: any = {
      email_address: email,
      status_if_new: context.propsValue.status ?? 'subscribed',
      merge_fields: {},
    };
    if (context.propsValue.first_name)
      body.merge_fields.FNAME = context.propsValue.first_name;
    if (context.propsValue.last_name)
      body.merge_fields.LNAME = context.propsValue.last_name;

    const url = `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`;

    const resp = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url,
      headers: { Authorization: `OAuth ${token}` },
      body,
    });

    return resp.body;
  },
});
