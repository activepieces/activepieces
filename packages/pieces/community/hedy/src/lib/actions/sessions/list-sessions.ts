import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient } from '../../common/client';
import { commonProps } from '../../common/props';
import { topicDropdown } from '../../common/load-options';
import { Session } from '../../common/types';
import { assertLimit } from '../../common/validation';

export const listSessions = createAction({
  auth: hedyAuth,
  name: 'list-sessions',
  displayName: 'List Sessions',
  description: 'Retrieve multiple sessions with optional topic filtering and pagination.',
  audience: 'both',
  aiMetadata: {
    description: 'List Hedy meeting sessions, optionally filtered to a single topic. Use to discover sessions or find a session ID when you do not already have one; leave the topic filter empty to fetch across all topics. Set Return All to page through every result, otherwise results are capped by the limit. Read-only and idempotent.',
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

    return client.paginate<Session>('/sessions', {
      returnAll: Boolean(returnAll),
      limit: assertLimit(limit),
      format,
      topicId,
      after,
      before,
    });
  },
});
