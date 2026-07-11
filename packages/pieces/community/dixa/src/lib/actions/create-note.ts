import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dixaAuth } from '../auth';
import { dixaClient } from '../common/client';
import { conversationIdProp, endUserIdProp } from '../common/props';

export const createNote = createAction({
  auth: dixaAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Creates an internal note for a conversation.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add an internal note to a Dixa conversation that is visible to agents but not the customer.',
    idempotent: false,
  },
  props: {
    endUserId: endUserIdProp(),
    conversationId: conversationIdProp,
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to create the note for.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { conversationId, message } = propsValue;

    return await dixaClient.makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      `/conversations/${conversationId}/notes`,
      {
        message,
      }
    );
  },
});
