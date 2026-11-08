import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const replaceTaskLabelsAction = createAction({
  auth: podioAuth,
  name: 'podio_replace_task_labels',
  displayName: 'Replace Task Labels',
  description: 'Sets the labels on a task, replacing the current ones.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces all of the connected user\'s labels on one Podio task with the given Label IDs and Label Names (a new name creates the label); set at least one, or set Remove All Labels to "true" alone. Label ids come from List Task Labels or Create Task Label. The task id comes from List Tasks, List Object Tasks or Create Task.',
    idempotent: true,
  },
  props: {
    taskId: podioAiProps.id({ required: true, displayName: 'Task ID', description: 'The id of the task.' }),
    labelIds: podioAiProps.idList({ required: false, displayName: 'Label IDs', description: 'Ids of existing labels to put on the task.' }),
    labelTexts: podioAiProps.idList({ required: false, displayName: 'Label Names', description: 'Names of labels to put on the task.' }),
    removeAll: podioAiProps.bool({ required: false, displayName: 'Remove All Labels', description: '"true" removes every label from the task. Cannot be combined with Label IDs or Label Names.' }),
  },
  async run({ auth, propsValue }) {
    const { taskId, labelIds = [], labelTexts = [], removeAll } = propsValue;
    const labels = [...labelIds.map(Number), ...labelTexts];
    const clear = podioUtils.toBool({ value: removeAll }) === true;
    if (clear === labels.length > 0) {
      throw new Error('Set Label IDs or Label Names, or set Remove All Labels to "true" alone.');
    }
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: `/task/${taskId}/label/`, body: labels });
  },
});
