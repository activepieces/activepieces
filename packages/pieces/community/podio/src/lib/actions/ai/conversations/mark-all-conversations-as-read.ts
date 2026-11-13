import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';

export const markAllConversationsAsReadAction = createAction({
  auth: podioAuth,
  name: 'podio_mark_all_conversations_as_read',
  displayName: 'Mark All Conversations As Read',
  description: 'Marks all your conversations as read.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks every Podio conversation of the connected user as read. To mark a single one use Mark Conversation As Read.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: '/conversation/read' });
  },
});
