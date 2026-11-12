import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApi, quoteFilterValue, textOf } from '../common/client';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const findTagByName = createAction({
  auth: klaviyoAuth,
  name: 'findTagByName',
  classification: 'SEARCH',
  displayName: 'Find Tag by Name',
  description: 'Find tags whose name contains the search query.',
  audience: 'both',
  aiMetadata: {
    description: 'Searches Klaviyo tags by a partial (contains) name match and returns matching tags with their IDs. Use to discover tag IDs by keyword, for example before Add Tag to List or Segment. Requires a search value; matching is substring-based, not exact. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.findTag,
  props: {
    search_query: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Search for tags whose name contains this value.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const trimmedQuery = (propsValue.search_query ?? '').trim();
    if (trimmedQuery.length === 0) {
      throw new Error('Tag name is required');
    }
    const { items } = await klaviyoApi.listAll({
      auth,
      path: '/tags',
      query: {
        filter: `contains(name,${quoteFilterValue(trimmedQuery)})`,
        'page[size]': 50,
        sort: 'name',
      },
      maxItems: MAX_TAGS,
      what: `tags containing "${trimmedQuery}"`,
    });
    if (items.length === 0) {
      return {
        success: false,
        message: `No tags found containing "${trimmedQuery}"`,
        tags: [],
        count: 0,
      };
    }
    return {
      success: true,
      message: `Found ${items.length} tag(s) containing "${trimmedQuery}"`,
      tags: items.map((tag) => ({ id: tag.id, name: textOf(tag.attributes['name']) ?? '' })),
      count: items.length,
      search_query: trimmedQuery,
    };
  },
});

const MAX_TAGS = 500;
