import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient } from '../common/client';
import { ntfyProps } from '../common/props';
import { sendNotificationActionOutputSchema } from '../output-schemas';

export const sendNotification = createAction({
  auth: ntfyAuth,
  name: 'send_notification',
  classification: 'WRITE',
  displayName: 'Send Notification',
  description: 'Send a notification to ntfy',
  audience: 'human',
  aiMetadata: { description: 'Publishes a push notification to a ntfy topic using ntfy\'s header format, optionally with a title, priority, tags, icon, click URL, action buttons, attachment URL, Markdown, email, sequence ID or scheduled delay. Agents should prefer Publish Message (ntfy_publish_message), which takes typed fields. Not idempotent: each call sends a new notification.', idempotent: false },
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
    attach: ntfyProps.attach(),
    filename: ntfyProps.filename(),
    markdown: ntfyProps.markdown(),
    email: ntfyProps.email(),
    call: ntfyProps.call(),
    sequence_id: ntfyProps.publishSequenceId(),
    cache: Property.StaticDropdown({
      displayName: 'Server Cache',
      description:
        'Leave empty to let the server cache the message (default), so it can be fetched later. "Do not cache" delivers it only to clients connected right now.',
      required: false,
      options: { options: [{ label: 'Do not cache', value: 'no' }] },
    }),
    firebase: Property.StaticDropdown({
      displayName: 'Firebase',
      description:
        'Leave empty to also push through Firebase (default, needed for instant delivery on Google Play Android apps). "Do not forward" skips Firebase.',
      required: false,
      options: { options: [{ label: 'Do not forward to Firebase', value: 'no' }] },
    }),
  },
  outputSchema: sendNotificationActionOutputSchema,
  async run({ auth, propsValue }) {
    const baseUrl = auth.props.base_url.replace(/\/$/, '');
    const accessToken = auth.props.access_token;

    const topic = propsValue.topic;

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/${topic}`,
      ...(accessToken && {
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
      }),
      headers: ntfyClient.buildSendNotificationHeaders({
        message: propsValue.message,
        title: propsValue.title,
        priority: propsValue.priority,
        tags: propsValue.tags,
        icon: propsValue.icon,
        actions: propsValue.actions,
        click: propsValue.click,
        delay: propsValue.delay,
        attach: propsValue.attach,
        filename: propsValue.filename,
        markdown: propsValue.markdown,
        email: propsValue.email,
        call: propsValue.call,
        sequence_id: propsValue.sequence_id,
        cache: propsValue.cache,
        firebase: propsValue.firebase,
      }),
    });
  },
});
