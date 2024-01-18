import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gotifyAuth } from '../../';

export const sendNotification = createAction({
  auth: gotifyAuth,
  name: 'send_notification',
  displayName: 'Send Notification',
  description: 'Send a notification to gotify',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the notification',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to send',
      required: true,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description:
        'The priority of the notification (0-10). 0 is lowest priority.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const baseUrl = auth.base_url.replace(/\/$/, '');
    const appToken = auth.app_token;

    const title = propsValue.title;
    const message = propsValue.message;
    const priority = propsValue.priority;

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/message?token=${appToken}`,
      body: {
        title,
        message,
        ...(priority && { priority: +priority }),
      },
    });
  },
});
