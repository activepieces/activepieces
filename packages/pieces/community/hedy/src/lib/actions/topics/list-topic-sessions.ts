import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { HedyApiClient } from '../../common/client';
import { commonProps } from '../../common/props';
import { PaginatedResponse, Session } from '../../common/types';
import { assertLimit } from '../../common/validation';

function toSessionArray(result: unknown): Session[] {
  if (Array.isArray(result)) {
    return result as Session[];
  }

  if (result && typeof result === 'object' && 'data' in result) {
    const data = (result as PaginatedResponse<Session>).data;
    if (Array.isArray(data)) {
      return data;
    }
  }

  return [];
}

export const listTopicSessions = createAction({
  auth: hedyAuth,
  name: 'list-topic-sessions',
  displayName: 'List Topic Sessions',
  description: 'Retrieve sessions associated with a specific topic.',
  props: {
    topicId: commonProps.topicId,
    returnAll: commonProps.returnAll,
    limit: commonProps.limit,
  },
  async run(context) {
    const topicId = context.propsValue.topicId as string;
    const client = new HedyApiClient(context.auth as string);
    const { returnAll, limit } = context.propsValue as {
      returnAll?: boolean;
      limit?: number;
    };

    const response = await client.request<Session[]>({
      method: HttpMethod.GET,
      path: `/topics/${topicId}/sessions`,
    });

    const sessions = toSessionArray(response);

    if (!returnAll) {
      const limited = assertLimit(limit);
      return limited ? sessions.slice(0, limited) : sessions.slice(0, 50);
    }

    return sessions;
  },
});
