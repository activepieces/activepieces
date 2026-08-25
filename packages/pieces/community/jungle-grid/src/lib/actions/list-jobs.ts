import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const listJobs = createAction({
  auth: jungleGridAuth,
  name: 'list_jobs',
  displayName: 'List Jobs',
  description: 'List Jungle Grid jobs for the authenticated workspace, optionally filtered by status.',
  audience: 'both',
  aiMetadata: {
    description:
      'List jobs in the authenticated Jungle Grid workspace, optionally filtered by status, with cursor-based pagination up to 100 per page. Pick this to find a job ID when none is known or to survey recent activity; if you already have a job ID, Get Job Status is more direct. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of jobs to return. Jungle Grid accepts 1 to 100.',
      required: false,
      defaultValue: 20,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Optional cursor from a previous List Jobs response.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Optional job status filter.',
      required: false,
      options: {
        options: jungleGridCommon.jobStatusValues.map((status) => ({
          label: status,
          value: status,
        })),
      },
    }),
  },
  async run(context) {
    return await jungleGridCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: jungleGridCommon.endpoints.listJobs,
      queryParams: jungleGridCommon.buildListJobsQueryParams(context.propsValue),
    });
  },
});
