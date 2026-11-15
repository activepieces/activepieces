import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { listProductCategoriesOutputSchema } from '../../output-schemas';

export const wooAiListProductCategories = createAction({
  name: 'list_product_categories',
  classification: 'SEARCH',
  displayName: 'List Product Categories',
  description: 'List product categories, optionally filtered by name, slug or parent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists product categories with their ids, slugs, parents and product counts. Use it to find a category id for list_products, create_product or update_product, and before create_product_category to avoid a duplicate. Paged: if a page returns exactly per_page items, request the next page.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: listProductCategoriesOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Text to match against category names.',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'Exact category slug.',
      required: false,
    }),
    parent_id: Property.Number({
      displayName: 'Parent Category ID',
      description: 'Only return direct children of this category. Use 0 for top-level categories.',
      required: false,
    }),
    hide_empty: Property.Checkbox({
      displayName: 'Hide Empty',
      description: 'When on, categories without products are left out.',
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
      path: '/products/categories',
      queryParams: {
        search: wooValues.nonEmpty(props.search),
        slug: wooValues.nonEmpty(props.slug),
        parent: props.parent_id,
        hide_empty: props.hide_empty === true ? true : undefined,
        ...paging,
      },
    });
  },
});
