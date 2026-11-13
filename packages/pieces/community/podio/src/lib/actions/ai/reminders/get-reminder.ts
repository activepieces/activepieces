import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetReminderOutputSchema } from '../../../output-schemas';

export const getReminderAction = createAction({
  auth: podioAuth,
  name: 'podio_get_reminder',
  outputSchema: podioGetReminderOutputSchema,
  displayName: 'Get Reminder',
  description: 'Gets the reminder set on a task or item.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the reminder of the connected user on one Podio task or item: how many minutes before the due date it fires.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.choice({ required: true, displayName: 'Object Type', description: 'The type of the object: "task" or "item".', values: ['task', 'item'] }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the task (from List Tasks or Get Task) or item (from Filter Items or Get Item).' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/reminder/${propsValue.refType}/${propsValue.refId}` });
  },
});
