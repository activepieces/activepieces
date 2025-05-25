import { createAction, Property } from '@activepieces/pieces-framework';
import { instantlyAiAuth } from '../../index';
import { makeRequest } from '../common/client';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { campaignId, listId } from '../common/props';

export const searchLeadsAction = createAction({
  auth: instantlyAiAuth,
  name: 'search_leads',
  displayName: 'Search Leads',
  description: 'Search for leads in Instantly by name or email.',
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search string to find leads - can be First Name, Last Name, or Email (e.g. "John Doe").',
      required: true,
    }),
    campaign_id: campaignId(false),
    list_id: listId(false)
  },
  async run(context) {
    const {search,campaign_id,list_id} = context.propsValue;

    const result = [];
    
        let startingAfter: string | undefined = undefined;
        let hasMore = true;
    
        do {
          const body:Record<string,any> = {
            limit: '100',
            search,
          };

          if(campaign_id) body['campaign'] = campaign_id;
          if(list_id) body['list_id'] = list_id;
          if (startingAfter) body['starting_after'] = startingAfter;
    
          const response = (await makeRequest({
            endpoint: 'leads/list',
            method: HttpMethod.POST,
            apiKey:context.auth,
            body,
          })) as { next_starting_after?: string; items: Record<string, any>[] };
    
          const items = response.items || [];
          result.push(...items);
    
          startingAfter = response.next_starting_after;
          hasMore = !!startingAfter && items.length > 0;
        } while (hasMore);
    
        return {
          found: result.length > 0,
          result,
        };
  },
});
