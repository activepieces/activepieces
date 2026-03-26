import { createAction, Property } from '@activepieces/pieces-framework';

import {
  flattenGetResponseCampaign,
  listGetResponseCampaigns,
} from '../common/client';
import { getresponseAuth } from '../common/auth';

export const findCampaignListAction = createAction({
  auth: getresponseAuth,
  name: 'find-campaign-list',
  displayName: 'Find Campaign List',
  description: 'Finds campaign lists by name.',
  props: {
    name: Property.ShortText({
      displayName: 'Campaign Name',
      description:
        'Enter part or all of the campaign list name. Leave empty to return the first lists in the account.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The maximum number of campaign lists to return.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const campaigns = await listGetResponseCampaigns({
      apiKey: context.auth.secret_text,
      limit: context.propsValue.limit ?? 100,
      ...(context.propsValue.name ? { name: context.propsValue.name } : {}),
    });

    return campaigns.map(flattenGetResponseCampaign);
  },
});
