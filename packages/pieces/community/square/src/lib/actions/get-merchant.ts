import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient } from '../common/client';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const getMerchantAction = createAction({
  name: 'get_merchant',
  classification: 'READ',
  auth: squareAuth,
  displayName: 'Get Business Profile',
  description: 'Gets the connected Square business: name, country, currency and main location.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the connected Square seller profile (business name, country, default currency, main location ID). Use it to learn the currency before entering amounts, or which account a connection points at. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {},
  outputSchema: squareOutputSchemas.merchant,
  async run(context) {
    const body = await squareClient.request<unknown>({ auth: context.auth, method: HttpMethod.GET, path: ['v2', 'merchants', 'me'], operation: 'read the business profile' });
    return squareShape.merchant(squareShape.requireObject({ body, key: 'merchant', what: 'merchant' }));
  },
});
