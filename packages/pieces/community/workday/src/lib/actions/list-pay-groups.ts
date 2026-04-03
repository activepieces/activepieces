import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { workdayAuth } from '../common/auth';

export const listPayGroups = createAction({
  auth: workdayAuth,
  name: 'list_pay_groups',
  displayName: 'List Pay Groups',
  description:
    'Retrieves pay groups filtered by country. Use the country ID to map workers to their jurisdiction for VAT registration determination.',
  props: {
    country_id: Property.ShortText({
      displayName: 'Country ID',
      description:
        'The Workday ID of the country or territory to filter pay groups by. Leave blank to return all pay groups.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pay groups to return (default: 20, max: 100).',
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
    const { country_id, limit, offset } = context.propsValue;

    const queryParams: Record<string, string> = {
      limit: String(limit ?? 20),
      offset: String(offset ?? 0),
    };

    if (country_id) {
      queryParams['country'] = country_id;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${hostname}/ccx/api/payroll/v2/${tenant}/payGroups`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      queryParams,
    });

    return response.body;
  },
});
