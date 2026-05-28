import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../..';
import { jungleGridCommon } from '../common';

export const getJobLogs = createAction({
  auth: jungleGridAuth,
  name: 'get_job_logs',
  displayName: 'Get Job Logs',
  description: 'Get logs or log metadata for a submitted Jungle Grid job.',
  props: {
    job_id: jungleGridCommon.jobId,
    tail_lines: Property.Number({
      displayName: 'Tail Lines',
      description: 'Optional number of most recent log lines to request if supported by the API.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const response = await jungleGridCommon.apiCall<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: jungleGridCommon.endpoints.jobLogs(context.propsValue.job_id),
      queryParams: context.propsValue.tail_lines
        ? { stream: 'all', tail: String(context.propsValue.tail_lines) }
        : undefined,
    });

    return jungleGridCommon.toFlatRecords(response.body);
  },
});
