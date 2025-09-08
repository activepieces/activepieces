import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { runwayAuth, runwayCommon } from '../common';

export const getTaskDetails = createAction({
  auth: runwayAuth,
  name: 'getTaskDetails',
  displayName: 'Get Task Details',
  description: 'Retrieve details of an existing Runway task by its ID.',
  props: runwayCommon.getTaskDetailsProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      runwayCommon.getTaskDetailsSchema
    );
    const { taskId, ...rest } = propsValue;
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    return await runwayCommon.getTaskDetails({
      apiKey,
      taskId,
      ...rest,
    });
  },
});
