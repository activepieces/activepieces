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
  audience: 'both',
  aiMetadata: {
    description:
      'Adds an internal note (not visible to the customer) to an existing Help Scout conversation identified by conversation ID. Use for agent-only annotations rather than a customer-facing reply. Not idempotent — each call appends a new note.',
    idempotent: false,
  },
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
    };
    if(propsValue.userId) {
      payload['user'] = Number(propsValue.userId);
    }
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
