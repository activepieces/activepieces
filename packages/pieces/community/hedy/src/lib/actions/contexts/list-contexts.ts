import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient } from '../../common/client';
import { commonProps } from '../../common/props';
import { PaginatedResponse, SessionContext } from '../../common/types';
import { assertLimit } from '../../common/validation';

function toContextArray(result: unknown): SessionContext[] {
  if (Array.isArray(result)) {
    return result as SessionContext[];
  }

  if (result && typeof result === 'object' && 'data' in result) {
    const data = (result as PaginatedResponse<SessionContext>).data;
    if (Array.isArray(data)) {
      return data;
    }
  }

  return [];
}

export const listContexts = createAction({
  auth: hedyAuth,
  name: 'list-contexts',
  displayName: 'List Session Contexts',
  description: 'Retrieve all session contexts.',
  props: {
    returnAll: commonProps.returnAll,
    limit: commonProps.limit,
  },
  async run(context) {
    const client = createClient(context.auth);
    const { returnAll, limit } = context.propsValue as {
      returnAll?: boolean;
      limit?: number;
    };

    const response = await client.request<SessionContext[]>({
      method: HttpMethod.GET,
      path: '/contexts',
    });

    const contexts = toContextArray(response);

    if (!returnAll) {
      const limited = assertLimit(limit);
      return limited ? contexts.slice(0, limited) : contexts.slice(0, 50);
    }

    return contexts;
  },
});
