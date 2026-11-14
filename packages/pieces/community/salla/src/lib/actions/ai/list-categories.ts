import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaOutputSchemas } from '../../common/output-schemas';
import { sallaProducts } from '../../common/products';

export const aiListCategoriesAction = createAction({
  auth: sallaAuth,
  name: 'ai_list_categories',
  classification: 'SEARCH',
  displayName: 'List Categories',
  description: 'Lists the store product categories.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Salla store\'s product categories as one flat list, sub-categories included, each with id, name, full path (for example Clothes > Shirts), parent_id and depth. Call it to get the category IDs that Create Product and Update Product take in category_ids and that List Products filters by. Returns up to 500 categories and truncated=true when more exist.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.categoryList,
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Optional text to match in the category name, for example Shirts. Leave empty to list all categories.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaProducts.listCategories({ auth, keyword: propsValue.keyword });
  },
});
