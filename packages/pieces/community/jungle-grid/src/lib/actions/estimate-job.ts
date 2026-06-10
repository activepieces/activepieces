import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../..';
import { jungleGridCommon } from '../common';

export const estimateJob = createAction({
  auth: jungleGridAuth,
  name: 'estimate_job',
  displayName: 'Estimate Job',
  description: 'Estimate the cost, duration, and resources for a Jungle Grid job.',
  props: {
    instructions: jungleGridCommon.asyncInstructions,
    ...jungleGridCommon.jobPayloadProps,
  },
  async run(context) {
    const response = await jungleGridCommon.apiCall<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: jungleGridCommon.endpoints.estimateJob,
      body: jungleGridCommon.buildJobPayload(context.propsValue),
    });

    return jungleGridCommon.toFlatRecord(response.body);
  },
});
