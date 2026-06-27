import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupDeleteTaskDependencyAi = createAction({
  auth: clickupAuth,
  name: 'clickup_delete_task_dependency',
  description: 'Remove a dependency between two tasks',
  audience: 'ai',
  aiMetadata: {
    description:
      'Remove a dependency relationship from a ClickUp task. Provide exactly one of "Depends On" or "Blocks" matching the dependency to remove (the same way it was created with Add Task Dependency). Removing a dependency that no longer exists is a no-op, so it is idempotent.',
    idempotent: true,
  },
  displayName: 'Delete Task Dependency',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The task the dependency is set on.',
      required: true,
    }),
    depends_on: Property.ShortText({
      displayName: 'Depends On',
      description:
        'The ID of the task this task depended on. Provide exactly one of Depends On or Blocks.',
      required: false,
    }),
    dependency_of: Property.ShortText({
      displayName: 'Blocks',
      description:
        'The ID of the task this task blocked. Provide exactly one of Depends On or Blocks.',
      required: false,
    }),
  },
  async run(configValue) {
    const { task_id, depends_on, dependency_of } = configValue.propsValue;
    if ((depends_on && dependency_of) || (!depends_on && !dependency_of)) {
      throw new Error(
        'Provide exactly one of "Depends On" or "Blocks".'
      );
    }

    const queryParams: Record<string, string> = {};
    if (depends_on) queryParams['depends_on'] = depends_on;
    if (dependency_of) queryParams['dependency_of'] = dependency_of;

    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `task/${task_id}/dependency`,
      getAccessTokenOrThrow(configValue.auth),
      undefined,
      queryParams
    );

    return response.body;
  },
});
