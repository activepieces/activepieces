import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';

export const findMessage = createAction({
  auth: timelinesAiAuth,
  name: 'findMessage',
  displayName: 'Find Message',
  description: 'Lookup a message by its WhatsApp message ID.',
  props: {
    message_uid: Property.ShortText({
      displayName: 'Message UID',
      description: 'The unique identifier of the message to find.',
      required: true,
    }),
  },
  async run({ auth: apiKey, propsValue: { message_uid } }) {
    const response = await timelinesAiCommon.getMessage({
      apiKey: apiKey as string,
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
