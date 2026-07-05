import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient } from '../../common/client';
import { commonProps } from '../../common/props';
import { topicDropdown } from '../../common/load-options';
import { Highlight } from '../../common/types';
import { assertLimit } from '../../common/validation';

export const listHighlights = createAction({
  auth: hedyAuth,
  name: 'list-highlights',
  displayName: 'List Highlights',
  description: 'Retrieve highlights with optional topic filtering and pagination.',
  audience: 'both',
  aiMetadata: {
    description: 'List highlights across Hedy sessions, optionally filtered to a single topic; leave the topic filter empty to fetch across all topics. Use to browse highlights when you do not have a specific session in mind (use List Session Highlights to scope to one session). Set Return All to page through everything, otherwise results are capped by the limit. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    returnAll: commonProps.returnAll,
    limit: commonProps.limit,
    format: commonProps.format,
    topicId: topicDropdown,
    after: commonProps.afterCursor,
    before: commonProps.beforeCursor,
  },
  async run(context) {
    const client = createClient(context.auth);
    const { returnAll, limit, format, topicId, after, before } = context.propsValue as {
      returnAll?: boolean;
      limit?: number;
      format?: 'standard' | 'zapier';
      topicId?: string;
      after?: string;
      before?: string;
    };

    return client.paginate<Highlight>('/highlights', {
      returnAll: Boolean(returnAll),
      limit: assertLimit(limit),
      format,
      topicId,
      after,
      before,
    });
  },
});
