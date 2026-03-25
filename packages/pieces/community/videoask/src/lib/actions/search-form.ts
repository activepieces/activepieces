import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { organizationIdDropdown } from '../common/props';
import { videoaskAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const searchForm = createAction({
  auth: videoaskAuth,
  name: 'searchForm',
  displayName: 'Search form by keyword(s)',
  description: 'Search forms by keyword(s) within the organization',
  props: {
    organizationId: organizationIdDropdown,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 100,
    }),
    search: Property.ShortText({
      displayName: 'Search term',
      description: 'Keyword(s) to search for in form titles',
      required: true,
    }),
  },
  async run(context) {
    const { organizationId, limit, search } = context.propsValue;
    const access_token = context.auth.access_token as string;

    const effectiveLimit = limit ?? 100;
    const encodedSearch = encodeURIComponent(search as string);

    const response = await makeRequest(
      organizationId as string,
      access_token,
      HttpMethod.GET,
      `/search/forms?limit=${effectiveLimit}&search=${encodedSearch}`
    );

    return response;
  },
});
