import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient, NtfyMessage } from '../common/client';
import { ntfyProps, TOPIC_DESCRIPTIONS } from '../common/props';
import { publishedMessageOutputSchema } from '../output-schemas';

export const updateNotification = createAction({
  auth: ntfyAuth,
  name: 'update_notification',
  classification: 'WRITE',
  displayName: 'Update Notification',
  description: 'Replace a sent or scheduled notification with new content. Needs ntfy v2.16+.',
  audience: 'both',
  aiMetadata: {
    description:
      'Replaces an earlier notification on subscribed phones and web apps by publishing a new message with the same sequence ID; if the original is still scheduled, the server deletes it and schedules this one instead. The new message fully replaces the old one, so resend every field that should stay (title, tags, priority). Use for progress or status updates; use Publish Message for a new alert. Needs ntfy server v2.16.0+. Not idempotent: each call appends a new message to the topic.',
    idempotent: false,
  },
  props: {
    topic: ntfyProps.topic({ description: TOPIC_DESCRIPTIONS.existing, width: 'half' }),
    sequence_id: ntfyProps.sequenceId({ description: 'Message ID or your own Sequence ID.', width: 'half' }),
    replace_notice: Property.MarkDown({
      value: 'The new message replaces the old one completely. Fields you leave empty are not copied from it.',
      variant: MarkdownVariant.WARNING,
    }),
    message: ntfyProps.requiredMessage('The new notification body.'),
    title: ntfyProps.title(),
    markdown: ntfyProps.markdown(),
    priority: ntfyProps.priority(),
    icon: ntfyProps.icon(),
    tags: ntfyProps.tags(),
    click: ntfyProps.click(),
    actions: ntfyProps.actions(),
    attach: ntfyProps.attach(),
    filename: ntfyProps.filename(),
    delay: ntfyProps.delay(),
  },
  propertyGroups: [
    { key: 'target', display: 'section', label: 'Notification to replace', icon: 'inbox', props: ['topic', 'sequence_id'] },
    { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['replace_notice', 'message', 'title', 'markdown'] },
    { key: 'appearance', display: 'section', label: 'Appearance', icon: 'sliders', props: ['priority', 'icon', 'tags', 'click', 'actions'] },
    { key: 'attachment', display: 'section', label: 'Attachment', icon: 'paperclip', props: ['attach', 'filename'] },
    { key: 'delivery', display: 'section', label: 'Delivery', icon: 'calendar', props: ['delay'] },
  ],
  outputSchema: publishedMessageOutputSchema,
  async run({ auth, propsValue }) {
    const body = ntfyClient.buildJsonPublishBody({
      ...propsValue,
      sequence_id: ntfyClient.validateId({ value: propsValue.sequence_id, label: 'Sequence ID' }),
    });
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
