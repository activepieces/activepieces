import { createAction, Property } from '@activepieces/pieces-framework';
import { xquikAuth } from '../auth';
import { xquikCommon } from '../common';

export const getTrends = createAction({
  auth: xquikAuth,
  name: 'get_trends',
  displayName: 'Get Trends',
  description: 'Get X/Twitter trending topics by region',
  props: {
    woeid: Property.Number({
      displayName: 'WOEID',
      description:
        'Yahoo Where On Earth ID. Use 1 for worldwide, 23424977 for US, 23424975 for UK, or 23424969 for Turkey.',
      required: false,
      defaultValue: 1,
    }),
    count: Property.Number({
      displayName: 'Count',
      description: 'Number of trends to return. Use 1-50.',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    return xquikCommon.api.get({
      apiKey: context.auth.secret_text,
      path: '/x/trends',
      queryParams: xquikCommon.utils.cleanQueryParams({
        count: context.propsValue.count,
        woeid: context.propsValue.woeid,
      }),
    });
  },
});
