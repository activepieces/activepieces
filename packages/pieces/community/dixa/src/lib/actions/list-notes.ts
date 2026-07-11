import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dixaAuth } from '../auth';
import { dixaClient } from '../common/client';
import { conversationIdProp, endUserIdProp } from '../common/props';

export const listNotes = createAction({
  auth: dixaAuth,
  name: 'list_notes',
  displayName: 'List Notes',
  description: 'Lists internal notes from a conversation.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve all internal notes attached to a Dixa conversation.',
    idempotent: true,
  },
  props: {
    endUserId: endUserIdProp(),
    conversationId: conversationIdProp,
  },
  async run({ auth, propsValue }) {
    const { conversationId } = propsValue;

    return await dixaClient.makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/conversations/${conversationId}/notes`
    );
  },
});
