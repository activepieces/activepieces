import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../common/auth';

export const sendReply = createAction({
  name: 'send_reply',
  displayName: 'Send Reply',
  description: 'Send a message in an existing conversation (supports draft mode).',
  auth: helpScoutAuth,
  props: {
    conversationId: Property.Number({
      displayName: 'Conversation ID',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Message Body',
      required: true,
    }),
    draft: Property.Checkbox({
      displayName: 'Save as Draft',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const thread = {
      type: 'reply',
      body: propsValue['body'],
      state: propsValue['draft'] ? 'draft' : 'published',
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