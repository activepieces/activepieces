import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi, listTags } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupAddTagToTaskAi = createAction({
  auth: clickupAuth,
  name: 'clickup_add_tag_to_task',
  description: 'Add an existing space tag to a task',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add an existing space-level tag to a ClickUp task by tag name. The tag must already exist in the space (list them with Get Space Tags or create one with Create Space Tag); this does not create new tags. Use Remove Tag From Task to take a tag off. Re-adding a tag the task already has is a no-op, so it is idempotent.',
    idempotent: true,
  },
  displayName: 'Add Tag To Task',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: clickupCommon.task_id(),
    tag_name: Property.Dropdown({
      auth: clickupAuth,
      displayName: 'Tag',
      description: 'The name of the space tag to add.',
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
      HttpMethod.POST,
      `task/${task_id}/tag/${encodeURIComponent(tag_name as string)}`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
