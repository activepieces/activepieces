import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth } from '../common/auth';
import { timelinesAiClient } from '../common/client';
import { FindChatRequest } from '../common/types';

export const findChatAction = createAction({
  auth: timelinesAiAuth,
  name: 'find_chat',
  displayName: 'Find Chat',
  description:
    'Finds a chat by a specific criterion like phone number, name, or ID.',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'The field to search for a chat by.',
      required: true,
      options: {
        options: [
          { label: 'Chat ID', value: 'chat_id' },
          { label: 'Phone Number', value: 'phone' },
          { label: 'Contact Name', value: 'name' },
          { label: 'Label', value: 'label' },
        ],
      },
    }),
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'The value to search for.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { searchBy, searchTerm } = propsValue;
    const params: FindChatRequest = {};
    if (searchBy === 'chat_id') {
      params.chat_id = parseInt(searchTerm, 10);
    } else if (searchBy === 'phone') {
      params.phone = searchTerm;
    } else if (searchBy === 'name') {
      params.name = searchTerm;
    } else if (searchBy === 'label') {
      params.label = searchTerm;
    }
    const chats = await timelinesAiClient.findChat(auth, params);
    return chats;
  },
});
