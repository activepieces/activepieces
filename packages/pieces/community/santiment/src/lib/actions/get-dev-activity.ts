import { createAction, Property } from '@activepieces/pieces-framework';
import { santimentAuth } from '../common/santiment-auth';
import { santimentRequest } from '../common/santiment-api';

export const getDevActivity = createAction({
  auth: santimentAuth,
  name: 'get_dev_activity',
  displayName: 'Get Developer Activity',
  description: 'Get GitHub developer activity metric for a crypto project over time.',
  props: {
    slug: Property.ShortText({
      displayName: 'Asset Slug',
      description: 'The asset slug (e.g. ethereum, bitcoin)',
      required: true,
      defaultValue: 'ethereum',
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
  },
  async run(context) {
    const { slug, from, to, interval } = context.propsValue;
    const query = `{
      getMetric(metric: "dev_activity") {
        timeseriesData(slug: "${slug}", from: "${from}", to: "${to}", interval: "${interval ?? '1d'}") {
          datetime
          value
        }
      }
    }`;
    return await santimentRequest(context.auth as string, query);
  },
});
