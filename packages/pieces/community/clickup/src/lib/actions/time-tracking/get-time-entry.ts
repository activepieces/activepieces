import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clickupAuth } from '../../auth';
import { callClickUpApi, clickupCommon } from '../../common';

export const clickupGetTimeEntry = createAction({
  auth: clickupAuth,
  name: 'clickup_get_time_entry',
  displayName: 'Get Time Entry',
  description: 'Retrieve a single time entry by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieve one tracked time entry by its time entry (timer) ID within a workspace. Pick this when you already know the entry ID; use List Time Entries to find entries by date or scope, or Get Running Time Entry for the timer currently in progress. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    workspace_id: clickupCommon.workspace_id(true),
    timer_id: Property.ShortText({
      displayName: 'Time Entry ID',
      description:
        'The ID of the time entry to retrieve. Obtain it from List Time Entries.',
      required: true,
    }),
  },
  async run(context) {
    const { workspace_id, timer_id } = context.propsValue;
    const auth = getAccessTokenOrThrow(context.auth);

    const response = await callClickUpApi(
      HttpMethod.GET,
      `team/${workspace_id}/time_entries/${timer_id}`,
      auth,
      undefined
    );

    return response.body;
  },
});
