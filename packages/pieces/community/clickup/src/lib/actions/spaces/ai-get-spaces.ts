import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetSpaces = createAction({
  auth: clickupAuth,
  name: 'clickup_get_spaces',
  description: 'List all spaces in a ClickUp workspace',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read-only: list all spaces in a ClickUp workspace (team), returning their IDs and names. Use to discover available spaces before drilling into a specific space, folder, or list. Safe to call repeatedly.',
    idempotent: true,
  },
  displayName: 'Get Spaces',
  props: {
    team_id: clickupCommon.workspace_id(),
  },
  async run(configValue) {
    const { team_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.GET,
      `team/${team_id}/space`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
