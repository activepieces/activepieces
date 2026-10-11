import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Purchase } from '../../common/types';
import { kitPurchaseOutputSchema } from '../../output-schemas';

export const kitGetPurchase = createAction({
  auth: convertkitAuth,
  name: 'kit_get_purchase',
  classification: 'READ',
  outputSchema: kitPurchaseOutputSchema,
  displayName: 'Get Purchase',
  description: 'Get one purchase by purchase ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one purchase record by its Kit purchase ID: transaction ID, buyer email, status, currency, totals and product line items. Find the purchase ID with List Purchases.',
    idempotent: true,
  },
  props: {
    purchase_id: kitProps.id(
      'Purchase ID',
      'The Kit purchase ID, from List Purchases.'
    ),
  },
  async run(context) {
    const response = await kitClient.request<Purchase>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/purchases/${kitCommon.id({ value: context.propsValue.purchase_id, label: 'Purchase ID' })}`,
    });
    return response.body;
  },
});
