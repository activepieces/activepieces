import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../auth';
import { makeClient } from '../../common';

export const createCategoryAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_create_category',
  displayName: 'Create Category',
  description: 'Creates a new category in store.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new product category in a Quickzu store from a name and active status. Use to add a category before assigning products to it. Not idempotent: each call creates a separate category even with the same name.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Category Name',
      required: true,
    }),
    status: Property.Checkbox({
      displayName: 'Category Status',
      required: true,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { name, status } = context.propsValue;

    const client = makeClient(context.auth);

    return await client.createCategory({ name, status });
  },
});
