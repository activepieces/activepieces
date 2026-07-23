import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupUpdateChecklistItem = createAction({
  auth: clickupAuth,
  name: 'clickup_update_checklist_item',
  description: 'Edit, resolve, or nest a ClickUp checklist item',
  audience: 'ai',
  aiMetadata: {
    description:
      'Update a single ClickUp checklist item: rename it, mark it resolved/unresolved, reassign it, or nest it under another item as a parent. Requires the checklist ID and the checklist item ID. This sets the item to the supplied end state, so repeating the same update is idempotent.',
    idempotent: true,
  },
  displayName: 'Update Checklist Item',
  props: {
    checklist_id: Property.ShortText({
      description: 'The ID of the parent checklist (from Create Checklist)',
      displayName: 'Checklist ID',
      required: true,
    }),
    checklist_item_id: Property.ShortText({
      description: 'The ID of the checklist item to update',
      displayName: 'Checklist Item ID',
      required: true,
    }),
    name: Property.ShortText({
      description: 'The new text of the checklist item',
      displayName: 'Item Name',
      required: false,
    }),
    resolved: Property.Checkbox({
      description: 'Whether the checklist item is resolved (checked)',
      displayName: 'Resolved',
      required: false,
    }),
    assignee: Property.Number({
      description: 'The user ID to assign this checklist item to',
      displayName: 'Assignee',
      required: false,
    }),
    parent: Property.ShortText({
      description:
        'The ID of another checklist item to nest this one under as a child',
      displayName: 'Parent Item ID',
      required: false,
    }),
  },
  async run(configValue) {
    const { checklist_id, checklist_item_id, name, resolved, assignee, parent } =
      configValue.propsValue;

    const body: Record<string, unknown> = {};
    if (name !== undefined && name !== null && name !== '') {
      body['name'] = name;
    }
    if (resolved !== undefined && resolved !== null) {
      body['resolved'] = resolved;
    }
    if (assignee !== undefined && assignee !== null) {
      body['assignee'] = assignee;
    }
    if (parent !== undefined && parent !== null && parent !== '') {
      body['parent'] = parent;
    }

    const response = await callClickUpApi(
      HttpMethod.PUT,
      `checklist/${checklist_id}/checklist_item/${checklist_item_id}`,
      getAccessTokenOrThrow(configValue.auth),
      body
    );

    return response.body;
  },
});
