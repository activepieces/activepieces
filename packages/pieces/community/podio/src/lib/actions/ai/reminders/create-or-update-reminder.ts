import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const createOrUpdateReminderAction = createAction({
  auth: podioAuth,
  name: 'podio_create_or_update_reminder',
  displayName: 'Create or Update Reminder',
  description: 'Sets the reminder on a task or item to fire a number of minutes before it is due.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the reminder of the connected user on one Podio task or item, replacing any reminder already there, so it fires the given number of minutes before the due date. Use Get Reminder to read the current one and Delete Reminder to remove it.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.choice({ required: true, displayName: 'Object Type', description: 'The type of the object: "task" or "item".', values: ['task', 'item'] }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the task (from List Tasks or Get Task) or item (from Filter Items or Get Item).' }),
    remindDelta: podioAiProps.number({ required: true, displayName: 'Minutes Before', description: 'How many minutes before the due date the reminder fires.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: `/reminder/${propsValue.refType}/${propsValue.refId}`, body: { remind_delta: propsValue.remindDelta } });
  },
});
