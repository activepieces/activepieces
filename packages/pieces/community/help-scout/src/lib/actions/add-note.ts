import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../common/auth';

export const addNote = createAction({
  name: 'add_note',
  displayName: 'Add Note',
  description: 'Add an internal note to a conversation.',
  auth: helpScoutAuth,
  props: {
    conversationId: Property.Number({
      displayName: 'Conversation ID',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Note Body',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const thread = {
      type: 'note',
      body: propsValue['body'],
      state: 'published',
    };
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.helpscout.net/v2/conversations/${propsValue['conversationId']}/threads`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: thread,
    });
    return response.body;
  },
}); 