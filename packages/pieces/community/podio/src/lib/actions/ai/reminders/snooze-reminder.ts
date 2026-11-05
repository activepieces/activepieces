import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const snoozeReminderAction = createAction({
  auth: podioAuth,
  name: 'podio_snooze_reminder',
  displayName: 'Snooze Reminder',
  description: 'Snoozes the reminder on a task or item for 10 minutes.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Postpones the reminder of the connected user on one Podio task or item by 10 minutes. Each call snoozes again, so it is not idempotent. Use Create or Update Reminder to change how early it fires.',
    idempotent: false,
  },
  props: {
    refType: podioAiProps.choice({ required: true, displayName: 'Object Type', description: 'The type of the object: "task" or "item".', values: ['task', 'item'] }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the task (from List Tasks or Get Task) or item (from Filter Items or Get Item).' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/reminder/${propsValue.refType}/${propsValue.refId}/snooze` });
  },
});
