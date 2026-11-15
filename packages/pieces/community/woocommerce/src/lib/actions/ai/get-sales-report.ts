import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { salesReportOutputSchema } from '../../output-schemas';

export const wooAiGetSalesReport = createAction({
  name: 'get_sales_report',
  classification: 'READ',
  displayName: 'Get Sales Report',
  description: 'Get sales totals for a period or date range.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns store sales totals (gross and net sales, orders, items, tax, shipping, refunds, discounts) for a preset period or a custom date range, plus a per-day or per-month breakdown. Give either a period or both dates, not both; with neither, the current week is used. For best-selling products use get_top_sellers_report; for order counts by status use get_order_totals_report.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: salesReportOutputSchema,
  props: wooProps.reportRangeProps(),
  async run(context) {
    const { period, date_min, date_max } = context.propsValue;
    return wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/reports/sales',
      queryParams: wooValues.resolveReportRange({ period, dateMin: date_min, dateMax: date_max }),
    });
  },
});
