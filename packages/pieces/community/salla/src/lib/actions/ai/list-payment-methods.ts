import { createAction } from '@activepieces/pieces-framework';
import { sallaUtils } from '../../common/helpers';
import { sallaAuth } from '../../auth';
import { sallaApi } from '../../common/client';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiListPaymentMethodsAction = createAction({
  auth: sallaAuth,
  name: 'ai_list_payment_methods',
  classification: 'SEARCH',
  displayName: 'List Payment Methods',
  description: 'Lists the payment methods available to the store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the payment methods Salla offers the store, each with id, slug (for example mada, credit_card, cod, bank, apple_pay) and name. Call it to get valid slugs for the payment_methods filter of List Orders and the payment_method field of Update Order; Create Order accepts only credit_card, mada, bank, cod and subscription.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.paymentMethods,
  props: {},
  async run({ auth }) {
    const { items, truncated } = await sallaApi.fetchPaged<unknown>({
      auth,
      path: '/payment/methods',
      maxItems: MAX_ITEMS,
    });
    const paymentMethods = items.filter(sallaApi.isRecord).map((record) => sallaUtils.withKeys({ record, keys: PAYMENT_METHOD_KEYS }));
    return { payment_methods: paymentMethods, count: paymentMethods.length, truncated };
  },
});


const MAX_ITEMS = 200;
const PAYMENT_METHOD_KEYS = ['id', 'slug', 'name'];
