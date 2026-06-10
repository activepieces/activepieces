import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const getJobLogs = createAction({
  auth: jungleGridAuth,
  name: 'get_job_logs',
  displayName: 'Get Job Logs',
  description: 'Get recent stdout, stderr, or combined logs for a submitted Jungle Grid job.',
  props: {
    job_id: jungleGridCommon.jobId,
    tail_lines: Property.Number({
      displayName: 'Tail Lines',
      description: 'Number of recent log lines to fetch. Jungle Grid accepts 1 to 500.',
      required: false,
      defaultValue: 100,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Optional `next_cursor` from a previous logs response.',
      required: false,
    }),
    stream: Property.StaticDropdown({
      displayName: 'Stream',
      description: 'Choose which log stream to fetch.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'stdout', value: 'stdout' },
          { label: 'stderr', value: 'stderr' },
        ],
      },
    }),
  },
  async run(context) {
    return await jungleGridCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: jungleGridCommon.endpoints.jobLogs(context.propsValue.job_id),
      queryParams: jungleGridCommon.buildLogsQueryParams(context.propsValue),
    });
  },
});
