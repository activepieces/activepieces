import { createAction, Property } from '@activepieces/pieces-framework';
import { Category } from '../../common/Category';
import { vtexAuth } from '../../..';

export const getCategoryById = createAction({
  auth: vtexAuth,
  name: 'get-category-by-id',
  displayName: 'Get Category',
  description: "Find a Category in your catalog by it's id",
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve a VTEX store catalog category. Pass a category ID to fetch that single category, or omit it to fetch all categories. Use to look up a category or resolve a category ID needed when creating products. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    categoryId: Property.Number({
      displayName: 'Category ID',
      description: 'The Category ID',
      required: false,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth.props;
    const { categoryId } = context.propsValue;

    const category = new Category(hostUrl, appKey, appToken);

    return await category.getCategory(categoryId);
  },
});
