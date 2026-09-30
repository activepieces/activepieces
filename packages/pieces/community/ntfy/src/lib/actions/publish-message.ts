import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient, NtfyMessage } from '../common/client';
import { ntfyProps } from '../common/props';
import { publishedMessageOutputSchema } from '../output-schemas';

export const publishMessage = createAction({
  auth: ntfyAuth,
  name: 'ntfy_publish_message',
  classification: 'WRITE',
  displayName: 'Publish Message',
  description: 'Publish a notification to a ntfy topic with typed fields.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publishes a push notification to one ntfy topic as JSON: message, title, priority 1-5, tags, click URL, icon, attachment URL, Markdown, up to 3 action buttons, email or phone-call forwarding, a scheduled delay, and an optional sequence_id for later update/clear/delete. Use this to alert someone; use Update Notification to change one already sent. Not idempotent: each call publishes a new message.',
    idempotent: false,
  },
  props: {
    topic: ntfyProps.topic(),
    message: ntfyProps.optionalMessage(
      'Notification body, up to 4,096 bytes, e.g. "Backup finished in 4m 12s". ntfy uses "triggered" when empty (or "You received a file: <name>" with an attachment).'
    ),
    title: ntfyProps.title(),
    priority: Property.Number({
      displayName: 'Priority',
      description: 'Whole number 1 (min) to 5 (max, urgent). Leave empty for the default 3.',
      required: false,
    }),
    tags: ntfyProps.tags(),
    click: ntfyProps.click(),
    icon: ntfyProps.icon(),
    attach: ntfyProps.attach(),
    filename: ntfyProps.filename(),
    markdown: ntfyProps.markdown(),
    actions: ntfyProps.actions(),
    delay: ntfyProps.delay(),
    email: ntfyProps.email(),
    call: ntfyProps.call(),
    sequence_id: ntfyProps.publishSequenceId(),
    disable_cache: Property.Checkbox({
      displayName: 'Do Not Cache',
      description: 'Deliver only to clients connected right now; the message cannot be fetched later. Cannot be combined with Delay.',
      required: false,
      defaultValue: false,
    }),
    disable_firebase: Property.Checkbox({
      displayName: 'Do Not Forward to Firebase',
      description: 'Skip Firebase push (Google Play Android apps then only get it while connected).',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: publishedMessageOutputSchema,
  async run({ auth, propsValue }) {
    const body = ntfyClient.buildJsonPublishBody(propsValue);
    const response = await ntfyClient.request<NtfyMessage>({
      auth,
      method: HttpMethod.POST,
      path: '/',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    return response.body;
  },
});
