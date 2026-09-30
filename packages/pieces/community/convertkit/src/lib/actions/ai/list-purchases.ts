import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Purchase } from '../../common/types';
import { kitListPurchasesOutputSchema } from '../../output-schemas';

export const kitListPurchases = createAction({
  auth: convertkitAuth,
  name: 'kit_list_purchases',
  classification: 'SEARCH',
  outputSchema: kitListPurchasesOutputSchema,
  displayName: 'List Purchases',
  description: 'List the purchases recorded in the account, 50 per page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists purchase records in the account, newest pages last, 50 per page, with total counts for paging. Each purchase has its transaction ID, buyer email, currency, totals and products. There is no filter by buyer on this endpoint.',
    idempotent: true,
  },
  props: {
    page: kitProps.page('Page number, 50 purchases per page. Defaults to 1.'),
  },
  async run(context) {
    const response = await kitClient.request<{
      purchases: Purchase[];
      page: number;
      total_pages: number;
      total_purchases: number;
    }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/purchases',
      query: { page: kitCommon.page(context.propsValue.page) },
    });
    return {
      purchases: response.body.purchases ?? [],
      page: response.body.page,
      total_pages: response.body.total_pages,
      total_purchases: response.body.total_purchases,
    };
  },
});
