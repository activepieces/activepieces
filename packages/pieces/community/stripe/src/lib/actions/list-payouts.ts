import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListPayouts = createAction({
  name: 'list_payouts',
  auth: stripeAuth,
  displayName: 'List Payouts (Agent)',
  description: 'List payouts to the bank account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through payouts (funds sent to your bank account), newest first, optionally filtered by status or arrival date. Use to enumerate payouts or resolve a payout ID; use Get Payout when you have the po_ ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'In Transit', value: 'in_transit' },
          { label: 'Paid', value: 'paid' },
          { label: 'Failed', value: 'failed' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
    arrival_date_after: Property.DateTime({
      displayName: 'Arrival Date After',
      required: false,
    }),
    arrival_date_before: Property.DateTime({
      displayName: 'Arrival Date Before',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  async run(context) {
    const { status, arrival_date_after, arrival_date_before, limit } =
      context.propsValue;

    const queryParams: QueryParams = {};
    if (status) queryParams['status'] = status;
    if (limit) queryParams['limit'] = limit.toString();
    if (arrival_date_after) {
      queryParams['arrival_date[gte]'] = Math.floor(
        new Date(arrival_date_after).getTime() / 1000
      ).toString();
    }
    if (arrival_date_before) {
      queryParams['arrival_date[lte]'] = Math.floor(
        new Date(arrival_date_before).getTime() / 1000
      ).toString();
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/payouts`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
