import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooValues } from '../../common/props';
import { productTagOutputSchema } from '../../output-schemas';

export const wooAiCreateProductTag = createAction({
  name: 'create_product_tag',
  classification: 'WRITE',
  displayName: 'Create Product Tag',
  description: 'Create a product tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new product tag. Look it up with list_product_tags first: a tag with the same name is rejected, and the error message then gives the existing tag id to use instead.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: productTagOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Tag name.',
      required: true,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'URL-friendly name. Generated from the name when empty.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Tag description.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/products/tags',
      body: wooValues.pruneUndefined({
        name: props.name,
        slug: wooValues.nonEmpty(props.slug),
        description: wooValues.nonEmpty(props.description),
      }),
    });
  },
});
