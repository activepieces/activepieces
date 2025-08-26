import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationIdDropdown, userIdDropdown } from '../common/props';

export const addNote = createAction({
  auth: helpScoutAuth,
  name: 'add_note',
  displayName: 'Add Note',
  description: 'Adds a note to a conversation.',
  props: {
    conversationId: conversationIdDropdown,
    text: Property.LongText({
      displayName: 'Note Text',
      required: true,
    }),
    userId: userIdDropdown('User'),
  },
  async run({ auth, propsValue }) {
    const payload: Record<string, any> = {
      text: propsValue.text,
      ...(propsValue.userId && { user: Number(propsValue.userId) }),
    };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });
    const response = await helpScoutApiRequest({
      method: HttpMethod.POST,
      url: `/conversations/${propsValue.conversationId}/notes`,
      auth,
      body: payload,
    });

    const noteId = response.headers?.['resource-id'];

    return {
      id: noteId,
    };
  },
});
