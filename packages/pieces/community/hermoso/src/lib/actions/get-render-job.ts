import { createAction } from '@activepieces/pieces-framework';
import { hermosoAuth } from '../auth';
import { hermosoApi } from '../common/client';
import { hermosoProps } from '../common/props';

export const getRenderJobAction = createAction({
  auth: hermosoAuth,
  name: 'get_render_job',
  classification: 'READ',
  displayName: 'Get Render Job',
  description: 'Gets the status of a render, and the finished file once it is done.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads one Hermoso render job by its ID and returns its status (queued, running, done or error) and, when done, the file URL. Use it to collect a render started with Wait for the Result off. Read-only; safe to retry.',
    idempotent: true,
  },
  props: {
    brand: hermosoProps.brand,
    job_id: hermosoProps.jobId,
  },
  async run(context) {
    const job = await hermosoApi.getJob({
      apiKey: context.auth.secret_text,
      brand: context.propsValue.brand ?? undefined,
      jobId: context.propsValue.job_id,
    });
    return hermosoApi.flattenJob(job);
  },
});
