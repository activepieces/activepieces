import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const cancelJob = createAction({
  auth: jungleGridAuth,
  name: 'cancel_job',
  displayName: 'Cancel Job',
  description: 'Cancel a non-terminal Jungle Grid job. This may stop active execution.',
  audience: 'both',
  aiMetadata: {
    description:
      'Request cancellation of a running or queued Jungle Grid job by job ID, optionally recording a reason. Pick this to stop a job that is no longer needed; it mutates job state and only applies to jobs that have not already reached a terminal status. Not idempotent: retrying against an already-cancelled or finished job may fail.',
    idempotent: false,
  },
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
