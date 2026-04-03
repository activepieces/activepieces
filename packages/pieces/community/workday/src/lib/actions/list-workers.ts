import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { workdayAuth } from '../common/auth';

export const listWorkers = createAction({
  auth: workdayAuth,
  name: 'list_workers',
  displayName: 'List Workers',
  description: 'Retrieves a list of workers and their current staffing information.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of workers to return (default: 20).',
      required: false,
      defaultValue: 20,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of workers to skip before returning results. Use for pagination.',
      required: false,
      defaultValue: 0,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter workers by name or other searchable fields.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const { hostname, tenant } = auth.props!;
    const { limit, offset, search } = context.propsValue;

    const queryParams: Record<string, string> = {
      limit: String(limit ?? 20),
      offset: String(offset ?? 0),
    };

    if (search) {
      queryParams['search'] = search;
    }

    const response = await httpClient.sendRequest<{ data: unknown[] }>({
      method: HttpMethod.GET,
      url: `https://${hostname}/ccx/api/staffing/v6/${tenant}/workers`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      queryParams,
    });

    return response.body;
  },
});
