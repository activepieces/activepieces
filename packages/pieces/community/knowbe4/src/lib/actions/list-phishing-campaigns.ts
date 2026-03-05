import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knowbe4Auth } from '../auth';
import { knowbe4ApiRequest } from '../common';

export const listPhishingCampaigns = createAction({
  auth: knowbe4Auth,
  name: 'list_phishing_campaigns',
  displayName: 'List Phishing Campaigns',
  description:
    'List all phishing campaigns and their security test results',
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
      endpoint: '/phishing/campaigns',
      queryParams,
    });
  },
});
