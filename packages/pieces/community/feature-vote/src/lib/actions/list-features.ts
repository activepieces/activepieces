import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { featuresVoteAuth } from '../auth';
import { featuresVoteApiCall } from '../common';

export const listFeaturesAction = createAction({
  auth: featuresVoteAuth,
  name: 'list_features',
  displayName: 'List Features',
  description: 'List and filter feature requests from your voting board.',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by status.',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'Pending' },
          { label: 'Approved', value: 'Approved' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Done', value: 'Done' },
          { label: 'Rejected', value: 'Rejected' },
        ],
      },
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Filter by tag name.',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search in title and description.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Items per page (default: 50, max: 100).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};
    if (context.propsValue.status) {
      queryParams['status'] = context.propsValue.status;
    }
    if (context.propsValue.tag) {
      queryParams['tag'] = context.propsValue.tag;
    }
    if (context.propsValue.search) {
      queryParams['search'] = context.propsValue.search;
    }
    if (context.propsValue.limit) {
      queryParams['limit'] = String(context.propsValue.limit);
    }
    const response = await featuresVoteApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/features',
      queryParams,
    });
    return response.body;
  },
});