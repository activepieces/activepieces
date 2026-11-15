import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetJobStatusOutputSchema } from '../../../output-schemas';

export const zendeskGetJobStatus = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_job_status',
  outputSchema: zendeskGetJobStatusOutputSchema,
  displayName: 'Get Job Status',
  description: 'Check the progress of a background job.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the status of a background job started by Create Many Tickets, Update Many Tickets, Merge Tickets or Mark Tickets as Spam: queued, working, completed, failed or killed, with per-item results once completed. Call again later while the status is queued or working; job statuses expire after about an hour.',
    idempotent: true,
  },
  props: {
    job_status_id: zendeskAiProps.requiredId({ displayName: 'Job Status ID', description: 'The id returned by a bulk or merge action.' }),
  },
  async run({ auth, propsValue }) {
    const jobStatusId = zendeskApi.pathSegment({ value: propsValue.job_status_id, label: 'Job Status ID' });
    const response = await zendeskApi.request<{ job_status: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/job_statuses/${jobStatusId}.json`,
    });
    return response.job_status;
  },
});
