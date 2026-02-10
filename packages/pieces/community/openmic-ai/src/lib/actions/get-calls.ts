import { createAction, Property } from '@activepieces/pieces-framework';
import { openmicAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const getCalls = createAction({
  auth: openmicAiAuth,
  name: 'getCalls',
  displayName: 'Get Calls',
  description: 'Retrieve all calls with optional filtering and pagination',
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filter by customer ID',
      required: false,
    }),
    fromNumber: Property.ShortText({
      displayName: 'From Number',
      description: 'Filter by originating phone number',
      required: false,
    }),
    toNumber: Property.ShortText({
      displayName: 'To Number',
      description: 'Filter by destination phone number',
      required: false,
    }),
    botId: Property.ShortText({
      displayName: 'Bot ID',
      description: 'Filter by bot ID',
      required: false,
    }),
    fromDate: Property.ShortText({
      displayName: 'From Date',
      description: 'Filter calls from this date (ISO 8601 format)',
      required: false,
    }),
    toDate: Property.ShortText({
      displayName: 'To Date',
      description: 'Filter calls to this date (ISO 8601 format)',
      required: false,
    }),
    callStatus: Property.StaticDropdown({
      displayName: 'Call Status',
      description: 'Filter by call status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Registered', value: 'registered' },
          { label: 'Ongoing', value: 'ongoing' },
          { label: 'Ended', value: 'ended' },
          { label: 'Error', value: 'error' },
        ],
      },
    }),
    callType: Property.StaticDropdown({
      displayName: 'Call Type',
      description: 'Filter by call type',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Phone Call', value: 'phonecall' },
          { label: 'Web Call', value: 'webcall' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of calls to return (1-100)',
      required: false,
      defaultValue: 10,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of calls to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();

    if (context.propsValue.limit) {
      params.append('limit', String(context.propsValue.limit));
    }

    if (context.propsValue.offset !== undefined) {
      params.append('offset', String(context.propsValue.offset));
    }

    if (context.propsValue.customerId) {
      params.append('customer_id', context.propsValue.customerId);
    }

    if (context.propsValue.fromNumber) {
      params.append('from_number', context.propsValue.fromNumber);
    }

    if (context.propsValue.toNumber) {
      params.append('to_number', context.propsValue.toNumber);
    }

    if (context.propsValue.botId) {
      params.append('bot_id', context.propsValue.botId);
    }

    if (context.propsValue.fromDate) {
      params.append('from_date', context.propsValue.fromDate);
    }

    if (context.propsValue.toDate) {
      params.append('to_date', context.propsValue.toDate);
    }

    if (context.propsValue.callStatus) {
      params.append('call_status', context.propsValue.callStatus);
    }

    if (context.propsValue.callType) {
      params.append('call_type', context.propsValue.callType);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/calls?${queryString}` : '/calls';

    const response = await makeRequest(context.auth, HttpMethod.GET, endpoint);

    return response;
  },
});
