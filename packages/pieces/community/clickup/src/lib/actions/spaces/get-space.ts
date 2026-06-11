import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { callClickUpApi, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';

export const getClickupSpace = createAction({
  auth: clickupAuth,
  name: 'get_space',
  description: 'Gets a space in a ClickUp',
  audience: 'both',
  aiMetadata: { description: 'Read-only: fetch the details of a single ClickUp space by its space ID. Use when you already know which space you want; to discover space IDs first, use the list-spaces action instead. Safe to call repeatedly.', idempotent: true },
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
