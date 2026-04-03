import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { workdayAuth } from '../common/auth';

export const getWorkerAbsenceBalances = createAction({
  auth: workdayAuth,
  name: 'get_worker_absence_balances',
  displayName: 'Get Worker Absence Balances',
  description:
    'Retrieves absence balances for a worker, including remaining quotas per absence type.',
  props: {
    worker_id: Property.ShortText({
      displayName: 'Worker ID',
      description: 'The Workday Worker ID (WID) of the employee.',
      required: true,
    }),
    category: Property.ShortText({
      displayName: 'Category ID',
      description:
        'Filter by absence type category WID. Time Off: 17bd6531c90c100016d4b06f2b8a07ce, Leave of Absence Type: 17bd6531c90c100016d74f8dfae007d0, Absence Table: 17bd6531c90c100016da3f5b554007d2.',
      required: false,
    }),
    effective: Property.ShortText({
      displayName: 'Effective Date',
      description: 'Return balances as of this date (YYYY-MM-DD).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of balances to return (default: 20, max: 100).',
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
    const { worker_id, category, effective, limit, offset } = context.propsValue;

    const queryParams: Record<string, string> = {
      worker: worker_id,
      limit: String(limit ?? 20),
      offset: String(offset ?? 0),
    };

    if (category) {
      queryParams['category'] = category;
    }
    if (effective) {
      queryParams['effective'] = effective;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${hostname}/ccx/api/absenceManagement/v5/${tenant}/balances`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      queryParams,
    });

    return response.body;
  },
});
