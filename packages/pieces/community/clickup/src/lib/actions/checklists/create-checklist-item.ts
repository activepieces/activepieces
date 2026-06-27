import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupCreateChecklistItem = createAction({
  auth: clickupAuth,
  name: 'clickup_create_checklist_item',
  description: 'Add an item to a ClickUp checklist',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add a line item to an existing ClickUp checklist, identified by its checklist ID (obtained from Create Checklist). Optionally assign the item to a user. Each call adds a separate item, so it is not idempotent.',
    idempotent: false,
  },
  displayName: 'Create Checklist Item',
  props: {
    checklist_id: Property.ShortText({
      description:
        'The ID of the checklist to add the item to (from Create Checklist)',
      displayName: 'Checklist ID',
      required: true,
    }),
    name: Property.ShortText({
      description: 'The text of the checklist item',
      displayName: 'Item Name',
      required: true,
    }),
    assignee: Property.Number({
      description: 'The user ID to assign this checklist item to',
      displayName: 'Assignee',
      required: false,
    }),
  },
  async run(configValue) {
    const { checklist_id, name, assignee } = configValue.propsValue;

    const body: Record<string, unknown> = { name };
    if (assignee !== undefined && assignee !== null) {
      body['assignee'] = assignee;
    }

    const response = await callClickUpApi(
      HttpMethod.POST,
      `checklist/${checklist_id}/checklist_item`,
      getAccessTokenOrThrow(configValue.auth),
      body
    );

    return response.body;
  },
});
