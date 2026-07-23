import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupLinkTasksAi = createAction({
  auth: clickupAuth,
  name: 'clickup_link_tasks',
  description: 'Link two tasks together',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a non-dependency link between two ClickUp tasks (a simple association, not a blocking relationship). For a blocking/depends-on relationship use Add Task Dependency instead; to remove a link use Unlink Tasks. Re-linking already-linked tasks is a no-op, so it is idempotent.',
    idempotent: true,
  },
  displayName: 'Link Tasks',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the first task.',
      required: true,
    }),
    links_to: Property.ShortText({
      displayName: 'Links To Task ID',
      description: 'The ID of the task to link to.',
      required: true,
    }),
  },
  async run(configValue) {
    const { task_id, links_to } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.POST,
      `task/${task_id}/link/${links_to}`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
