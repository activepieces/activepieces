import {
  Property,
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi, listTags } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupDeleteSpaceTag = createAction({
  auth: clickupAuth,
  name: 'clickup_delete_space_tag',
  description: 'Delete a tag from a ClickUp space',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete a tag from a ClickUp space by name, which also removes it from every task it was applied to in that space. To merely detach a tag from a single task without deleting it, use Remove Tag From Task instead. This is destructive across the space; confirm the name (via List Space Tags) before calling.',
    idempotent: false,
  },
  displayName: 'Delete Space Tag',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    tag_name: Property.Dropdown({
      auth: clickupAuth,
      displayName: 'Tag',
      description: 'The name of the tag to delete',
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
    const { space_id, tag_name } = configValue.propsValue;

    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `space/${space_id}/tag/${encodeURIComponent(tag_name as string)}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
