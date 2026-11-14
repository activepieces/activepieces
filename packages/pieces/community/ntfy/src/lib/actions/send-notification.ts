import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient } from '../common/client';
import { ntfyProps, TOPIC_DESCRIPTIONS } from '../common/props';
import { sendNotificationActionOutputSchema } from '../output-schemas';

export const sendNotification = createAction({
  auth: ntfyAuth,
  name: 'send_notification',
  classification: 'WRITE',
  displayName: 'Send Notification',
  description: 'Send a push notification to a ntfy topic.',
  audience: 'human',
  aiMetadata: { description: 'Publishes a push notification to a ntfy topic using ntfy\'s header format, optionally with a title, priority, tags, icon, click URL, action buttons, attachment URL, Markdown, email, sequence ID or scheduled delay. Agents should prefer Publish Message (ntfy_publish_message), which takes typed fields. Not idempotent: each call sends a new notification.', idempotent: false },
  props: {
    topic: ntfyProps.topic({ description: TOPIC_DESCRIPTIONS.publish }),
    title: ntfyProps.title(),
    message: ntfyProps.requiredMessage('The notification body.'),
    markdown: ntfyProps.markdown(),
    priority: Property.ShortText({
      displayName: 'Priority',
      description: 'From 1 (min) to 5 (max). Empty: default (3).',
      placeholder: '3',
      required: false,
    }),
    icon: ntfyProps.icon(),
    tags: ntfyProps.tags(),
    click: ntfyProps.click(),
    actions: Property.LongText({
      displayName: 'Action Buttons',
      description:
        'Up to 3 buttons (view, http, broadcast, copy) as a JSON array, e.g. [{"action":"view","label":"Open","url":"https://example.com"}]. See docs.ntfy.sh/publish/#action-buttons',
      required: false,
    }),
    attach: ntfyProps.attach(),
    filename: ntfyProps.filename(),
    delay: ntfyProps.delay(),
    email: ntfyProps.email(),
    call: ntfyProps.call(),
    sequence_id: ntfyProps.publishSequenceId({ advanced: true }),
    cache: Property.StaticDropdown({
      displayName: 'Server Cache',
      description:
        'Empty: cached so it can be fetched later. "Do not cache" reaches only clients online now.',
      required: false,
      advanced: true,
      options: { options: [{ label: 'Do not cache', value: 'no' }] },
    }),
    firebase: Property.StaticDropdown({
      displayName: 'Firebase',
      description:
        'Empty: also push through Firebase, needed for instant Google Play Android delivery.',
      required: false,
      advanced: true,
      options: { options: [{ label: 'Do not forward to Firebase', value: 'no' }] },
    }),
  },
  propertyGroups: [
    { key: 'destination', display: 'section', label: 'Send to', icon: 'send', props: ['topic'] },
    { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['title', 'message', 'markdown'] },
    { key: 'appearance', display: 'section', label: 'Appearance', icon: 'sliders', props: ['priority', 'icon', 'tags', 'click', 'actions'] },
    { key: 'attachment', display: 'section', label: 'Attachment', icon: 'paperclip', props: ['attach', 'filename'] },
    { key: 'delivery', display: 'section', label: 'Delivery', icon: 'calendar', props: ['delay', 'email', 'call'] },
  ],
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
