import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../..';
import { jungleGridCommon } from '../common';

export const getJobStatus = createAction({
  auth: jungleGridAuth,
  name: 'get_job_status',
  displayName: 'Get Job Status',
  description: 'Get the current status and metadata for a submitted Jungle Grid job.',
  props: {
    job_id: jungleGridCommon.jobId,
  },
  async run(context) {
    const response = await jungleGridCommon.apiCall<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: jungleGridCommon.endpoints.jobStatus(context.propsValue.job_id),
    });

    return jungleGridCommon.toFlatRecord(response.body);
  },
});
