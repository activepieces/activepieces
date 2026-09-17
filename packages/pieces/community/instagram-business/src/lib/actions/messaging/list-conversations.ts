import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { listConversationsOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const listConversations = createAction({
  auth: instagramCommon.authentication,
  outputSchema: listConversationsOutputSchema,
  name: 'list_conversations',
  classification: 'READ',
  displayName: 'List Conversations',
  description: 'List Instagram direct message threads for the account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the Instagram direct message threads belonging to the connected professional account, newest activity first, with the participants and the time of the last message. Use it to find a conversation id before reading or replying to a thread. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
    limit: Property.Number({ displayName: 'Limit', required: false }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;
    const pageId = instagramCommon.requirePageId(page);

    const response = await instagramCommon.graphRequest<{
      data?: unknown[];
      paging?: { cursors?: { after?: string } };
    }>({
      method: HttpMethod.GET,
      resourceUri: `/${pageId}/conversations`,
      accessToken: page.accessToken,
      query: {
        platform: 'instagram',
        fields: 'id,updated_time,unread_count,message_count,participants',
        limit: propsValue.limit ?? 25,
      },
    });

    const conversations = response.data ?? [];
    return {
      conversations,
      count: conversations.length,
      next_cursor: response.paging?.cursors?.after,
    };
  },
});
