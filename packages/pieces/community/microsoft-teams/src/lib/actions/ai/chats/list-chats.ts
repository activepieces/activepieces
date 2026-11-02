import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListChatsOutputSchema } from '../../../output-schemas';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export const listChats = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_chats',
  outputSchema: microsoftTeamsListChatsOutputSchema,
  displayName: 'List Chats',
  description: "Lists the signed-in user's chats, one page at a time.",
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists the signed-in user's one-on-one, group and meeting chats with each chat ID, topic and type, one page at a time; pass @odata.nextLink back as Next Page Link for the next page. Use List Chat Members to see who is in a chat.",
    idempotent: true,
  },
  props: {
    limit: microsoftTeamsAiProps.limit({ max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT }),
    nextLink: microsoftTeamsAiProps.nextLink(),
  },
  async run(context) {
    const { limit, nextLink } = context.propsValue;
    return await microsoftTeamsClient.list({
      auth: context.auth,
      path: '/chats',
      page: { limit, max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT },
      nextLink,
    });
  },
});
