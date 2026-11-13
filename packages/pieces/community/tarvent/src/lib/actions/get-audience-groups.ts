import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventOperations } from '../common/operations';
import { tarventOutputSchemas } from '../output-schemas';

export const getAudienceGroups = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_audience_groups',
  classification: 'SEARCH',
  displayName: 'Find Audience Group',
  description: 'Finds static groups in an audience by name.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches the static (non-dynamic) groups of one Tarvent audience whose name contains the given text; an empty name returns all groups. Returns up to 50 per call with totalCount, hasMore and nextCursor (pass it back as Cursor for more). Use to get a group ID before adding contacts to it. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.audienceGroupPage,
  props: {
    audienceId: tarventCommon.audienceId(true, 'Audience to search.'),
    name: Property.ShortText({ displayName: 'Group name', description: 'Find groups whose name contains this text.', required: false }),
    limit: tarventCommon.limit,
    cursor: tarventCommon.cursor,
  },
  async run(context) {
    return tarventOperations.findAudienceGroups({ auth: context.auth.props, audienceId: context.propsValue.audienceId, name: context.propsValue.name, limit: context.propsValue.limit, cursor: context.propsValue.cursor });
  },
});
