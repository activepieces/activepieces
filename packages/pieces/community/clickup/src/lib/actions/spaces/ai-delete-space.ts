import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupDeleteSpace = createAction({
  auth: clickupAuth,
  name: 'clickup_delete_space',
  description: 'Delete a ClickUp space by its ID',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete a ClickUp space along with every folder, list, and task inside it, by space ID. This has a large blast radius and cannot be undone, so confirm the ID before calling. Deleting an already-deleted space fails rather than succeeding, so treat it as non-idempotent.',
    idempotent: false,
  },
  displayName: 'Delete Space',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
  },
  async run(configValue) {
    const { space_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `space/${space_id}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
