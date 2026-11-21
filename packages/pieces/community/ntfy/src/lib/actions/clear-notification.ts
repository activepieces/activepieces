import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient, NtfyMessage } from '../common/client';
import { ntfyProps, TOPIC_DESCRIPTIONS } from '../common/props';
import { sequenceEventOutputSchema } from '../output-schemas';

export const clearNotification = createAction({
  auth: ntfyAuth,
  name: 'clear_notification',
  classification: 'WRITE',
  displayName: 'Clear Notification',
  description: 'Mark a notification read and dismiss it everywhere. Needs ntfy v2.16+.',
  audience: 'both',
  aiMetadata: {
    description:
      'Marks a delivered notification as read and dismisses it from the notification drawer on subscribed clients, keeping it in their history. Use Delete Notification to remove it entirely or cancel a scheduled one. Needs ntfy server v2.16.0+; ntfy accepts any valid sequence ID, so a wrong ID is not reported. Idempotent: repeating it leaves the notification cleared.',
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
      method: HttpMethod.PUT,
      path: `/${topic}/${sequenceId}/clear`,
    });
    return response.body;
  },
});
