import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { listOrderRefundsOutputSchema } from '../../output-schemas';

export const wooAiListOrderRefunds = createAction({
  name: 'list_order_refunds',
  classification: 'SEARCH',
  displayName: 'List Order Refunds',
  description: 'List the refunds recorded on an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the refunds already recorded on one order, with amount, reason and whether money was sent back through the gateway. Check it before create_order_refund to avoid refunding twice. Paged: if a page returns exactly per_page items, request the next page.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: listOrderRefundsOutputSchema,
  props: {
    order_id: Property.Number({
      displayName: 'Order ID',
      description: 'Id of the order.',
      required: true,
    }),
    page: wooProps.pageProp(),
    per_page: wooProps.perPageProp(),
  },
  async run(context) {
    const props = context.propsValue;
    const paging = await wooValues.paging({ page: props.page, perPage: props.per_page });
    return wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/orders/${wooClient.encodeId(props.order_id)}/refunds`,
      queryParams: { ...paging },
    });
  },
});
