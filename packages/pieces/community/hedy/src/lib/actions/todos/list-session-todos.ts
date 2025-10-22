import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { HedyApiClient } from '../../common/client';
import { commonProps } from '../../common/props';
import { PaginatedResponse, Todo } from '../../common/types';
import { assertLimit } from '../../common/validation';

function toTodoArray(result: unknown): Todo[] {
  if (Array.isArray(result)) {
    return result as Todo[];
  }

  if (result && typeof result === 'object' && 'data' in result) {
    const data = (result as PaginatedResponse<Todo>).data;
    if (Array.isArray(data)) {
      return data;
    }
  }

  return [];
}

export const listSessionTodos = createAction({
  auth: hedyAuth,
  name: 'list-session-todos',
  displayName: 'List Session Todos',
  description: 'Retrieve todos generated for a specific session.',
  props: {
    sessionId: commonProps.sessionId,
    returnAll: commonProps.returnAll,
    limit: commonProps.limit,
  },
  async run(context) {
    const sessionId = context.propsValue.sessionId as string;
    const client = new HedyApiClient(context.auth as string);
    const { returnAll, limit } = context.propsValue as {
      returnAll?: boolean;
      limit?: number;
    };

    const response = await client.request<Todo[]>({
      method: HttpMethod.GET,
      path: `/sessions/${sessionId}/todos`,
    });

    const todos = toTodoArray(response);

    if (!returnAll) {
      const limited = assertLimit(limit);
      return limited ? todos.slice(0, limited) : todos.slice(0, 50);
    }

    return todos;
  },
});
