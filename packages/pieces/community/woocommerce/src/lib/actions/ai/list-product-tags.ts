import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { listProductTagsOutputSchema } from '../../output-schemas';

export const wooAiListProductTags = createAction({
  name: 'list_product_tags',
  classification: 'SEARCH',
  displayName: 'List Product Tags',
  description: 'List product tags, optionally filtered by name or slug.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists product tags with their ids, slugs and product counts. Use it to find a tag id for list_products, create_product or update_product, and before create_product_tag to avoid a duplicate. Paged: if a page returns exactly per_page items, request the next page.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: listProductTagsOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Text to match against tag names.',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'Exact tag slug.',
      required: false,
    }),
    hide_empty: Property.Checkbox({
      displayName: 'Hide Empty',
      description: 'When on, tags without products are left out.',
      required: false,
      defaultValue: false,
    }),
    page: wooProps.pageProp(),
    per_page: wooProps.perPageProp(),
  },
  async run(context) {
    const props = context.propsValue;
    const paging = await wooValues.paging({ page: props.page, perPage: props.per_page });
    return wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/products/tags',
      queryParams: {
        search: wooValues.nonEmpty(props.search),
        slug: wooValues.nonEmpty(props.slug),
        hide_empty: props.hide_empty === true ? true : undefined,
        ...paging,
      },
    });
  },
});
