import { createAction, Property } from '@activepieces/pieces-framework';
import { jobvettaAuth } from '../auth';
import { jobvettaGet } from '../common/client';

export const getJobDetailsAction = createAction({
  auth: jobvettaAuth,
  name: 'get_job_details',
  displayName: 'Get Job Details',
  description: 'Retrieve full 70+ field structured job details, qualifications, extracted skills, and salary bounds by Job ID.',
  props: {
    job_id: Property.ShortText({
      displayName: 'Job ID',
      description: 'A job_id returned by Search Jobs or Get Company Hiring Signals, or latest to inspect a live sample posting.',
      required: true,
      defaultValue: 'latest',
    }),
  },
  async run(context) {
    const jobId = context.propsValue.job_id.trim();
    return jobvettaGet({
      apiKey: context.auth.secret_text,
      path: `/jobs/${encodeURIComponent(jobId)}`,
    });
  },
});
