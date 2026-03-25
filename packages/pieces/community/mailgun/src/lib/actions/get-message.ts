import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../auth';
import { mailgunApiCall, MailgunStoredMessageResponse } from '../common/client';

export const getMessageAction = createAction({
  auth: mailgunAuth,
  name: 'get_message',
  displayName: 'Get Message',
  description: 'Retrieve a stored Mailgun message by storage key.',
  props: {
    storageKey: Property.ShortText({
      displayName: 'Storage Key',
      description: 'The storage.key value returned from Mailgun events.',
      required: true,
    }),
  },
  async run(context) {
    return await mailgunApiCall<MailgunStoredMessageResponse>(
      context.auth.props,
      HttpMethod.GET,
      `/v3/domains/${encodeURIComponent(context.auth.props.domain)}/messages/${encodeURIComponent(context.propsValue.storageKey)}`
    );
  },
});
