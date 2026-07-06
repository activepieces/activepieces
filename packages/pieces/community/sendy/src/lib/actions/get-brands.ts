import { createAction } from '@activepieces/pieces-framework';
import { getBrands } from '../api';
import { sendyAuth } from '../auth';

export const getBrandsAction = createAction({
  name: 'get_brands',
  auth: sendyAuth,
  displayName: 'Get Brands',
  description: 'Get a list of brands from Sendy',
  audience: 'both',
  aiMetadata: { description: 'Retrieves all brands configured in the connected Sendy installation. Use to discover available brand IDs, e.g. before listing a brand\'s lists. Takes no input and is read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    return await getBrands(context.auth);
  },
});
