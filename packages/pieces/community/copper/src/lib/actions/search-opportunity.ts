import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchOpportunity = createAction({
  auth: copperAuth,
  name: 'copper_search_opportunity',
  displayName: 'Search Opportunity',
  description: 'Search for opportunities in Copper',
  props: {
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Opportunity name or other identifier to search for',
      required: false,
    }),
    company_id: Property.ShortText({
      displayName: 'Company ID',
      description: 'Search by associated company ID',
      required: false,
    }),
    assignee_id: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'Search by assigned user ID',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 20)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { search_term, company_id, assignee_id, limit } = context.propsValue;

    const body: any = {
      page_size: limit || 20,
    };

    if (search_term) {
      body.name = search_term;
    }

    if (company_id) {
      body.company_id = company_id;
    }

    if (assignee_id) {
      body.assignee_id = assignee_id;
    }

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      url: '/opportunities/search',
      body,
    });

    return response;
  },
});
