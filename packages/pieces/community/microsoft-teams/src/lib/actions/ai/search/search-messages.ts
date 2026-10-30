import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsSearchMessagesOutputSchema } from '../../../output-schemas';

const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 25;

export const searchMessages = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_search_messages',
  outputSchema: microsoftTeamsSearchMessagesOutputSchema,
  displayName: 'Search Messages',
  description: 'Searches the chat and channel messages the signed-in user can read.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Full-text search over the Teams chat and channel messages the signed-in user can read, returning matching messages with a summary and their chat or channel IDs. Page with Offset: when moreResultsAvailable is true, call again with Offset increased by Limit.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Keywords to search for. Supports KQL, for example from:alex budget.',
      required: true,
    }),
    limit: microsoftTeamsAiProps.limit({ max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'How many results to skip, for the next page. Defaults to 0.',
      required: false,
    }),
  },
  async run(context) {
    const { query, limit, offset } = context.propsValue;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() =>
      client.api('/search/query').post({
        requests: [
          {
            entityTypes: ['chatMessage'],
            query: { queryString: query },
            from: offset ?? 0,
            size: Math.min(Math.max(Math.trunc(limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT),
          },
        ],
      }),
    );
  },
});
