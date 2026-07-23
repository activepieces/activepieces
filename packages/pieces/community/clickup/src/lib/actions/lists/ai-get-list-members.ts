import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetListMembers = createAction({
  auth: clickupAuth,
  name: 'clickup_get_list_members',
  description: 'List the members who have access to a ClickUp list',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read-only: list the people who have access to a specific ClickUp list, returning their user IDs and names. Use to discover who can see or be assigned within a list. Safe to call repeatedly.',
    idempotent: true,
  },
  displayName: 'Get List Members',
  props: {
    list_id: Property.ShortText({
      description: 'The ID of the list to read members for',
      displayName: 'List ID',
      required: true,
    }),
  },
  async run(configValue) {
    const { list_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.GET,
      `list/${list_id}/member`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
