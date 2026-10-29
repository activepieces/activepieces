import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { buildMessageBody } from '../common';
import { sendNotificationActionOutputSchema } from '../output-schemas';

export const sendNotification = createAction({
  auth: pushoverAuth,
  name: 'send_notification',
  classification: 'WRITE',
  displayName: 'Send Notification',
  description: 'Send a push notification to a Pushover user or group.',
  audience: 'human',
  aiMetadata: {
    description: 'Sends a push notification through Pushover to the device(s) tied to the configured user/group key. Use to alert a person or group on their phone/desktop. The message body is required; optional priority (-2 to 2) controls urgency, and emergency priority (2) additionally requires retry and expire values. Not idempotent: each call delivers a new notification.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['recipient_info', 'title', 'message', 'html'],
    },
    {
      key: 'urgency',
      display: 'section',
      label: 'Urgency',
      icon: 'sliders',
      props: ['priority', 'emergency_info', 'retry', 'expire'],
    },
    {
      key: 'link',
      display: 'section',
      label: 'Link',
      icon: 'paperclip',
      props: ['url', 'url_title'],
    },
  ],
  props: {
    recipient_info: Property.MarkDown({
      value: 'Sent to the user or group key on your Pushover connection.',
      variant: MarkdownVariant.INFO,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Shown above the message. Empty uses your app name.',
      placeholder: 'Backup finished',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The notification text, up to 1024 characters.',
      placeholder: 'The nightly backup completed in 4 minutes.',
      required: true,
    }),
    html: Property.Checkbox({
      displayName: 'Enable HTML',
      description: 'Render <b>, <i>, <u> and <a href> tags in the message.',
      required: false,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description: '-2 no alert, -1 quiet, 0 normal, 1 high, 2 emergency.',
      required: false,
    }),
    emergency_info: Property.MarkDown({
      value:
        'The two fields below apply only at priority 2, which repeats the alert until it is acknowledged. Both are then required.',
      variant: MarkdownVariant.INFO,
    }),
    retry: Property.Number({
      displayName: 'Repeat Every',
      description: 'Seconds between repeats, at least 30.',
      required: false,
      width: 'half',
    }),
    expire: Property.Number({
      displayName: 'Keep Repeating For',
      description: 'Seconds, up to 10800 (3 hours).',
      required: false,
      width: 'half',
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'A link shown under the message.',
      placeholder: 'https://example.com',
      required: false,
      width: 'half',
    }),
    url_title: Property.ShortText({
      displayName: 'URL Title',
      description: 'Text shown instead of the URL.',
      placeholder: 'Open dashboard',
      required: false,
      width: 'half',
    }),
    device: Property.ShortText({
      displayName: 'Device',
      description:
        'Send only to this device instead of all. Separate several with commas.',
      placeholder: 'iphone',
      required: false,
      advanced: true,
    }),
    timestamp: Property.ShortText({
      displayName: 'Timestamp',
      description:
        'Unix time in seconds to show instead of the time it was sent.',
      placeholder: '1767225600',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: sendNotificationActionOutputSchema,
  async run({ auth, propsValue }) {
    const body = buildMessageBody({
      apiToken: auth.props.api_token,
      userKey: auth.props.user_key,
      message: propsValue.message,
      title: propsValue.title,
      html: propsValue.html,
      priority: propsValue.priority,
      retry: propsValue.retry,
      expire: propsValue.expire,
      url: propsValue.url,
      urlTitle: propsValue.url_title,
      timestamp: propsValue.timestamp,
      device: propsValue.device,
    });

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.pushover.net/1/messages.json',
      body,
    });
  },
});
