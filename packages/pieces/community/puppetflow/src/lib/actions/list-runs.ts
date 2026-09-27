import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { puppetflowAuth } from '../auth';
import {
  flowPath,
  PuppetflowPaginatedRuns,
  puppetflowRequest,
} from '../common/client';
import {
  credentialsOf,
  flowIdDropdown,
  includeCodeCheckbox,
  includeLogsCheckbox,
  runStatusDropdown,
} from '../common/props';

export const listRunsAction = createAction({
  auth: puppetflowAuth,
  name: 'list_runs',
  displayName: 'List Runs',
  description: 'Get a paginated list of runs for a flow',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the runs of one Puppetflow flow with pagination and an optional status filter. Returns run objects plus pagination metadata. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    flowId: flowIdDropdown,
    status: runStatusDropdown,
    perPage: Property.Number({
      displayName: 'Per Page',
      description: 'Number of runs per page',
      required: false,
      defaultValue: 20,
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
    }),
    includeLogs: includeLogsCheckbox,
    includeCode: includeCodeCheckbox,
  },
  async run(context) {
    const { flowId, status, perPage, page, includeLogs, includeCode } =
      context.propsValue;
    return puppetflowRequest<PuppetflowPaginatedRuns>({
      credentials: credentialsOf(context.auth),
      method: HttpMethod.GET,
      path: `${flowPath(flowId)}/runs`,
      query: {
        status,
        per_page: perPage ?? 20,
        page: page ?? 1,
        logs: includeLogs ? 1 : undefined,
        code: includeCode ? 1 : undefined,
      },
    });
  },
});
