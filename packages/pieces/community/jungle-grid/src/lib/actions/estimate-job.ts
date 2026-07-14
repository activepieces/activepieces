import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const estimateJob = createAction({
  auth: jungleGridAuth,
  name: 'estimate_job',
  displayName: 'Estimate Job',
  description: 'Estimate the cost, duration, and resources for a Jungle Grid job.',
  audience: 'both',
  aiMetadata: {
    description:
      'Compute a cost, duration, and resource estimate for a prospective Jungle Grid job from the same specification used by Submit Job, without actually running anything. Pick this to preview or budget-check a job before submission; it is a safe, idempotent calculation with no side effects. Use Submit Job afterwards to actually execute.',
    idempotent: true,
  },
  props: {
    instructions: jungleGridCommon.asyncInstructions,
    ...jungleGridCommon.estimateJobProps,
  },
  async run(context) {
    return await jungleGridCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: jungleGridCommon.endpoints.estimateJob,
      body: jungleGridCommon.buildEstimateJobPayload(context.propsValue),
    });
  },
});
