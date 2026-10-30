import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListTeamsOutputSchema } from '../../../output-schemas';

const MAX_LIMIT = 999;
const DEFAULT_LIMIT = 50;

export const listTeams = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_teams',
  outputSchema: microsoftTeamsListTeamsOutputSchema,
  displayName: 'List Teams',
  description: 'Lists teams in the organization, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists teams across the whole organization, not only the ones the signed-in user belongs to, one page at a time; pass @odata.nextLink back as Next Page Link for the next page. Use List Joined Teams for the user\'s own teams.',
    idempotent: true,
  },
  props: {
    filter: Property.ShortText({
      displayName: 'Filter',
      description: "An OData $filter on team properties, for example startswith(displayName, 'Sales').",
      required: false,
    }),
    limit: microsoftTeamsAiProps.limit({ max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT }),
    nextLink: microsoftTeamsAiProps.nextLink(),
  },
  async run(context) {
    const { filter, limit, nextLink } = context.propsValue;
    return await microsoftTeamsClient.list({
      auth: context.auth,
      path: '/teams',
      page: { limit, max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT },
      filter,
      nextLink,
    });
  },
});
