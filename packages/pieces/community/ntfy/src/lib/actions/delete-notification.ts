import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient, NtfyMessage } from '../common/client';
import { ntfyProps } from '../common/props';
import { sequenceEventOutputSchema } from '../output-schemas';

export const deleteNotification = createAction({
  auth: ntfyAuth,
  name: 'delete_notification',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Notification',
  description:
    'Remove a notification from phones and the web app, or cancel a scheduled one before it is delivered. Requires ntfy server v2.16.0 or later.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a notification by sequence ID: a scheduled message is removed from the server and never delivered, and a delivered one is removed from subscribed clients. Use Clear Notification to only mark it read. Needs ntfy server v2.16.0+; ntfy accepts any valid sequence ID, so a wrong ID is not reported. Idempotent: repeating it leaves the notification deleted.',
    idempotent: true,
  },
  props: {
    topic: ntfyProps.topic(),
    sequence_id: ntfyProps.sequenceId(
      'The notification to delete or cancel: the Message ID returned when it was sent, or the Sequence ID you gave it, e.g. reminder-42.'
    ),
  },
  outputSchema: sequenceEventOutputSchema,
  async run({ auth, propsValue }) {
    const topic = ntfyClient.validateId({ value: propsValue.topic, label: 'Topic' });
    const sequenceId = ntfyClient.validateId({ value: propsValue.sequence_id, label: 'Sequence ID' });
    const response = await ntfyClient.request<NtfyMessage>({
      auth,
      method: HttpMethod.DELETE,
      path: `/${topic}/${sequenceId}`,
    });
    return response.body;
  },
});
