import { createAction, Property } from '@activepieces/pieces-framework';
import { wordpressAuth } from '../..';
import { wordpressApi } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { deleteCategoryOutputSchema } from '../output-schemas';

export const deleteCategoryAction = createAction({
  auth: wordpressAuth,
  name: 'delete_category',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Category',
  description: 'Permanently deletes a post category. This cannot be undone.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a WordPress category; categories have no trash. Posts in it keep their other categories, and posts left with none move to the default category. The site\'s default category (usually "Uncategorized") cannot be deleted and returns a 403. A repeat call fails because the category no longer exists.',
    idempotent: false,
  },
  outputSchema: deleteCategoryOutputSchema,
  props: {
    category_id: Property.Number({
      displayName: 'Category ID',
      description: 'ID of the category to delete, from list_categories.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = wordpressContent.requireWholeNumber({ value: propsValue.category_id, propName: 'Category ID' });
    return wordpressApi.forceDelete({ auth, path: `/categories/${id}` });
  },
});
