import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseRunCronOutputSchema } from '../../../output-schemas';

export const runCronAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_run_cron',
  outputSchema: pocketbaseRunCronOutputSchema,
  displayName: 'Run Cron Job',
  description: 'Runs a cron job now.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Starts one registered cron job right away, outside its schedule, and returns without waiting for it to finish. The job ID comes from List Cron Jobs.',
    idempotent: false,
  },
  props: {
    jobId: Property.ShortText({
      displayName: 'Job ID',
      description: 'Cron job ID, e.g. "__pbLogsCleanup__". List Cron Jobs returns it.',
      required: true,
    }),
  },
  async run(context) {
    const { jobId } = context.propsValue;
    await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/api/crons/${encodeURIComponent(jobId)}`,
    });
    return { success: true, jobId };
  },
});
