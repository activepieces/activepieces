import { createAction, Property } from '@activepieces/pieces-framework';
import { kudosityAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const cancelSms = createAction({
  auth: kudosityAuth,
  name: 'cancelSms',
  displayName: 'Cancel SMS',
  description: 'Cancel a scheduled SMS message in Kudosity',
  props: {
    id: Property.ShortText({
      displayName: 'Message ID',
      description: 'Numeric ID assigned to the message sent',
      required: true,
    }),
  },
  async run(context) {
    const payload = {
      id: context.propsValue.id,
    };

    const res = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/cancel-sms.json',
      payload
    );

    return res;
  },
});
