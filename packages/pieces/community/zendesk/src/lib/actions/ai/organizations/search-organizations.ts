import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskSearchOrganizationsOutputSchema } from '../../../output-schemas';

export const zendeskSearchOrganizations = createAction({
  auth: zendeskAuth,
  name: 'zendesk_search_organizations',
  outputSchema: zendeskSearchOrganizationsOutputSchema,
  displayName: 'Search Organizations',
  description: 'Find organizations by exact name or external ID.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds organizations by exact name or exact external ID; pass one of the two. Use Search with type:organization for partial or attribute matches.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Exact organization name.', required: false }),
    external_id: Property.ShortText({ displayName: 'External ID', description: 'Exact organization external ID.', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ organizations: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/organizations/search.json`,
      queryParams: zendeskApi.query({ name: propsValue.name, external_id: propsValue.external_id }),
    });
    return { organizations: response.organizations, count: response.organizations.length };
  },
});
