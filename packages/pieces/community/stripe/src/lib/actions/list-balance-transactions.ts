import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListBalanceTransactions = createAction({
  name: 'list_balance_transactions',
  auth: stripeAuth,
  displayName: 'List Balance Transactions (Agent)',
  description: 'List balance transactions (the reconciliation ledger).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through the balance-transaction ledger — every item that affected the account balance (charges, refunds, fees, payouts), newest first. Optionally filter by type, payout, or created range. Use to reconcile activity to a payout. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    type: Property.ShortText({
      displayName: 'Type',
      description: 'Filter by transaction type (e.g., charge, refund, payout).',
      required: false,
    }),
    payout: Property.ShortText({
      displayName: 'Payout ID',
      description: 'Filter to transactions paid out in this payout (po_...).',
      required: false,
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  async run(context) {
    const { type, payout, created_after, created_before, limit } =
      context.propsValue;

    const queryParams: QueryParams = {};
    if (type) queryParams['type'] = type;
    if (payout) queryParams['payout'] = payout;
    if (limit) queryParams['limit'] = limit.toString();
    if (created_after) {
      queryParams['created[gte]'] = Math.floor(
        new Date(created_after).getTime() / 1000
      ).toString();
    }
    if (created_before) {
      queryParams['created[lte]'] = Math.floor(
        new Date(created_before).getTime() / 1000
      ).toString();
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/balance_transactions`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
