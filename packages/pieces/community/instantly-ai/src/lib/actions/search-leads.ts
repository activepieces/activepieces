import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyLead } from '../common/types';

export const searchLeadsAction = createAction({
  auth: instantlyAuth,
  name: 'search_leads',
  displayName: 'Search Leads',
  description: 'Search for leads in Instantly by name or email.',
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description:
        'Search string to find leads - can be First Name, Last Name, or Email (e.g. "John Doe").',
      required: true,
    }),
    campaign_id: instantlyProps.campaignId(false),
    list_id: instantlyProps.listId(false),
  },
  async run(context) {
    const { search, campaign_id, list_id } = context.propsValue;

    const body: Record<string, unknown> = { search };
    if (campaign_id) body['campaign'] = campaign_id;
    if (list_id) body['list_id'] = list_id;

    const result = await instantlyClient.listAllPages<InstantlyLead>({
      auth: context.auth.secret_text,
      path: 'leads/list',
      method: HttpMethod.POST,
      body,
    });

    return {
      found: result.length > 0,
      result,
    };
  },
});
