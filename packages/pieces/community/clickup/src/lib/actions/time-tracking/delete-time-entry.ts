import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clickupAuth } from '../../auth';
import { callClickUpApi, clickupCommon } from '../../common';

export const clickupDeleteTimeEntry = createAction({
  auth: clickupAuth,
  name: 'clickup_delete_time_entry',
  displayName: 'Delete Time Entry',
  description: 'Delete a time entry by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete a tracked time entry by its time entry ID within a workspace. This is destructive and cannot be undone; a repeated call on an already-deleted entry errors (not idempotent). Use List Time Entries to confirm the entry ID before deleting.',
    idempotent: false,
  },
  props: {
    workspace_id: clickupCommon.workspace_id(true),
    timer_id: Property.ShortText({
      displayName: 'Time Entry ID',
      description:
        'The ID of the time entry to delete. Obtain it from List Time Entries.',
      required: true,
    }),
  },
  async run(context) {
    const { workspace_id, timer_id } = context.propsValue;
    const auth = getAccessTokenOrThrow(context.auth);

    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `team/${workspace_id}/time_entries/${timer_id}`,
      auth,
      undefined
    );

    return response.body;
  },
});
