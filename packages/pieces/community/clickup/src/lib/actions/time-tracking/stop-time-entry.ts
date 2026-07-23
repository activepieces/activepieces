import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { clickupAuth } from '../../auth';
import { callClickUpApi, clickupCommon } from '../../common';

export const clickupStopTimeEntry = createAction({
  auth: clickupAuth,
  name: 'clickup_stop_time_entry',
  displayName: 'Stop Time Entry',
  description: 'Stop the currently running timer in a ClickUp workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Stop the timer that is currently running for the authenticated user in a workspace, finalizing it into a completed time entry. Pick this to end a timer previously begun with Start Time Entry; call Get Running Time Entry first to confirm a timer is active, since stopping when none is running errors (not idempotent).',
    idempotent: false,
  },
  props: {
    workspace_id: clickupCommon.workspace_id(true),
  },
  async run(context) {
    const { workspace_id } = context.propsValue;
    const auth = getAccessTokenOrThrow(context.auth);

    const response = await callClickUpApi(
      HttpMethod.POST,
      `team/${workspace_id}/time_entries/stop`,
      auth,
      {}
    );

    return response.body;
  },
});
