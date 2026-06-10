import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient } from '../../common/client';
import { commonProps } from '../../common/props';
import { Highlight, PaginatedResponse } from '../../common/types';
import { assertIdPrefix, assertLimit } from '../../common/validation';

function toHighlightArray(result: unknown): Highlight[] {
  if (Array.isArray(result)) {
    return result as Highlight[];
  }

  if (result && typeof result === 'object' && 'data' in result) {
    const data = (result as PaginatedResponse<Highlight>).data;
    if (Array.isArray(data)) {
      return data;
    }
  }

  return [];
}

export const listSessionHighlights = createAction({
  auth: hedyAuth,
  name: 'list-session-highlights',
  displayName: 'List Session Highlights',
  description: 'Retrieve highlights for a specific session.',
  props: {
    sessionId: commonProps.sessionId,
    returnAll: commonProps.returnAll,
    limit: commonProps.limit,
  },
  async run(context) {
    const sessionId = assertIdPrefix(
      context.propsValue['sessionId'] as string,
      'sess_',
      'Session ID',
    );
    const client = createClient(context.auth);
    const { returnAll, limit } = context.propsValue as {
      returnAll?: boolean;
      limit?: number;
    };

    const response = await client.request<Highlight[]>({
      method: HttpMethod.GET,
      path: `/sessions/${sessionId}/highlights`,
    });

    const highlights = toHighlightArray(response);

    if (!returnAll) {
      const limited = assertLimit(limit);
      return limited ? highlights.slice(0, limited) : highlights.slice(0, 50);
    }

    return highlights;
  },
});
