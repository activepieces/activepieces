import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { crispAuth } from '../../index';

interface CrispAuth {
  identifier: string;
  key: string;
}

export const changeConversationState = createAction({
  auth: crispAuth,
  name: 'changeConversationState',
  displayName: 'Change Conversation State',
  description: 'Update the state of a conversation (resolved, unresolved, or pending)',
  props: {
    website_id: Property.ShortText({
      displayName: 'Website ID',
      description: 'The website identifier',
      required: true,
    }),
    session_id: Property.ShortText({
      displayName: 'Session ID',
      description: 'The conversation session identifier',
      required: true,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      description: 'The new state of the conversation',
      required: true,
      options: {
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Unresolved', value: 'unresolved' },
          { label: 'Resolved', value: 'resolved' },
        ],
      },
    }),
  },
  async run(context) {
    const { website_id, session_id, state } = context.propsValue;
    const auth = context.auth as CrispAuth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `https://api.crisp.chat/v1/website/${website_id}/conversation/${session_id}/state`,
      headers: {
        'X-Crisp-Tier': 'plugin',
        'Authorization': `Basic ${Buffer.from(
          `${auth.identifier}:${auth.key}`
        ).toString('base64')}`,
      },
      body: {
        state,
      },
    });

    if (response.body.error) {
      throw new Error(response.body.reason || 'Failed to change conversation state');
    }

    return {
      success: true,
      message: 'Conversation state updated successfully',
      state,
    };
  },
});
