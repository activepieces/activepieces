import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth } from '../common/auth';
import { timelinesAiClient } from '../common/client';

export const findMessageStatusAction = createAction({
  auth: timelinesAiAuth,
  name: 'find_message_status',
  displayName: 'Find Message Status',
  description:
    'Finds the status history (e.g., sent, delivered, read) for a specific message.',
  props: {
    message_uid: Property.ShortText({
      displayName: 'Message UID',
      description: 'The unique identifier of the message.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { message_uid } = propsValue;
    return await timelinesAiClient.getMessageStatusHistory(auth, message_uid);
  },
});
