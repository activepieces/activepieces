import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth } from '../common/auth';
import { timelinesAiClient } from '../common/client';
import { timelinesAiProps } from '../common/props';
import { SendMessageToNewChatRequest } from '../common/types';

export const sendMessageToNewChatAction = createAction({
  auth: timelinesAiAuth,
  name: 'send_message_to_new_chat',
  displayName: 'Send Message to New Chat',
  description: 'Creates a new chat by sending a message to a phone number.',
  props: {
    whatsapp_account_phone: timelinesAiProps.whatsappAccountPhone,
    phone: Property.ShortText({
      displayName: "Recipient's Phone Number",
      description:
        "The recipient's phone number in international format (e.g., +14155552671).",
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'The content of the message to send.',
      required: true,
    }),
    label: Property.ShortText({
      displayName: 'Label',
      description: 'Assign a label to the new chat.',
      required: false,
    }),
    file_uid: Property.ShortText({
      displayName: 'File UID',
      description:
        'UID of a file previously uploaded to TimelinesAI to attach to the message.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const payload: SendMessageToNewChatRequest = {
      whatsapp_account_phone: propsValue.whatsapp_account_phone,
      phone: propsValue.phone,
      text: propsValue.text,
      label: propsValue.label,
      file_uid: propsValue.file_uid,
    };
    return await timelinesAiClient.sendMessageToNewChat(auth, payload);
  },
});
