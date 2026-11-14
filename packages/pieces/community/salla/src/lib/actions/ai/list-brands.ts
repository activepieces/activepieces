import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaUtils } from '../../common/helpers';
import { sallaOutputSchemas } from '../../common/output-schemas';
import { sallaProducts } from '../../common/products';

export const aiListBrandsAction = createAction({
  auth: sallaAuth,
  name: 'ai_list_brands',
  classification: 'SEARCH',
  displayName: 'List Brands',
  description: 'Lists the store product brands.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Salla store\'s product brands with id, name, description, logo and status. Call it to get the brand_id that Create Product and Update Product take. Returns up to 500 brands and truncated=true when more exist.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.brandList,
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Optional text to match in the brand name, for example Nike. Leave empty to list all brands.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { brands, count, truncated } = await sallaProducts.listBrands({ auth, keyword: propsValue.keyword });
    return {
      brands: brands.map((record) => sallaUtils.withKeys({ record, keys: BRAND_KEYS })),
      count,
      truncated,
    };
  },
});

const BRAND_KEYS = ['id', 'name', 'description', 'logo', 'banner', 'status', 'en_char', 'ar_char'];
