import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { topSellersReportOutputSchema } from '../../output-schemas';

export const wooAiGetTopSellersReport = createAction({
  name: 'get_top_sellers_report',
  classification: 'READ',
  displayName: 'Get Top Sellers Report',
  description: 'Get the best-selling products for a period or date range.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the best-selling products with the quantity sold for a preset period or a custom date range, highest first. Give either a period or both dates, not both; with neither, the current week is used. For money totals use get_sales_report.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: topSellersReportOutputSchema,
  props: wooProps.reportRangeProps(),
  async run(context) {
    const { period, date_min, date_max } = context.propsValue;
    return wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/reports/top_sellers',
      queryParams: wooValues.resolveReportRange({ period, dateMin: date_min, dateMax: date_max }),
    });
  },
});
