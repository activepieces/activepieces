import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knowbe4Auth } from '../auth';
import { knowbe4ApiRequest } from '../common';

export const listTrainingCampaigns = createAction({
  auth: knowbe4Auth,
  name: 'list_training_campaigns',
  displayName: 'List Training Campaigns',
  description: 'List all training campaigns in your KnowBe4 account',
  props: {
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
    if (context.propsValue.page) {
      queryParams['page'] = String(context.propsValue.page);
    }
    if (context.propsValue.perPage) {
      queryParams['per_page'] = String(context.propsValue.perPage);
    }

    return await knowbe4ApiRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/training/campaigns',
      queryParams,
    });
  },
});
