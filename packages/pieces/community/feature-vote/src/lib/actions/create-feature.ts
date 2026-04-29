import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { featuresVoteApiCall } from '../common';
import { featuresVoteAuth } from '../auth';

export const createFeatureAction = createAction({
  auth: featuresVoteAuth,
  name: 'create_feature',
  displayName: 'Create Feature',
  description: 'Create a new feature request on your voting board.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the feature request.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A detailed description of the feature request.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The initial status of the feature.',
      required: false,
      defaultValue: 'Pending',
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
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to categorize the feature (e.g. "UI", "API").',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      title: context.propsValue.title,
    };
    if (context.propsValue.description) {
      body['description'] = context.propsValue.description;
    }
    if (context.propsValue.status) {
      body['status'] = context.propsValue.status;
    }
    if (context.propsValue.tags && context.propsValue.tags.length > 0) {
      body['tags'] = context.propsValue.tags;
    }
    const response = await featuresVoteApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/features/create',
      body,
    });
    return response.body;
  },
});