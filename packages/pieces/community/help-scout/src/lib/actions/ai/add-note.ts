import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const aiAddNote = createAction({
  auth: helpScoutAuth,
  name: 'ai_add_note',
  classification: 'WRITE',
  displayName: 'Add Note (by ID)',
  description: 'Adds an internal note to a conversation identified by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds an internal note, visible only to teammates and never emailed to the customer, to a Help Scout conversation. Use for agent-only context; use Send Reply to answer the customer. Not idempotent: each call appends another note.',
    idempotent: false,
  },
  outputSchema: helpScoutOutputSchemas['createdId'],
  props: {
    conversationId: Property.Number({
      displayName: 'Conversation ID',
      description: 'Numeric Help Scout conversation ID (the id field from Search Conversations, not the #number shown in the UI).',
      required: true,
    }),
    text: Property.LongText({ displayName: 'Note Text', description: 'HTML is allowed.', required: true }),
    userId: Property.Number({ displayName: 'Author User ID', description: 'Defaults to the connected user.', required: false }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { text: propsValue.text };
    const user = helpScoutApi.optionalNumber(propsValue.userId);
    if (user !== undefined) body['user'] = user;
    const response = await helpScoutApi.request({
      method: HttpMethod.POST,
      path: `/conversations/${helpScoutApi.encodeId(propsValue.conversationId)}/notes`,
      auth,
      body,
    });
    return { id: helpScoutApi.getResourceId(response.headers) };
  },
});
