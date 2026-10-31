import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListUsersOutputSchema } from '../../../output-schemas';

const MAX_LIMIT = 999;
const DEFAULT_LIMIT = 100;

export const listUsers = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_users',
  outputSchema: microsoftTeamsListUsersOutputSchema,
  displayName: 'List Users',
  description: 'Lists users in the organization, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists the organization's users with each user ID, display name, mail and user principal name, one page at a time; pass @odata.nextLink back as Next Page Link for the next page. Use Filter to find someone, for example startswith(displayName,'Ann') or mail eq 'ann@contoso.com'.",
    idempotent: true,
  },
  props: {
    filter: Property.ShortText({
      displayName: 'Filter',
      description: "An OData $filter on user properties, for example startswith(displayName,'Ann') or mail eq 'ann@contoso.com'.",
      required: false,
    }),
    limit: microsoftTeamsAiProps.limit({ max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT }),
    nextLink: microsoftTeamsAiProps.nextLink(),
  },
  async run(context) {
    const { filter, limit, nextLink } = context.propsValue;
    return await microsoftTeamsClient.list({
      auth: context.auth,
      path: '/users',
      page: { limit, max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT },
      filter,
      nextLink,
    });
  },
});
