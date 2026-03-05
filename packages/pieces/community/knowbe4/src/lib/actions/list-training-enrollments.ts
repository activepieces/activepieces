import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knowbe4Auth } from '../auth';
import { knowbe4ApiRequest } from '../common';

export const listTrainingEnrollments = createAction({
  auth: knowbe4Auth,
  name: 'list_training_enrollments',
  displayName: 'List Training Enrollments',
  description:
    'List all training enrollments, optionally filtered by campaign or user',
  props: {
    campaignId: Property.Number({
      displayName: 'Campaign ID',
      description: 'Filter by training campaign ID',
      required: false,
    }),
    userId: Property.Number({
      displayName: 'User ID',
      description: 'Filter by user ID',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      description: 'Results per page (default: 100, max: 500)',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};
    if (context.propsValue.campaignId) {
      queryParams['campaign_id'] = String(context.propsValue.campaignId);
    }
    if (context.propsValue.userId) {
      queryParams['user_id'] = String(context.propsValue.userId);
    }
    if (context.propsValue.page) {
      queryParams['page'] = String(context.propsValue.page);
    }
    if (context.propsValue.perPage) {
      queryParams['per_page'] = String(context.propsValue.perPage);
    }

    return await knowbe4ApiRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/training/enrollments',
      queryParams,
    });
  },
});
