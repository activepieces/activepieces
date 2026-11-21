import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient, NtfyMessage } from '../common/client';
import { ntfyProps, TOPIC_DESCRIPTIONS } from '../common/props';
import { sequenceEventOutputSchema } from '../output-schemas';

export const deleteNotification = createAction({
  auth: ntfyAuth,
  name: 'delete_notification',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Notification',
  description: 'Remove a notification, or cancel a scheduled one. Needs ntfy v2.16+.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a notification by sequence ID: a scheduled message is removed from the server and never delivered, and a delivered one is removed from subscribed clients. Use Clear Notification to only mark it read. Needs ntfy server v2.16.0+; ntfy accepts any valid sequence ID, so a wrong ID is not reported. Idempotent: repeating it leaves the notification deleted.',
    idempotent: true,
  },
  props: {
    topic: ntfyProps.topic({ description: TOPIC_DESCRIPTIONS.existing }),
    sequence_id: ntfyProps.sequenceId({ description: 'Message ID or your own Sequence ID.' }),
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
