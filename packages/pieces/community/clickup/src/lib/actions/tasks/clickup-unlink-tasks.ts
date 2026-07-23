import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupUnlinkTasksAi = createAction({
  auth: clickupAuth,
  name: 'clickup_unlink_tasks',
  description: 'Remove a link between two tasks',
  audience: 'ai',
  aiMetadata: {
    description:
      'Remove a non-dependency link between two ClickUp tasks. Use Link Tasks to create one. Removing a link that does not exist is a no-op, so it is idempotent.',
    idempotent: true,
  },
  displayName: 'Unlink Tasks',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the first task.',
      required: true,
    }),
    links_to: Property.ShortText({
      displayName: 'Linked Task ID',
      description: 'The ID of the task to unlink from.',
      required: true,
    }),
  },
  async run(configValue) {
    const { task_id, links_to } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `task/${task_id}/link/${links_to}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
