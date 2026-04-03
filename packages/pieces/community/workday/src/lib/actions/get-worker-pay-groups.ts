import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { workdayAuth } from '../common/auth';

export const getWorkerPayGroups = createAction({
  auth: workdayAuth,
  name: 'get_worker_pay_groups',
  displayName: 'Get Worker Pay Group Assignments',
  description:
    "Retrieves the pay group assignments for a worker, confirming which country's tax authority the worker belongs to.",
  props: {
    worker_id: Property.ShortText({
      displayName: 'Worker ID',
      description: 'The Workday Worker ID (WID) of the employee.',
      required: true,
    }),
    effective: Property.ShortText({
      displayName: 'Effective Date',
      description: 'Return pay group assignments effective as of this date (YYYY-MM-DD).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 20, max: 100).',
      required: false,
      defaultValue: 20,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of entries to skip before returning results. Use for pagination.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const { hostname, tenant } = auth.props!;
    const { worker_id, effective, limit, offset } = context.propsValue;

    const queryParams: Record<string, string> = {
      limit: String(limit ?? 20),
      offset: String(offset ?? 0),
    };

    if (effective) {
      queryParams['effective'] = effective;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${hostname}/ccx/api/payroll/v2/${tenant}/workers/${worker_id}/payGroups`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      queryParams,
    });

    return response.body;
  },
});
