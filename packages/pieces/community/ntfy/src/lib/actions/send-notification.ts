import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { ntfyAuth } from '../..';

const encodeToRFC2047 = (text: string) => {
  return `=?UTF-8?B?${Buffer.from(text, 'utf-8').toString('base64')}?=`;
};

export const sendNotification = createAction({
  auth: ntfyAuth,
  name: 'send_notification',
  displayName: 'Send Notification',
  description: 'Send a notification to ntfy',
  props: {
    topic: Property.ShortText({
      displayName: 'Topic',
      description: 'The topic/channel to send the notification to, e.g. test1',
      required: true,
    }),
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
    priority: Property.ShortText({
      displayName: 'Priority',
      description:
        'The priority of the notification (1-5). 1 is lowest priority.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The tags for the notification.',
      required: false,
    }),
    icon: Property.ShortText({
      displayName: 'Icon',
      description:
        'The absolute URL to your icon, e.g. https://example.com/communityIcon_xnt6chtnr2j21.png',
      required: false,
    }),
    actions: Property.LongText({
      displayName: 'Actions',
      description:
        'Add Action buttons to notifications, see https://docs.ntfy.sh/publish/#action-buttons',
      required: false,
    }),
    click: Property.ShortText({
      displayName: 'Click',
      description:
        'You can define which URL to open when a notification is clicked, see https://docs.ntfy.sh/publish/#click-action',
      required: false,
    }),
    delay: Property.ShortText({
      displayName: 'Delay',
      description:
        "Let ntfy send messages at a later date, e.g. 'tomorrow, 10am', see https://docs.ntfy.sh/publish/#scheduled-delivery",
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const baseUrl = auth.base_url.replace(/\/$/, '');
    const accessToken = auth.access_token;

    const topic = propsValue.topic;
    let title = propsValue.title;
    let message = propsValue.message;
    title = encodeToRFC2047(title as string);
    message = encodeToRFC2047(message as string);
    const priority = propsValue.priority;
    const tags = propsValue.tags;
    const icon = propsValue.icon;
    const actions = propsValue.actions;
    const click = propsValue.click;
    const delay = propsValue.delay;

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/${topic}`,
      ...(accessToken && {
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
      }),
      headers: {
        'X-Message': message,
        'X-Title': title,
        'X-Priority': priority,
        'X-Tags': tags?.join(','),
        'X-Icon': icon,
        'X-Actions': actions,
        'X-Click': click,
        'X-Delay': delay,
      },
    });
  },
});
