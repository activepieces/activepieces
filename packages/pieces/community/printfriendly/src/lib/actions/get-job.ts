import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { printfriendlyAuth } from '../auth';
import { printfriendlyApi } from '../common/client';
import type { JobResponse } from '../common/types';

export const getJob = createAction({
  auth: printfriendlyAuth,
  name: 'get_job',
  classification: 'READ',
  displayName: 'Get Job',
  description: 'Retrieve the status and result of a background conversion job.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the current state and result of a PrintFriendly background conversion job. Use after Convert to Document with Run in Background enabled, and poll until status is succeeded or failed. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    jobId: Property.ShortText({
      displayName: 'Job ID',
      description:
        'The job_id returned by Convert to Document when Run in Background is enabled. Example: 5b1f6a52-0c0e-4d8e-9d8f-3f0a6a7d1c21',
      required: true,
    }),
  },
  async run(context) {
    const job = await printfriendlyApi.call<JobResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/jobs/${encodeURIComponent(context.propsValue.jobId)}`,
    });
    return printfriendlyApi.flattenJobResponse(job);
  },
});
