import { createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../auth';
import { makeClient, quickzuCommon } from '../../common';

export const deleteCategoryAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_delete_category',
  displayName: 'Delete Category',
  description: 'Deletes an existing category from store.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently removes a category from a Quickzu store by its category ID. Use to delete a catalog category. Idempotent: once the category is gone, repeating the call leaves the store in the same state.',
    idempotent: true,
  },
  props: {
    categoryId: quickzuCommon.categoryId(true),
  },
  async run(context) {
    const { categoryId } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.deleteCategory(categoryId!);
  },
});
