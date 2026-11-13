import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { conversationIdDropdown, userIdDropdown } from '../common/props';
import { helpScoutOutputSchemas } from '../common/output-schemas';

export const addNote = createAction({
  auth: helpScoutAuth,
  name: 'add_note',
  classification: 'WRITE',
  displayName: 'Add Note',
  description: 'Adds a note to a conversation.',
  audience: 'human',
  outputSchema: helpScoutOutputSchemas['createdId'],
  props: {
    conversationId: conversationIdDropdown,
    text: Property.LongText({ displayName: 'Note Text', required: true }),
    userId: userIdDropdown('User'),
  },
  async run({ auth, propsValue }) {
    if (!propsValue.conversationId) {
      throw new Error('Select the conversation to add the note to.');
    }
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
