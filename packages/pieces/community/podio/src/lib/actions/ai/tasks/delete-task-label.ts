import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteTaskLabelAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_task_label',
  displayName: 'Delete Task Label',
  description: 'Deletes a task label.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one of the connected user\'s task labels, removing it from every task that has it. The label id comes from List Task Labels or Create Task Label.',
    idempotent: false,
  },
  props: {
    labelId: podioAiProps.id({ required: true, displayName: 'Label ID', description: 'The id of the label to delete.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/task/label/${propsValue.labelId}` });
  },
});
