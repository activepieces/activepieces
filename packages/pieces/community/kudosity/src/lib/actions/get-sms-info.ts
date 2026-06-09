import { createAction, Property } from '@activepieces/pieces-framework';
import { kudosityAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getSmsInfo = createAction({
  auth: kudosityAuth,
  name: 'getSmsInfo',
  displayName: 'Get SMS info',
  description: 'Retrieve details for a sent SMS by ID',
  props: {
    id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The message ID to retrieve (UUID returned when sending)',
      required: true,
    }),
  },
  async run(context) {
    const id = context.propsValue.id;

    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.transmitmessage.com/v2/sms/${id}`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    });

    return res;
  },
});
