import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateTaskLabelAction = createAction({
  auth: podioAuth,
  name: 'podio_update_task_label',
  displayName: 'Update Task Label',
  description: 'Renames or recolors a task label.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the name or color of one of the connected user\'s task labels; set at least one. The label id comes from List Task Labels or Create Task Label.',
    idempotent: true,
  },
  props: {
    labelId: podioAiProps.id({ required: true, displayName: 'Label ID', description: 'The id of the label.' }),
    text: podioAiProps.text({ required: false, displayName: 'Name', description: 'The new name of the label.' }),
    color: podioAiProps.text({ required: false, displayName: 'Color', description: 'The new color as a 6-digit hex code without "#", such as "E1D5E7".' }),
  },
  async run({ auth, propsValue }) {
    const { labelId, text, color } = propsValue;
    if (!text && !color) {
      throw new Error('Set at least one of Name or Color.');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/task/label/${labelId}`,
      body: podioUtils.body({ values: { text: text || undefined, color: color || undefined } }),
    });
  },
});
