import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchProject = createAction({
  auth: copperAuth,
  name: 'copper_search_project',
  displayName: 'Search Project',
  description: 'Search for projects in Copper',
  props: {
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Project name or other identifier to search for',
      required: false,
    }),
    assignee_id: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'Search by assigned user ID',
      required: false,
    }),
    company_id: Property.ShortText({
      displayName: 'Company ID',
      description: 'Search by associated company ID',
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
    const { search_term, assignee_id, company_id, limit } = context.propsValue;

    const body: any = {
      page_size: limit || 20,
    };

    if (search_term) {
      body.name = search_term;
    }

    if (assignee_id) {
      body.assignee_id = assignee_id;
    }

    if (company_id) {
      body.company_id = company_id;
    }

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      url: '/projects/search',
      body,
    });

    return response;
  },
});
