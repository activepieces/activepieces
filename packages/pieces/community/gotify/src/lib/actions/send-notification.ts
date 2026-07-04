import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gotifyAuth } from '../auth';

export const sendNotification = createAction({
  auth: gotifyAuth,
  name: 'send_notification',
  displayName: 'Send Notification',
  description: 'Send a notification to gotify',
  audience: 'both',
  aiMetadata: { description: 'Sends a push notification (title, message, optional 0-10 priority) to a self-hosted Gotify server via its message API. Choose this to alert a user or channel through their Gotify instance configured in the connection. Not idempotent: each call posts a new message, so repeating it delivers duplicate notifications.', idempotent: false },
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
    const baseUrl = auth.props.base_url.replace(/\/$/, '');
    const appToken = auth.props.app_token;

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
