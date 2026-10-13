import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooValues } from '../../common/props';
import { productCategoryOutputSchema } from '../../output-schemas';

export const wooAiCreateProductCategory = createAction({
  name: 'create_product_category',
  classification: 'WRITE',
  displayName: 'Create Product Category',
  description: 'Create a product category.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new product category, optionally under a parent category. Look it up with list_product_categories first: a category with the same name under the same parent is rejected, and the error message then gives the existing category id to use instead.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: productCategoryOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Category name.',
      required: true,
    }),
    parent_id: Property.Number({
      displayName: 'Parent Category ID',
      description: 'Id of the parent category. Leave empty for a top-level category.',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'URL-friendly name. Generated from the name when empty.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Category description. HTML is allowed.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/products/categories',
      body: wooValues.pruneUndefined({
        name: props.name,
        parent: props.parent_id ?? undefined,
        slug: wooValues.nonEmpty(props.slug),
        description: wooValues.nonEmpty(props.description),
      }),
    });
  },
});
