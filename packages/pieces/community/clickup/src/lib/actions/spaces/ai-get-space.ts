import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetSpace = createAction({
  auth: clickupAuth,
  name: 'clickup_get_space',
  description: 'Get a single ClickUp space by its ID',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read-only: fetch the details of one ClickUp space by space ID. Use when you already know which space you want; to discover space IDs first, use Get Spaces. Safe to call repeatedly.',
    idempotent: true,
  },
  displayName: 'Get Space',
  props: {
    space_id: clickupCommon.space_id(),
  },
  async run(configValue) {
    const { space_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.GET,
      `space/${space_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );
    return response.body;
  },
});
