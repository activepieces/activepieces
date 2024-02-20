import { createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../..';
import { makeClient, quickzuCommon } from '../../common';

export const deleteCategoryAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_delete_category',
  displayName: 'Delete Category',
  description: 'Deletes an existing category from store.',
  props: {
    categoryId: quickzuCommon.categoryId(true),
  },
  async run(context) {
    const { categoryId } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.deleteCategory(categoryId!);
  },
});
