import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';

export const sendNotification = createAction({
  auth: pushoverAuth,
  name: 'send_notification',
  displayName: 'Send Notification',
  description: 'Send a notification to Pushover',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the notification',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to send',
      required: true,
    }),
    html: Property.Checkbox({
      displayName: 'Enable HTML',
      description: 'To enable HTML parsing',
      required: false,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description:
        'The priority of the notification (-2 to 2). -2 is lowest priority. If set to 2, you should also specify Retry and Expire.',
      required: false,
    }),
    retry: Property.Number({
      displayName: 'Retry',
      description:
        'Works only if priority is set to 2. Specifies how often (in seconds) the Pushover servers will send the same notification to the user.',
      required: false,
    }),
    expire: Property.Number({
      displayName: 'Expire',
      description:
        'Works only if priority is set to 2. Specifies how many seconds your notification will continue to be retried for (every retry seconds).',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'A supplementary URL to show with your message.',
      required: false,
    }),
    url_title: Property.ShortText({
      displayName: 'URL Title',
      description:
        'A title for the URL specified as the url input parameter, otherwise just the URL is shown.',
      required: false,
    }),
    timestamp: Property.ShortText({
      displayName: 'Timestamp',
      description:
        'a Unix timestamp of a time to display instead of when our API received it.',
      required: false,
    }),
    device: Property.ShortText({
      displayName: 'Device',
      description:
        'The name of one of your devices to send just to that device instead of all devices.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const baseUrl = 'https://api.pushover.net/1/messages.json';
    const apiToken = auth.api_token;
    const userKey = auth.user_key;

    const title = propsValue.title;
    const message = propsValue.message;
    const html = propsValue.html;
    const priority = propsValue.priority;
    const url = propsValue.url;
    const url_title = propsValue.url_title;
    const timestamp = propsValue.timestamp;
    const device = propsValue.device;
    const retry = propsValue.retry;
    const expire = propsValue.expire;

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: baseUrl,
      body: {
        token: apiToken,
        user: userKey,
        title,
        message,
        html: html ? 1 : 0,
        url,
        url_title,
        timestamp,
        device,
        ...(priority && { priority: +priority }),
        ...(retry && { retry: +retry }),
        ...(expire && { expire: +expire }),
      },
    });
  },
});
