import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteRecurrenceAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_recurrence',
  displayName: 'Delete Recurrence',
  description: 'Stops an object, such as a task, from repeating.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes the repeat schedule from one Podio object, such as a task; the object itself is kept. Use Create or Update Recurrence to set a schedule again.',
    idempotent: false,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object that repeats, such as "task".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, e.g. a task id from List Tasks or Get Task.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/recurrence/${propsValue.refType}/${propsValue.refId}` });
  },
});
