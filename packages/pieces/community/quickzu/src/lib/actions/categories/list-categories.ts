import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../../';
import { makeClient } from '../../common';

export const listCategoriesAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_list_categories',
  displayName: 'List Categories',
  description: 'Retrieves all categories from store.',
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
