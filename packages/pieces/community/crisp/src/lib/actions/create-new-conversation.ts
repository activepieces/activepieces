import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { crispAuth } from '../../index';

interface CrispAuth {
  identifier: string;
  key: string;
}

export const createNewConversation = createAction({
  auth: crispAuth,
  name: 'createNewConversation',
  displayName: 'Create New Conversation',
  description: 'Create a new conversation in Crisp. The conversation will not be visible in your Crisp Inbox until a message is sent with a user from value.',
  props: {
    website_id: Property.ShortText({
      displayName: 'Website ID',
      description: 'The website identifier',
      required: true,
    }),
  },
  async run(context) {
    const { website_id } = context.propsValue;
    const auth = context.auth as CrispAuth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.crisp.chat/v1/website/${website_id}/conversation`,
      headers: {
        'X-Crisp-Tier': 'plugin',
        'Authorization': `Basic ${Buffer.from(
          `${auth.identifier}:${auth.key}`
        ).toString('base64')}`,
      },
    });

    if (response.body.error) {
      throw new Error(response.body.reason || 'Failed to create conversation');
    }

    return {
      session_id: response.body.data.session_id,
      success: true,
      message: 'Conversation created successfully'
    };
  },
});
