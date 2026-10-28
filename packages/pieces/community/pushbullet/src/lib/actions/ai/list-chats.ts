import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bushbulletAuth } from '../../common/auth';
import { pushbulletApi } from '../../common/client';
import { pushbulletOutputSchemas } from '../../common/output-schemas';

export const aiListChats = createAction({
  auth: bushbulletAuth,
  name: 'ai_list_chats',
  displayName: 'List Chats',
  description: 'Lists the contacts you have chats with.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: pushbulletOutputSchemas.listChats,
  aiMetadata: {
    description:
      'Lists the Pushbullet chats (contacts the account owner has pushed to or received from), each with the contact\'s email and name under "with". Use the email as the email target in Send Note or Send Link to reach that person.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await pushbulletApi.request<{ chats?: unknown[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/chats',
      queryParams: { active: 'true' },
    });
    return { chats: response.chats ?? [] };
  },
});
