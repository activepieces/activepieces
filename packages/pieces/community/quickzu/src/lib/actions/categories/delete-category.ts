import { createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../auth';
import { quickzuOutputSchemas } from '../../common/output-schemas';
import { makeClient, quickzuCommon, requireValue } from '../../common';

export const deleteCategoryAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_delete_category',
  outputSchema: quickzuOutputSchemas.statusMessage,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Category',
  description: 'Deletes an existing category from store.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently removes a category from a Quickzu store by its category ID. Use to delete a catalog category. Not idempotent: deleting a category that is already gone or does not exist fails with an error.',
    idempotent: false,
  },
  props: {
    categoryId: quickzuCommon.categoryId(true),
  },
  async run(context) {
    const { categoryId } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.deleteCategory(requireValue({ value: categoryId, label: 'Category' }));
  },
});
