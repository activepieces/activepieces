import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';

export const findMessage = createAction({
  auth: timelinesAiAuth,
  name: 'findMessage',
  classification: 'READ',
  displayName: 'Find Message',
  description: 'Gets a message by its UID.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves a single TimelinesAI WhatsApp message by its message UID. Use to fetch the full content and metadata of a known message. Requires the exact message_uid. Read-only and idempotent.', idempotent: true },
  props: {
    message_uid: Property.ShortText({
      displayName: 'Message UID',
      description: 'Found as message_uid in trigger and send-step output.',
      placeholder: 'c7ec509d-0171-1ead-a84b-c6943a644768',
      required: true,
    }),
  },
  async run({ auth: apiKey, propsValue: { message_uid } }) {
    const response = await timelinesAiCommon.getMessage({
      apiKey: apiKey,
      message_uid,
    });
    if (response.status !== 'ok') {
      throw new Error(
        `Error fetching message: ${response.message || 'Unknown error'}`
      );
    }
    return response.data;
  },
});
