import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { workdayAuth } from '../common/auth';

export const getWorkerTimeOffEntries = createAction({
  auth: workdayAuth,
  name: 'get_worker_time_off_entries',
  displayName: 'Get Worker Time Off Entries',
  description:
    'Retrieves approved and submitted time-off entries for a worker within a date range.',
  props: {
    worker_id: Property.ShortText({
      displayName: 'Worker ID',
      description: 'The Workday Worker ID (WID) of the employee.',
      required: true,
    }),
    from_date: Property.ShortText({
      displayName: 'From Date',
      description: 'Start of the date range to filter time-off entries (YYYY-MM-DD).',
      required: false,
    }),
    to_date: Property.ShortText({
      displayName: 'To Date',
      description: 'End of the date range to filter time-off entries (YYYY-MM-DD).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of entries to return (default: 20).',
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
    const { worker_id, from_date, to_date, limit, offset } = context.propsValue;

    const queryParams: Record<string, string> = {
      limit: String(limit ?? 20),
      offset: String(offset ?? 0),
    };

    if (from_date) {
      queryParams['fromDate'] = from_date;
    }
    if (to_date) {
      queryParams['toDate'] = to_date;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${hostname}/ccx/api/staffing/v6/${tenant}/workers/${worker_id}/timeOff`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      queryParams,
    });

    return response.body;
  },
});
