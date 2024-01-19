import { createAction, Property } from '@activepieces/pieces-framework';
import { Brand } from '../../common/Brand';
import { vtexAuth } from '../../..';

export const getBrandById = createAction({
  auth: vtexAuth,
  name: 'get-brand-by-id',
  displayName: 'Get Brand By ID',
  description: "Find a Brand in your catalog by it's id",
  props: {
    BrandId: Property.Number({
      displayName: 'Brand ID',
      description: 'The Brand ID',
      required: true,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth;
    const { BrandId } = context.propsValue;

    const brand = new Brand(hostUrl, appKey, appToken);

    return await brand.getBrandById(BrandId);
  },
});
