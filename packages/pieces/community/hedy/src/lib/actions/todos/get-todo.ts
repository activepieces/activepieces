import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient, unwrapResource } from '../../common/client';
import { commonProps } from '../../common/props';
import { Todo } from '../../common/types';
import { assertIdPrefix } from '../../common/validation';

export const getTodo = createAction({
  auth: hedyAuth,
  name: 'get-todo',
  displayName: 'Get Todo',
  description: 'Retrieve a specific todo by ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetch a single todo from a Hedy session by its ID. Requires both the owning session ID (prefixed "sess_") and the todo ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    sessionId: commonProps.sessionId,
    todoId: commonProps.todoId,
  },
  async run(context) {
    const sessionId = assertIdPrefix(
      context.propsValue['sessionId'] as string,
      'sess_',
      'Session ID',
    );
    const todoId = context.propsValue['todoId'] as string;
    if (!todoId) {
      throw new Error('Todo ID is required.');
    }

    const client = createClient(context.auth);
    const response = await client.request<Todo>({
      method: HttpMethod.GET,
      path: `/sessions/${sessionId}/todos/${todoId}`,
    });

    return unwrapResource(response);
  },
});
