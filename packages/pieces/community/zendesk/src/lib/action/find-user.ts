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

export const findUser = createAction({
  auth: zendeskAuth,
  name: 'find_user',
  displayName: 'Find User',
  description: 'Retrieve user details by email or ID',
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The ID of the user to retrieve',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search for users by email address',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Search for users by name',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Search for users by external ID',
      required: false,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'Filter users by role',
      required: false,
      options: {
        options: [
          { label: 'End User', value: 'end-user' },
          { label: 'Agent', value: 'agent' },
          { label: 'Admin', value: 'admin' },
        ],
      },
    }),
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'Filter users by organization',
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

    if (propsValue.user_id) {
      // Get specific user by ID
      url = `https://${subdomain}.zendesk.com/api/v2/users/${propsValue.user_id}.json`;
    } else {
      // Search users
      url = `https://${subdomain}.zendesk.com/api/v2/users.json`;
      
      const params = new URLSearchParams();
      
      if (propsValue.email) {
        params.append('email', propsValue.email);
      }
      
      if (propsValue.name) {
        params.append('name', propsValue.name);
      }
      
      if (propsValue.external_id) {
        params.append('external_id', propsValue.external_id);
      }
      
      if (propsValue.role) {
        params.append('role', propsValue.role);
      }
      
      if (propsValue.organization_id) {
        params.append('organization_id', propsValue.organization_id);
      }
      
      if (propsValue.per_page) {
        params.append('per_page', propsValue.per_page.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const response = await httpClient.sendRequest<{ users?: Array<Record<string, unknown>>; user?: Record<string, unknown> }>({
      url,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
      timeout: 30000, // 30 seconds timeout
      retries: 3, // Retry up to 3 times on failure
    });

    return response.body;
  },
}); 