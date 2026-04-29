import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { featuresVoteAuth } from '../auth';
import { featuresVoteApiCall } from '../common';

export const updateFeatureStatusAction = createAction({
  auth: featuresVoteAuth,
  name: 'update_feature_status',
  displayName: 'Update Feature Status',
  description: 'Update a feature status and notify subscribers.',
  props: {
    id: Property.ShortText({
      displayName: 'Feature ID',
      description:
        'The ID of the feature to update. You can get this from the List Features action.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'New Status',
      description: 'The new status to set.',
      required: true,
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
  },
  async run(context) {
    const response = await featuresVoteApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: '/features',
      body: {
        id: context.propsValue.id,
        status: context.propsValue.status,
      },
      queryParams: {
        is_status_update: 'true',
      },
    });
    return response.body;
  },
});