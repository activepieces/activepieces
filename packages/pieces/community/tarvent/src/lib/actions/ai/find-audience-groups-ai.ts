import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../auth';
import { tarventOperations } from '../../common/operations';
import { tarventOutputSchemas } from '../../output-schemas';

export const findAudienceGroupsAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_find_audience_groups_ai',
  classification: 'SEARCH',
  displayName: 'Find Audience Groups (AI)',
  description: 'Finds static groups in an audience by name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches the static groups of one Tarvent audience whose name contains the given text (empty returns all), up to 50 per call with totalCount, hasMore and nextCursor. Use to get a group ID. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.audienceGroupPage,
  props: {
    audienceId: Property.ShortText({ displayName: 'Audience ID', description: 'The Tarvent audience ID (from Find Audience).', required: true }),
    name: Property.ShortText({ displayName: 'Name contains', description: 'Text the group name contains.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Results per page, 1-50 (default 50).', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'nextCursor from the previous page.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    return tarventOperations.findAudienceGroups({ auth: context.auth.props, audienceId: p.audienceId, name: p.name, limit: p.limit, cursor: p.cursor });
  },
});
