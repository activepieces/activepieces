import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { orderTotalsReportOutputSchema } from '../../output-schemas';

export const wooAiGetOrderTotalsReport = createAction({
  name: 'get_order_totals_report',
  classification: 'READ',
  displayName: 'Get Order Totals Report',
  description: 'Get the number of orders in each status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns how many orders the store currently holds in each status (pending payment, processing, on hold, completed, cancelled, refunded, failed and so on), across all time. Use it for a quick overview of the order pipeline; to see the orders themselves use list_orders with a status.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: orderTotalsReportOutputSchema,
  props: {},
  async run(context) {
    return wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/reports/orders/totals',
    });
  },
});
