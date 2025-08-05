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
  description: 'Look up an organization by name or ID',
  props: {
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The ID of the organization to retrieve',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Search for organizations by name',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Search for organizations by external ID',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of results to return (max 100)',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };

    let url: string;

    if (propsValue.organization_id) {
      // Get specific organization by ID
      url = `https://${subdomain}.zendesk.com/api/v2/organizations/${propsValue.organization_id}.json`;
    } else {
      // Search organizations
      url = `https://${subdomain}.zendesk.com/api/v2/organizations.json`;
      
      const params = new URLSearchParams();
      
      if (propsValue.name) {
        params.append('name', propsValue.name);
      }
      
      if (propsValue.external_id) {
        params.append('external_id', propsValue.external_id);
      }
      
      if (propsValue.per_page) {
        params.append('per_page', propsValue.per_page.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
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