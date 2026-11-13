import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateTaskLabelOutputSchema } from '../../../output-schemas';

export const createTaskLabelAction = createAction({
  auth: podioAuth,
  name: 'podio_create_task_label',
  outputSchema: podioCreateTaskLabelOutputSchema,
  displayName: 'Create Task Label',
  description: 'Creates a personal task label.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a task label for the connected user and returns its id, for use in Create Task, Update Task and Replace Task Labels. Each call creates a new label; check List Task Labels first to reuse one.',
    idempotent: false,
  },
  props: {
    text: podioAiProps.text({ required: true, displayName: 'Name', description: 'The name of the label.' }),
    color: podioAiProps.text({ required: false, displayName: 'Color', description: 'The color as a 6-digit hex code without "#", such as "E1D5E7".' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/task/label/',
      body: podioUtils.body({ values: { text: propsValue.text, color: propsValue.color || undefined } }),
    });
  },
});
