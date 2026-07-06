import { createAction, Property } from '@activepieces/pieces-framework';
import { Brand } from '../../common/Brand';
import { vtexAuth } from '../../..';

export const getBrandList = createAction({
  auth: vtexAuth,
  name: 'get-brand-list',
  displayName: 'Get Brand List',
  description: 'Find all Brands in your catalog',
  audience: 'both',
  aiMetadata: {
    description:
      'List all brands in a VTEX store catalog. Use to enumerate brands or to resolve a brand name to its ID before creating or updating products. Takes no input; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth.props;

    const brand = new Brand(hostUrl, appKey, appToken);

    return await brand.getBrandList();
  },
});
