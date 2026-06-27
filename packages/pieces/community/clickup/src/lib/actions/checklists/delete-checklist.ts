import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupDeleteChecklist = createAction({
  auth: clickupAuth,
  name: 'clickup_delete_checklist',
  description: 'Delete a checklist from a ClickUp task',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete an entire ClickUp checklist (and all its items) by its checklist ID. To remove a single item instead, use Delete Checklist Item. Deleting an already-removed checklist is treated as a no-op, so this is safe to retry.',
    idempotent: true,
  },
  displayName: 'Delete Checklist',
  props: {
    checklist_id: Property.ShortText({
      description: 'The ID of the checklist to delete (from Create Checklist)',
      displayName: 'Checklist ID',
      required: true,
    }),
  },
  async run(configValue) {
    const { checklist_id } = configValue.propsValue;

    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `checklist/${checklist_id}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
