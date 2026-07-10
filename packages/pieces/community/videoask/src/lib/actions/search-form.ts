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
  audience: 'both',
  aiMetadata: { description: 'Search an organization\'s VideoAsk forms by keyword matched against form titles, returning up to a configurable limit. Use to resolve a form name to its ID or discover available forms before referencing one. Read-only and idempotent. The search term is required.', idempotent: true },
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
