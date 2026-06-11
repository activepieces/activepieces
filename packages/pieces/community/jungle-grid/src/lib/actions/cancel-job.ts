import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const cancelJob = createAction({
  auth: jungleGridAuth,
  name: 'cancel_job',
  displayName: 'Cancel Job',
  description: 'Cancel a non-terminal Jungle Grid job. This may stop active execution.',
  props: {
    job_id: jungleGridCommon.jobId,
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Optional cancellation reason stored with the Jungle Grid job status.',
      required: false,
      defaultValue: 'Cancelled from Activepieces',
    }),
  },
  async run(context) {
    return await jungleGridCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: jungleGridCommon.endpoints.cancelJob(context.propsValue.job_id),
      body: {
        reason: context.propsValue.reason,
      },
    });
  },
});
