import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteReminderAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_reminder',
  displayName: 'Delete Reminder',
  description: 'Removes the reminder from a task or item.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes the reminder of the connected user from one Podio task or item; the task or item itself is kept. Use Create or Update Reminder to set it again.',
    idempotent: false,
  },
  props: {
    refType: podioAiProps.choice({ required: true, displayName: 'Object Type', description: 'The type of the object: "task" or "item".', values: ['task', 'item'] }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the task (from List Tasks or Get Task) or item (from Filter Items or Get Item).' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/reminder/${propsValue.refType}/${propsValue.refId}` });
  },
});
