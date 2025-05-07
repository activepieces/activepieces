import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../../index';

export const searchLeadsAction = createAction({
  auth: instantlyAiAuth,
  name: 'search_leads',
  displayName: 'Search Leads',
  description: 'Search for leads in Instantly by email, name, or attributes',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Filter leads by email (exact match)',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Filter leads by first name (partial match)',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Filter leads by last name (partial match)',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Filter leads by company name (partial match)',
      required: false,
    }),
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'Filter leads by associated campaign ID',
      required: false,
    }),
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'Filter leads by associated list ID',
      required: false,
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      description: 'Filter leads created after this date',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      description: 'Filter leads created before this date',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of leads to return (1-100)',
      required: false,
      defaultValue: 20,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of leads to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const {
      email,
      first_name,
      last_name,
      company,
      campaign_id,
      list_id,
      created_after,
      created_before,
      limit,
      offset,
    } = context.propsValue;
    const { auth: apiKey } = context;

    let endpoint = 'leads';
    const queryParams: Record<string, string | number | boolean> = {};

    if (email) {
      queryParams.email = email;
    }

    if (first_name) {
      queryParams.first_name = first_name;
    }

    if (last_name) {
      queryParams.last_name = last_name;
    }

    if (company) {
      queryParams.company = company;
    }

    if (campaign_id) {
      endpoint = `campaigns/${campaign_id}/leads`;
    } else if (list_id) {
      endpoint = `lead-lists/${list_id}/leads`;
    }

    if (created_after) {
      queryParams.created_after = created_after;
    }

    if (created_before) {
      queryParams.created_before = created_before;
    }

    if (limit) {
      queryParams.limit = Math.min(100, Math.max(1, limit));
    }

    if (offset !== undefined) {
      queryParams.offset = Math.max(0, offset);
    }

    return await makeRequest({
      endpoint,
      method: HttpMethod.GET,
      apiKey: apiKey as string,
      queryParams,
    });
  },
});
