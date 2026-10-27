import { createAction } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const listTags = createAction({
  auth: tarventAuth,
  name: 'tarvent_list_tags',
  classification: 'SEARCH',
  displayName: 'List Tags',
  description: 'Lists the tags used in your account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the tag names used in the Tarvent account with how often each is used, up to 50 per call with hasMore and nextCursor. Use to pick existing tag names before tagging contacts. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.tagPage,
  props: {
    limit: tarventCommon.limit,
    cursor: tarventCommon.cursor,
  },
  async run(context) {
    return tarventClient.listPage({
      auth: context.auth.props,
      operation: 'ListTags',
      field: 'tags',
      selection: 'name count type isSystem',
      first: tarventCommon.pageLimit(context.propsValue.limit),
      after: tarventCommon.trimmed(context.propsValue.cursor),
    });
  },
});
