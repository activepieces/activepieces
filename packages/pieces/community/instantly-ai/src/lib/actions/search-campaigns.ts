import { createAction, Property } from '@activepieces/pieces-framework';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { InstantlyCampaign } from '../common/types';

export const searchCampaignsAction = createAction({
  auth: instantlyAuth,
  name: 'search_campaigns',
  displayName: 'Search Campaigns',
  description: 'Searches for campaigns using various filters.',
  props: {
    name: Property.ShortText({
      displayName: 'Campaign Name',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const result = await instantlyClient.listAllPages<InstantlyCampaign>({
      auth: context.auth.secret_text,
      path: 'campaigns',
      query: { search: name },
    });

    return {
      found: result.length > 0,
      result,
    };
  },
});
