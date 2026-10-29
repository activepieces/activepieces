import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const listCategoriesAction = createAction({
  auth: discourseAuth,
  name: 'list_categories',
  classification: 'SEARCH',
  displayName: 'List Categories',
  description: 'Lists all Discourse categories, including subcategories.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List every Discourse category the API user can see, with subcategories flattened (parent_category_id set). Use it to find the numeric Category ID that other actions need. Read-only.',
    idempotent: true,
  },
  props: {
    include_parent: Property.Checkbox({
      displayName: 'Include Subcategories',
      description: 'On by default. Turn off for top-level categories only.',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: discourseSchemas.categoryList,
  async run({ auth, propsValue }) {
    const includeSub = propsValue.include_parent !== false;
    const body = discourseMap.rec(
      await discourseRequest({
        auth: auth.props,
        method: HttpMethod.GET,
        path: '/categories.json',
        query: { include_subcategories: includeSub ? 'true' : undefined },
      }),
    );
    const base = discourseOps.baseUrl(auth.props);
    const top = discourseMap.list(discourseMap.rec(body['category_list'])['categories']).map(discourseMap.rec);
    const all = top.flatMap((category) => [
      category,
      ...(includeSub
        ? discourseMap
            .list(category['subcategory_list'])
            .map(discourseMap.rec)
            .map((child) => ({ ...child, parent_category_id: child['parent_category_id'] ?? category['id'] }))
        : []),
    ]);
    const items = all.map((raw) => discourseMap.category({ raw, baseUrl: base }));
    return { items, count: items.length, has_more: false };
  },
});
