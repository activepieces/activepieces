import { Property } from '@activepieces/pieces-framework';

function chatId() {
  return Property.ShortText({
    displayName: 'Chat ID',
    description:
      'The Tinko ID of the chat, 26 letters and numbers, for example 01JABCDEFGHJKMNPQRSTVWXYZ0. Map it from a Tinko trigger (chat_id) or from the output of a Send Message action.',
    required: true,
  });
}

export const tinkoChat = {
  chatId,
};
