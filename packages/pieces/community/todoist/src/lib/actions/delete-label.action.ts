import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistLabelsClient } from '../common/client/labels-client';
import { todoistAuth } from '../..';

export const todoistDeleteLabelAction = createAction({
  auth: todoistAuth,
  name: 'todoist_delete_label',
  displayName: 'Delete Label',
  description: 'Deletes a personal label in Todoist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a personal Todoist label by label_id, removing it from every task it was applied to. Resolve label_id first via List Labels or Search Labels. This affects only personal labels; to drop a shared (workspace) label across all tasks use Remove Shared Label. Idempotent: deleting an already-gone label is treated as success, so retries are safe.',
    idempotent: true,
  },
  props: {
    label_id: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the personal label to delete. Obtain it via List Labels or Search Labels.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth.access_token;
    const { label_id } = propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(label_id, 'label_id');
    try {
      await todoistLabelsClient.delete({ token, label_id });
    } catch (error: any) {
      // Treat an already-deleted label (404) as success so retries are idempotent.
      if (error?.response?.status !== 404) {
        throw error;
      }
    }
    return { success: true, label_id };
  },
});
