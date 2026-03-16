import { createAction, Property } from '@activepieces/pieces-framework';
import { santimentAuth } from '../common/santiment-auth';
import { santimentRequest } from '../common/santiment-api';

export const getExchangeFlows = createAction({
  auth: santimentAuth,
  name: 'get_exchange_flows',
  displayName: 'Get Exchange Flows',
  description: 'Get exchange inflow/outflow data for whale tracking.',
  props: {
    slug: Property.ShortText({
      displayName: 'Asset Slug',
      description: 'The asset slug (e.g. bitcoin, ethereum)',
      required: true,
      defaultValue: 'bitcoin',
    }),
    from: Property.ShortText({
      displayName: 'From Date',
      description: 'Start date in ISO format (e.g. 2024-01-01T00:00:00Z)',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To Date',
      description: 'End date in ISO format (e.g. 2024-01-07T00:00:00Z)',
      required: true,
    }),
    interval: Property.ShortText({
      displayName: 'Interval',
      description: 'Time interval (e.g. 1d, 1h, 7d)',
      required: false,
      defaultValue: '1d',
    }),
    flowType: Property.StaticDropdown({
      displayName: 'Flow Type',
      description: 'Select inflow or outflow metric',
      required: true,
      defaultValue: 'exchange_inflow',
      options: {
        options: [
          { label: 'Exchange Inflow', value: 'exchange_inflow' },
          { label: 'Exchange Outflow', value: 'exchange_outflow' },
        ],
      },
    }),
  },
  async run(context) {
    const { slug, from, to, interval, flowType } = context.propsValue;
    const query = `{
      getMetric(metric: "${flowType}") {
        timeseriesData(slug: "${slug}", from: "${from}", to: "${to}", interval: "${interval ?? '1d'}") {
          datetime
          value
        }
      }
    }`;
    return await santimentRequest(context.auth as string, query);
  },
});
