import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistLabelsClient } from '../common/client/labels-client';
import { todoistAuth } from '../..';

export const todoistRemoveSharedLabelAction = createAction({
  auth: todoistAuth,
  name: 'todoist_remove_shared_label',
  displayName: 'Remove Shared Label',
  description: 'Removes a shared (workspace) label from all tasks in Todoist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a shared (workspace) label, identified by name, from every active task that uses it. Resolve the exact name with List Shared Labels first. This affects shared labels only; to delete a personal label (and strip it from tasks) use Delete Label. Idempotent: removing a name with no remaining instances succeeds, so retries are safe.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The shared label name to remove from all tasks. Resolve it via List Shared Labels.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth.access_token;
    const { name } = propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(name, 'name');
    await todoistLabelsClient.removeShared({ token, name });
    return { success: true, name };
  },
});
