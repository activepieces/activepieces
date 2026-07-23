import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupDeleteChecklistItem = createAction({
  auth: clickupAuth,
  name: 'clickup_delete_checklist_item',
  description: 'Delete a single item from a ClickUp checklist',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete one item from a ClickUp checklist, identified by its checklist ID and checklist item ID. To remove the whole checklist at once, use Delete Checklist instead. Each call targets a specific item ID that no longer exists after deletion, so it is not idempotent on retry.',
    idempotent: false,
  },
  displayName: 'Delete Checklist Item',
  props: {
    checklist_id: Property.ShortText({
      description: 'The ID of the parent checklist (from Create Checklist)',
      displayName: 'Checklist ID',
      required: true,
    }),
    checklist_item_id: Property.ShortText({
      description: 'The ID of the checklist item to delete',
      displayName: 'Checklist Item ID',
      required: true,
    }),
  },
  async run(configValue) {
    const { checklist_id, checklist_item_id } = configValue.propsValue;

    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `checklist/${checklist_id}/checklist_item/${checklist_item_id}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
