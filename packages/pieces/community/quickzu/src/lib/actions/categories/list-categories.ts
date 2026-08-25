import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../auth';
import { makeClient } from '../../common';

export const listCategoriesAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_list_categories',
  displayName: 'List Categories',
  description: 'Retrieves all categories from store.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves categories from a Quickzu store. With no search term it returns all categories; supplying a name term filters to matches. Use to look up categories or resolve a category ID before another action. Idempotent read-only lookup.',
    idempotent: true,
  },
  props: {
    term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Category name that need to be search.',
      required: false,
    }),
  },
  async run(context) {
    const { term } = context.propsValue;

    const client = makeClient(context.auth);
    return client.listCategories(term);
  },
});
