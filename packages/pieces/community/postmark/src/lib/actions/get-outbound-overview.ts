import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postmarkAuth } from '../auth';
import { postmarkApiRequest } from '../common';

export const getOutboundOverview = createAction({
  auth: postmarkAuth,
  name: 'get_outbound_overview',
  displayName: 'Get Outbound Overview',
  description:
    'Get outbound email statistics including sent, bounced, opens, and clicks',
  props: {
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Filter by tag',
      required: false,
    }),
    fromDate: Property.ShortText({
      displayName: 'From Date',
      description: 'Start date (format: YYYY-MM-DD)',
      required: false,
    }),
    toDate: Property.ShortText({
      displayName: 'To Date',
      description: 'End date (format: YYYY-MM-DD)',
      required: false,
    }),
    messageStream: Property.ShortText({
      displayName: 'Message Stream',
      description: 'Filter by message stream ID',
      required: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};

    if (context.propsValue.tag) {
      queryParams['tag'] = context.propsValue.tag;
    }
    if (context.propsValue.fromDate) {
      queryParams['fromdate'] = context.propsValue.fromDate;
    }
    if (context.propsValue.toDate) {
      queryParams['todate'] = context.propsValue.toDate;
    }
    if (context.propsValue.messageStream) {
      queryParams['messagestream'] = context.propsValue.messageStream;
    }

    return await postmarkApiRequest({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: '/stats/outbound',
      queryParams,
    });
  },
});
