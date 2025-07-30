import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

interface KlaviyoList {
  type: string;
  id: string;
  attributes: {
    name?: string;
    created?: string;
    updated?: string;
    opt_in_process?: string;
  };
}

export const findListByName = createAction({
  auth: klaviyoAuth,
  name: 'findListByName',
  displayName: 'Find List by Name',
  description: 'Find lists by name using exact match or multiple names.',
  props: {
    search_query: Property.LongText({
      displayName: 'List Name(s)',
      description: 'Enter one list name, or multiple names separated by commas (e.g., "Newsletter, VIP List, Promotions")',
      required: true,
    }),
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Choose how to search for lists',
      required: true,
      defaultValue: 'single',
      options: {
        disabled: false,
        options: [
          { label: 'Single List (Exact Match)', value: 'single' },
          { label: 'Multiple Lists (Comma-separated)', value: 'multiple' },
        ],
      },
    }),
    include_additional_data: Property.Checkbox({
      displayName: 'Include Additional Data',
      description: 'Include related flow and tag information',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { search_query, search_type, include_additional_data } = propsValue;

    if (!search_query || search_query.trim().length === 0) {
      throw new Error('List name is required');
    }

    const trimmedQuery = search_query.trim();
    let filter = '';

    if (search_type === 'multiple') {
      const names = trimmedQuery
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      if (names.length === 0) {
        throw new Error('Please provide at least one valid list name');
      }
      
      if (names.length === 1) {
        filter = `equals(name,"${names[0]}")`;
      } else {
        const namesJson = JSON.stringify(names);
        filter = `any(name,${namesJson})`;
      }
    } else {
      filter = `equals(name,"${trimmedQuery}")`;
    }

    const queryParams = new URLSearchParams();
    queryParams.append('filter', filter);
    queryParams.append('page[size]', '10');
    queryParams.append('sort', 'name');
    
    if (include_additional_data) {
      queryParams.append('include', 'flow-triggers,tags');
    }

    const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
    const response = await makeRequest(
      authProp.access_token,
      HttpMethod.GET,
      `/lists?${queryParams.toString()}`
    );

    const lists: KlaviyoList[] = response.data || [];
    
    if (lists.length === 0) {
      const searchTerm = search_type === 'multiple' ? 'names' : 'name';
      return {
        success: false,
        message: `No lists found with ${searchTerm}: ${trimmedQuery}`,
        lists: [],
        count: 0,
      };
    }

    const formattedLists = lists.map((list) => ({
      id: list.id,
      name: list.attributes.name,
      created: list.attributes.created,
      updated: list.attributes.updated,
      opt_in_process: list.attributes.opt_in_process,
    }));

    let prioritizedLists = formattedLists;
    if (search_type === 'multiple') {
      const searchNames = trimmedQuery.split(',').map(name => name.trim().toLowerCase());
      prioritizedLists = formattedLists.sort((a, b) => {
        const aExact = searchNames.includes(a.name?.toLowerCase() || '');
        const bExact = searchNames.includes(b.name?.toLowerCase() || '');
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return (a.name || '').localeCompare(b.name || '');
      });
    }

    return {
      success: true,
      message: `Found ${lists.length} list(s) matching your search`,
      lists: prioritizedLists,
      count: lists.length,
      search_type,
      search_query: trimmedQuery,
      note: lists.length === 10 ? 'Results limited to 10 lists per API request' : undefined,
      raw_response: response,
    };
  },
});
