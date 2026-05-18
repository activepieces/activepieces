import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';

export const findMessageStatus = createAction({
  auth: timelinesAiAuth,
  name: 'findMessageStatus',
  displayName: 'Find Message Status',
  description: 'Lookup a message’s delivery status by message ID.',
  props: {
    message_uid: Property.ShortText({
      displayName: 'Message UID',
      description: 'The unique identifier of the message to look up.',
      required: true,
    }),
  },
  async run({ auth: apiKey, propsValue: { message_uid } }) {
    const response = await timelinesAiCommon.getMessage({
      apiKey,
      message_uid,
    });
    if (response.status !== 'ok') {
      throw new Error(
        `Error fetching message: ${response.message || 'Unknown error'}`
      );
    }
    return response.data.status;
  },
});
