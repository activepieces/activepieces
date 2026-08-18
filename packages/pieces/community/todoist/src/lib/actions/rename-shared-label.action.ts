import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistLabelsClient } from '../common/client/labels-client';
import { todoistAuth } from '../..';

export const todoistRenameSharedLabelAction = createAction({
  auth: todoistAuth,
  name: 'todoist_rename_shared_label',
  displayName: 'Rename Shared Label',
  description: 'Renames a shared (workspace) label across all tasks in Todoist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames a shared (workspace) label from its current name to a new name across every active task that uses it. Shared labels have no ID, so they are matched by name — resolve the current name with List Shared Labels first. This affects shared labels only; to rename a personal label use Update Label. Idempotent: once renamed, re-running with the same new name is a no-op since the old name no longer exists.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Current Name',
      description: 'The existing shared label name to rename. Resolve it via List Shared Labels.',
      required: true,
    }),
    new_name: Property.ShortText({
      displayName: 'New Name',
      description: 'The new name to apply to the shared label.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth.access_token;
    const { name, new_name } = propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(name, 'name');
    assertNotNullOrUndefined(new_name, 'new_name');
    await todoistLabelsClient.renameShared({ token, name, new_name });
    return { success: true, name, new_name };
  },
});
