import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { novuAuth } from '../..';

export const deleteSubscriber = createAction({
  auth: novuAuth,
  name: 'delete_subscriber',
  displayName: 'Delete Subscriber',
  description: 'Delete a subscriber from Novu',
  props: {
    subscriber_id: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The subscriber ID to delete',
      required: true,
    }),
  },
  async run(context) {
    const { subscriber_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.novu.co/v1/subscribers/${encodeURIComponent(subscriber_id)}`,
      headers: {
        Authorization: `ApiKey ${context.auth}`,
      },
      authentication: {
        type: AuthenticationType.CUSTOM,
      },
    });
    return response.body;
  },
});
