import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi, listTags } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupRemoveTagFromTaskAi = createAction({
  auth: clickupAuth,
  name: 'clickup_remove_tag_from_task',
  description: 'Remove a tag from a task',
  audience: 'ai',
  aiMetadata: {
    description:
      'Remove a tag from a ClickUp task by tag name. This only detaches the tag from this task; the tag itself remains in the space. Use Add Tag To Task to attach one. Removing a tag the task does not have is a no-op, so it is idempotent.',
    idempotent: true,
  },
  displayName: 'Remove Tag From Task',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: clickupCommon.task_id(),
    tag_name: Property.Dropdown({
      auth: clickupAuth,
      displayName: 'Tag',
      description: 'The name of the space tag to remove.',
      required: true,
      refreshers: ['space_id'],
      options: async ({ auth, space_id }) => {
        if (!auth || !space_id) {
          return {
            disabled: true,
            placeholder: 'connect your account first and select a space',
            options: [],
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const response = await listTags(accessToken, space_id as string);
        return {
          disabled: false,
          options: response.tags.map((tag) => {
            return {
              label: tag.name,
              value: tag.name,
            };
          }),
        };
      },
    }),
  },
  async run(configValue) {
    const { task_id, tag_name } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `task/${task_id}/tag/${encodeURIComponent(tag_name as string)}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
