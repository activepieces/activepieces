import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient } from '../../common/client';
import { commonProps } from '../../common/props';
import { Session } from '../../common/types';
import { assertIdPrefix, assertLimit } from '../../common/validation';

interface TopicSessionsPage {
  sessions?: Session[];
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  };
}

function extractSessions(result: unknown): { sessions: Session[]; pagination?: TopicSessionsPage['pagination'] } {
  if (Array.isArray(result)) {
    return { sessions: result as Session[] };
  }

  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;

    // Handle { data: { sessions, pagination } } wrapper
    const inner = (obj['data'] ?? obj) as Record<string, unknown>;

    if (Array.isArray(inner['sessions'])) {
      return {
        sessions: inner['sessions'] as Session[],
        pagination: inner['pagination'] as TopicSessionsPage['pagination'],
      };
    }

    // Fallback: { data: Session[] }
    if (Array.isArray(inner['data'])) {
      return { sessions: inner['data'] as Session[] };
    }
  }

  return { sessions: [] };
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
    const topicId = assertIdPrefix(context.propsValue['topicId'] as string, 'topic_', 'Topic ID');
    const client = createClient(context.auth);
    const { returnAll, limit } = context.propsValue as {
      returnAll?: boolean;
      limit?: number;
    };

    const validLimit = assertLimit(limit);
    const pageSize = 50;

    if (returnAll) {
      const allSessions: Session[] = [];
      let startAfter: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const queryParams: Record<string, unknown> = { limit: pageSize };
        if (startAfter) queryParams['startAfter'] = startAfter;

        const response = await client.request<unknown>({
          method: HttpMethod.GET,
          path: `/topics/${topicId}/sessions`,
          queryParams,
        });

        const page = extractSessions(response);
        allSessions.push(...page.sessions);

        hasMore = page.pagination?.hasMore ?? false;
        startAfter = page.pagination?.nextCursor;

        if (allSessions.length >= 1000) break;
      }

      return allSessions;
    }

    const queryParams: Record<string, unknown> = { limit: validLimit ?? pageSize };
    const response = await client.request<unknown>({
      method: HttpMethod.GET,
      path: `/topics/${topicId}/sessions`,
      queryParams,
    });

    const page = extractSessions(response);
    const cap = validLimit ?? 50;
    return page.sessions.slice(0, cap);
  },
});
