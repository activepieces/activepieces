import {
  createAction,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';

export const addNoteToSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'add_note_to_subscriber',
  displayName: 'Add Note to Subscriber',
  description: 'Add a note to a subscriber',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the subscriber',
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Note to add to the subscriber',
      required: true,
      validators: [Validators.maxLength(1000)],
    }),
  },
  async run(context) {
    const { list_id, email, note } = context.propsValue;
    const { access_token } = context.auth;

    const subscriberHash = mailchimpCommon.getMD5EmailHash(email);
    const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(
      access_token
    );
    const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${list_id}/members/${subscriberHash}/notes`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token,
      },
      body: { note },
    };
    const response = await httpClient.sendRequest(request);

    return response.body;
  },
});
