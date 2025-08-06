import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

export const findOrganization = createAction({
  auth: zendeskAuth,
  name: 'find_organization',
  displayName: 'Find Organization',
  description: 'Search for organizations by name or external ID. Note: You can search by either name OR external_id, but not both. Only admins and agents with organization permissions can search.',
  props: {
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The ID of the organization to retrieve (for direct lookup)',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Search for organizations by name (exact match, case insensitive). Cannot be used with External ID.',
      required: false,
    }),
    external_id: Property.Number({
      displayName: 'External ID',
      description: 'Search for organizations by external ID (exact match, case insensitive). Cannot be used with Name.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };

    // Validate that only one search parameter is provided
    if (propsValue.name && propsValue.external_id) {
      throw new Error('You can search by either name OR external_id, but not both');
    }

    let url: string;

    if (propsValue.organization_id) {
      // Get specific organization by ID
      url = `https://${subdomain}.zendesk.com/api/v2/organizations/${propsValue.organization_id}.json`;
    } else if (propsValue.name || propsValue.external_id) {
      // Search organizations using the search endpoint
      url = `https://${subdomain}.zendesk.com/api/v2/organizations/search.json`;
      
      const params = new URLSearchParams();
      
      if (propsValue.name) {
        params.append('name', propsValue.name);
      }
      
      if (propsValue.external_id) {
        params.append('external_id', propsValue.external_id.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    } else {
      // List all organizations (fallback)
      url = `https://${subdomain}.zendesk.com/api/v2/organizations.json`;
    }

    const response = await httpClient.sendRequest<{ organizations?: Array<Record<string, unknown>>; organization?: Record<string, unknown> }>({
      url,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
      timeout: 30000, // 30 seconds timeout
    });

    return response.body;
  },
}); 