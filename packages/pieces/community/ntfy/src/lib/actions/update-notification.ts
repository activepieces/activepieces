import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient, NtfyMessage } from '../common/client';
import { ntfyProps } from '../common/props';
import { publishedMessageOutputSchema } from '../output-schemas';

export const updateNotification = createAction({
  auth: ntfyAuth,
  name: 'update_notification',
  classification: 'WRITE',
  displayName: 'Update Notification',
  description:
    'Replace a notification already sent (or still scheduled) with new content, e.g. a progress update. Fields left empty are not copied from the original. Requires ntfy server v2.16.0 or later.',
  audience: 'both',
  aiMetadata: {
    description:
      'Replaces an earlier notification on subscribed phones and web apps by publishing a new message with the same sequence ID; if the original is still scheduled, the server deletes it and schedules this one instead. The new message fully replaces the old one, so resend every field that should stay (title, tags, priority). Use for progress or status updates; use Publish Message for a new alert. Needs ntfy server v2.16.0+. Not idempotent: each call appends a new message to the topic.',
    idempotent: false,
  },
  props: {
    topic: ntfyProps.topic(),
    sequence_id: ntfyProps.sequenceId(
      'The notification to replace: the Message ID returned when it was sent, or the Sequence ID you gave it, e.g. backup-job-42.'
    ),
    message: ntfyProps.requiredMessage('The new notification body, up to 4,096 bytes, e.g. "Download 50% done".'),
    title: ntfyProps.title(),
    priority: ntfyProps.priority(),
    tags: ntfyProps.tags(),
    click: ntfyProps.click(),
    icon: ntfyProps.icon(),
    attach: ntfyProps.attach(),
    filename: ntfyProps.filename(),
    markdown: ntfyProps.markdown(),
    actions: ntfyProps.actions(),
    delay: ntfyProps.delay(),
  },
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
