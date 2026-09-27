import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { puppetflowAuth } from '../auth';
import { PuppetflowPaginatedRuns, puppetflowRequest } from '../common/client';
import {
  credentialsOf,
  optionalFlowIdDropdown,
  runStatusesDropdown,
} from '../common/props';

export const searchRunsAction = createAction({
  auth: puppetflowAuth,
  name: 'search_runs',
  displayName: 'Search Runs',
  description: 'Search runs across flows with the same filters as the Runs page',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Puppetflow runs across all accessible flows by text, status, date range, duration, legend, or triggering user. Returns run objects plus pagination metadata. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    flowId: optionalFlowIdDropdown,
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Run ID or flow name',
      required: false,
    }),
    statuses: runStatusesDropdown,
    legend: Property.ShortText({
      displayName: 'Legend',
      description: 'Filter by run legend',
      required: false,
    }),
    dateFrom: Property.DateTime({
      displayName: 'Created After',
      required: false,
    }),
    dateTo: Property.DateTime({
      displayName: 'Created Before',
      required: false,
    }),
    durationMinSeconds: Property.Number({
      displayName: 'Minimum Duration (seconds)',
      required: false,
    }),
    durationMaxSeconds: Property.Number({
      displayName: 'Maximum Duration (seconds)',
      required: false,
    }),
    triggeredBy: Property.ShortText({
      displayName: 'Triggered By',
      description: 'ID of the user who triggered the run (user_...)',
      required: false,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      description: 'Number of runs per page, up to 100',
      required: false,
      defaultValue: 50,
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const {
      flowId,
      search,
      statuses,
      legend,
      dateFrom,
      dateTo,
      durationMinSeconds,
      durationMaxSeconds,
      triggeredBy,
      perPage,
      page,
    } = context.propsValue;

    return puppetflowRequest<PuppetflowPaginatedRuns>({
      credentials: credentialsOf(context.auth),
      method: HttpMethod.GET,
      path: '/runs/search',
      query: {
        flow_id: flowId,
        flow_search: search,
        statuses: statuses && statuses.length > 0 ? statuses : undefined,
        legend,
        date_from: dateFrom,
        date_to: dateTo,
        duration_min_ms:
          durationMinSeconds !== undefined && durationMinSeconds !== null
            ? Math.round(durationMinSeconds * 1000)
            : undefined,
        duration_max_ms:
          durationMaxSeconds !== undefined && durationMaxSeconds !== null
            ? Math.round(durationMaxSeconds * 1000)
            : undefined,
        triggered_by: triggeredBy,
        per_page: perPage ?? 50,
        page: page ?? 1,
      },
    });
  },
});
