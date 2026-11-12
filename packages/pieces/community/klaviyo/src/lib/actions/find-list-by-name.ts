import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { equalsFilter, klaviyoApi } from '../common/client';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const findListByName = createAction({
  auth: klaviyoAuth,
  name: 'findListByName',
  classification: 'SEARCH',
  displayName: 'Find List by Name',
  description: 'Find lists by exact name, optionally with their tags.',
  audience: 'both',
  aiMetadata: {
    description: 'Looks up Klaviyo lists by an exact name match and returns the matching lists with their IDs. Use to resolve a list name into a list ID before actions that require one; to browse all lists use List Lists. Matching is on the whole name and ignores letter case, not partial. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.findListByName,
  props: {
    search_query: Property.LongText({
      displayName: 'List Name(s)',
      description:
        'Enter the exact list name',
      required: true,
    }),

    include_additional_data: Property.Checkbox({
      displayName: 'Include Additional Data',
      description: 'Include the tags of each list',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { search_query, include_additional_data } = propsValue;
    const trimmedQuery = (search_query ?? '').trim();
    if (trimmedQuery.length === 0) {
      throw new Error('List name is required');
    }
    const { items, included } = await klaviyoApi.listAll({
      auth,
      path: '/lists',
      query: {
        filter: equalsFilter({ field: 'name', value: trimmedQuery }),
        sort: 'name',
        include: include_additional_data ? 'tags' : undefined,
      },
      maxItems: MAX_LISTS,
      what: `lists named "${trimmedQuery}"`,
    });
    if (items.length === 0) {
      return {
        success: false,
        message: `No lists found with ${trimmedQuery}`,
        lists: [],
        count: 0,
      };
    }
    return {
      success: true,
      message: `Found ${items.length} list(s) matching your search`,
      lists: items.map((list) => ({
        id: list.id,
        name: list.attributes['name'],
        created: list.attributes['created'],
        updated: list.attributes['updated'],
        opt_in_process: list.attributes['opt_in_process'],
      })),
      count: items.length,
      rawresponse: { data: items, included },
    };
  },
});

const MAX_LISTS = 100;
