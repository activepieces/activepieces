import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../..';
import { makeClient, quickzuCommon } from '../../common';

export const updateCategoryAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_update_category',
  displayName: 'Update Category',
  description: 'Updates an existing category in store.',
  props: {
    categoryId: quickzuCommon.categoryId(true),
    name: Property.ShortText({
      displayName: 'Category Name',
      required: false,
    }),
    status: Property.Checkbox({
      displayName: 'Category Status',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { categoryId, name, status } = context.propsValue;

    const client = makeClient(context.auth);

    return await client.updateCategory(categoryId!, { name, status });
  },
});
