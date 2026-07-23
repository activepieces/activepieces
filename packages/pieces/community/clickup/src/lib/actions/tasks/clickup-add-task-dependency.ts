import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupAddTaskDependencyAi = createAction({
  auth: clickupAuth,
  name: 'clickup_add_task_dependency',
  description: 'Add a dependency between two tasks',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a dependency relationship for a ClickUp task. Provide exactly one of "Depends On" (the task that must finish first / blocks this task) or "Blocks" (the task that this task blocks). For a non-blocking association between tasks use Link Tasks instead; to remove a dependency use Delete Task Dependency. Each call creates a new dependency, so it is not idempotent.',
    idempotent: false,
  },
  displayName: 'Add Task Dependency',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The task that the dependency is set on.',
      required: true,
    }),
    depends_on: Property.ShortText({
      displayName: 'Depends On',
      description:
        'The ID of the task that must be done first (it blocks this task). Provide exactly one of Depends On or Blocks.',
      required: false,
    }),
    dependency_of: Property.ShortText({
      displayName: 'Blocks',
      description:
        'The ID of the task that this task blocks. Provide exactly one of Depends On or Blocks.',
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

    const body: Record<string, string> = {};
    if (depends_on) body['depends_on'] = depends_on;
    if (dependency_of) body['dependency_of'] = dependency_of;

    const response = await callClickUpApi(
      HttpMethod.POST,
      `task/${task_id}/dependency`,
      getAccessTokenOrThrow(configValue.auth),
      body
    );

    return response.body;
  },
});
