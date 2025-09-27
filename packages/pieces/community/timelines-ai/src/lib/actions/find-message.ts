import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth } from '../common/auth';
import { timelinesAiClient } from '../common/client';

export const findMessageAction = createAction({
  auth: timelinesAiAuth,
  name: 'find_message',
  displayName: 'Find Message',
  description: 'Finds a specific message by its unique ID (UID).',
  props: {
    message_uid: Property.ShortText({
      displayName: 'Message UID',
      description:
        'The unique identifier of the message (e.g., from a trigger or another step).',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { message_uid } = propsValue;
    const response = await timelinesAiClient.getMessageById(auth, message_uid);
    return response.data;
  },
});
