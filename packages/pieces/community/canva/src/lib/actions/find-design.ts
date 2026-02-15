import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../..';
import { canvaCommon } from '../common';

export const findDesign = createAction({
  auth: canvaAuth,
  name: 'find_design',
  displayName: 'Find Design',
  description: 'Search for designs in the user\'s Canva account.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term to filter designs.',
      required: false,
    }),
    ownership: Property.StaticDropdown({
      displayName: 'Ownership',
      description: 'Filter designs by ownership.',
      required: false,
      options: {
        options: [
          { label: 'Any (Owned + Shared)', value: 'any' },
          { label: 'Owned by me', value: 'owned' },
          { label: 'Shared with me', value: 'shared' },
        ],
      },
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'How to sort the results.',
      required: false,
      options: {
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Modified (Newest First)', value: 'modified_descending' },
          { label: 'Modified (Oldest First)', value: 'modified_ascending' },
          { label: 'Title (Z-A)', value: 'title_descending' },
          { label: 'Title (A-Z)', value: 'title_ascending' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of designs to return (1-100). Default: 25.',
      required: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};

    if (context.propsValue.query) {
      queryParams['query'] = context.propsValue.query;
    }
    if (context.propsValue.ownership) {
      queryParams['ownership'] = context.propsValue.ownership;
    }
    if (context.propsValue.sort_by) {
      queryParams['sort_by'] = context.propsValue.sort_by;
    }
    if (context.propsValue.limit) {
      queryParams['limit'] = context.propsValue.limit.toString();
    }

    return await canvaCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      '/designs',
      undefined,
      queryParams,
    );
  },
});
