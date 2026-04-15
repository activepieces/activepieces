import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth, KlaviyoAuthValue } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

interface KlaviyoTag {
  type: string;
  id: string;
  attributes: {
    name?: string;
  };
}

export const findTagByName = createAction({
  auth: klaviyoAuth,
  name: 'findTagByName',
  displayName: 'Find Tag by Name',
  description: 'Find tags whose name contains the search query.',
  props: {
    search_query: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Search for tags whose name contains this value.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { search_query } = propsValue;

    if (!search_query || search_query.trim().length === 0) {
      throw new Error('Tag name is required');
    }

    const trimmedQuery = search_query.trim();
    const filter = `contains(name,"${trimmedQuery.replace(/"/g, '\\"')}")`;

    const queryParams = new URLSearchParams();
    queryParams.append('filter', filter);
    queryParams.append('page[size]', '50');
    queryParams.append('sort', 'name');

    const response = await makeRequest(
      auth as KlaviyoAuthValue,
      HttpMethod.GET,
      `/tags?${queryParams.toString()}`
    );

    const tags: KlaviyoTag[] = response.data || [];

    if (tags.length === 0) {
      return {
        success: false,
        message: `No tags found containing "${trimmedQuery}"`,
        tags: [],
        count: 0,
      };
    }

    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.attributes.name ?? '',
    }));

    return {
      success: true,
      message: `Found ${tags.length} tag(s) containing "${trimmedQuery}"`,
      tags: formattedTags,
      count: tags.length,
      search_query: trimmedQuery,
    };
  },
});
