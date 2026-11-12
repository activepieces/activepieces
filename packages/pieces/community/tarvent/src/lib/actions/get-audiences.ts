import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const getAudiences = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_audiences',
  classification: 'SEARCH',
  displayName: 'Find Audience',
  description: 'Finds audiences by name or tags.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Tarvent audiences whose name contains the given text and/or that have any of the given comma-separated tags; empty filters return all audiences. Returns up to 50 per call with totalCount, hasMore and nextCursor (pass it back as Cursor for more). Use to get an audience ID. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.audiencePage,
  props: {
    name: Property.ShortText({ displayName: 'Audience name', description: 'Find audiences whose name contains this text.', required: false }),
    tags: Property.LongText({ displayName: 'Audience tags', description: 'Find audiences with any of these tags. Separate multiple tags with a comma.', required: false }),
    limit: tarventCommon.limit,
    cursor: tarventCommon.cursor,
  },
  async run(context) {
    return tarventClient.listPage({
      auth: context.auth.props,
      operation: 'FindAudiences',
      field: 'audiences',
      selection: tarventClient.fields.audience,
      argDefs: ', $where: AudienceInfoFilterInput',
      args: ', where: $where',
      variables: { where: tarventClient.audienceWhere({ name: context.propsValue.name, tags: context.propsValue.tags }) },
      first: tarventCommon.pageLimit(context.propsValue.limit),
      after: tarventCommon.trimmed(context.propsValue.cursor),
      withTotalCount: true,
    });
  },
});
