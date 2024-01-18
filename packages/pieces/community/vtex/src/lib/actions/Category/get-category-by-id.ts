import { createAction, Property } from '@activepieces/pieces-framework';
import { Category } from '../../common/Category';
import { vtexAuth } from '../../..';

export const getCategoryById = createAction({
  auth: vtexAuth,
  name: 'get-category-by-id',
  displayName: 'Get Category',
  description: "Find a Category in your catalog by it's id",
  props: {
    categoryId: Property.Number({
      displayName: 'Category ID',
      description: 'The Category ID',
      required: false,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth;
    const { categoryId } = context.propsValue;

    const category = new Category(hostUrl, appKey, appToken);

    return await category.getCategory(categoryId);
  },
});
