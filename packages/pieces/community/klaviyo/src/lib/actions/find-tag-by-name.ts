import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
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
  description: 'Find tags by name using various search methods.',
  props: {
    search_query: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Enter the tag name to search for',
      required: true,
    }),
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Choose how to match the tag name',
      required: true,
      defaultValue: 'equals',
      options: {
        disabled: false,
        options: [
          { label: 'Exact Match', value: 'equals' },
          { label: 'Contains', value: 'contains' },
          { label: 'Starts With', value: 'starts-with' },
          { label: 'Ends With', value: 'ends-with' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { search_query, search_type } = propsValue;

    if (!search_query || search_query.trim().length === 0) {
      throw new Error('Tag name is required');
    }

    const trimmedQuery = search_query.trim();

    // Build the filter based on search type
    const filter = `${search_type}(name,"${trimmedQuery}")`;

    const queryParams = new URLSearchParams();
    queryParams.append('filter', filter);
    queryParams.append('page[size]', '50');
    queryParams.append('sort', 'name');

    const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
    const response = await makeRequest(
      authProp.access_token,
      HttpMethod.GET,
      `/tags?${queryParams.toString()}`
    );

    const tags: KlaviyoTag[] = response.data || [];
    
    if (tags.length === 0) {
      return {
        success: false,
        message: `No tags found that ${search_type.replace('-', ' ')} "${trimmedQuery}"`,
        tags: [],
        count: 0,
      };
    }

    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.attributes.name,
    }));

    let prioritizedTags = formattedTags;
    if (search_type !== 'equals') {
      prioritizedTags = formattedTags.sort((a, b) => {
        const aExact = a.name?.toLowerCase() === trimmedQuery.toLowerCase();
        const bExact = b.name?.toLowerCase() === trimmedQuery.toLowerCase();
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return (a.name || '').localeCompare(b.name || '');
      });
    }

    return {
      success: true,
      message: `Found ${tags.length} tag(s) that ${search_type.replace('-', ' ')} "${trimmedQuery}"`,
      tags: prioritizedTags,
      count: tags.length,
      search_type,
      search_query: trimmedQuery,
      raw_response: response,
    };
  },
});
