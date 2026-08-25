import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../auth';
import { makeClient, quickzuCommon } from '../../common';

export const updateCategoryAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_update_category',
  displayName: 'Update Category',
  description: 'Updates an existing category in store.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing Quickzu category identified by its category ID, changing its name and/or active status. Use to rename a category or toggle its visibility. Idempotent: repeating with the same input leaves the category in the same state.',
    idempotent: true,
  },
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
