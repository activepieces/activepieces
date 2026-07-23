import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { clickupAuth } from '../../auth';
import { callClickUpApi, clickupCommon } from '../../common';

export const clickupGetRunningTimeEntry = createAction({
  auth: clickupAuth,
  name: 'clickup_get_running_time_entry',
  displayName: 'Get Running Time Entry',
  description: 'Retrieve the time entry currently being tracked.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Retrieve the time entry whose timer is currently running for the authenticated user in a workspace. Pick this to check whether a timer is active before calling Stop Time Entry; use Get Time Entry for a specific completed entry by ID. Read-only and idempotent; returns empty when no timer is running.",
    idempotent: true,
  },
  props: {
    workspace_id: clickupCommon.workspace_id(true),
  },
  async run(context) {
    const { workspace_id } = context.propsValue;
    const auth = getAccessTokenOrThrow(context.auth);

    const response = await callClickUpApi(
      HttpMethod.GET,
      `team/${workspace_id}/time_entries/current`,
      auth,
      undefined
    );

    return response.body;
  },
});
