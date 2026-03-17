import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth, KlaviyoAuthValue } from '../common/auth';
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
  description: 'Find lists by name with optional additional data',
  props: {
    search_query: Property.LongText({
      displayName: 'List Name(s)',
      description:
        'Enter list name',
      required: true,
    }),

    include_additional_data: Property.Checkbox({
      displayName: 'Include Additional Data',
      description: 'Include related flow and tag information',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { search_query, include_additional_data } = propsValue;

    if (!search_query || search_query.trim().length === 0) {
      throw new Error('List name is required');
    }

    const trimmedQuery = search_query.trim();
    let filter = '';

    filter = `equals(name,"${trimmedQuery}")`;

    const queryParams = new URLSearchParams();
    queryParams.append('filter', filter);
    queryParams.append('page[size]', '10');
    queryParams.append('sort', 'name');

    if (include_additional_data) {
      queryParams.append('include', 'tags');
    }

    const response = await makeRequest(
      auth as KlaviyoAuthValue,
      HttpMethod.GET,
      `/lists?${queryParams.toString()}`
    );

    const lists: KlaviyoList[] = response.data || [];

    if (lists.length === 0) {
      return {
        success: false,
        message: `No lists found with ${trimmedQuery}`,
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

    return {
      success: true,
      message: `Found ${lists.length} list(s) matching your search`,
      lists: formattedLists,
      rawresponse: response,
    };
  },
});
