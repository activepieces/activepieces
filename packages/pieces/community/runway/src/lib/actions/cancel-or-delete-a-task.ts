import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { runwayAuth, runwayCommon } from '../common';

export const cancelOrDeleteATask = createAction({
  auth: runwayAuth,
  name: 'cancelOrDeleteATask',
  displayName: 'Cancel or delete a task',
  description: 'Cancel or delete a task.',
  props: runwayCommon.cancelOrDeleteATaskProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      runwayCommon.cancelOrDeleteATaskSchema
    );
    const { taskId, ...rest } = propsValue;
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    return await runwayCommon.cancelOrDeleteATask({
      apiKey,
      taskId,
      ...rest,
    });
  },
});
