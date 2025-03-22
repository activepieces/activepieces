import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const merchantAccountGetTransactions = createAction({
  auth: trueLayerCommon.auth,
  name: 'merchant-account-get-transactions',
  displayName: 'Get Transactions',
  description: 'Get the transactions of a single merchant account. If pagination is missing, add a header `tl-enable-pagination: true` to enable pagination.',
  props: {
    id: Property.ShortText({
      displayName: 'Merchant Account ID',
      description: 'The ID of the merchant account to return the transactions for.',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'Start Timestamp',
      description: 'Timestamp for the start of the range to query (inclusive). Uses the ISO-8601 format of YYYY-MM-DDTHH:MM:SS±HHMM.',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'End Timestamp',
      description: 'Timestamp for the end of the range to query (inclusive). Uses the ISO-8601 format of YYYY-MM-DDTHH:MM:SS±HHMM.',
      required: true,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor used for pagination purposes, returned as `next_cursor` in the response payload of the initial request. Not required for the first page.',
      required: false,
    }),
    type: Property.ShortText({
      displayName: 'Transaction Type',
      description: 'Filters transactions by payments or payouts. If omitted, both are returned.',
      required: false,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/merchant-accounts/${ctx.propsValue.id}/transactions`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
        'tl-enable-pagination': 'true',
      },
      queryParams: {
        from: ctx.propsValue.from,
        to: ctx.propsValue.to,
        cursor: ctx.propsValue.cursor || '',
        type: ctx.propsValue.type || '',
      },
    })

    return response.body;
  },
});
