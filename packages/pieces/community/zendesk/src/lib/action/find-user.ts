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
  description: 'Search for users by email, name, external ID, or retrieve by user ID. Only admins and agents with user management permissions can search.',
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The ID of the user to retrieve (for direct lookup)',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search for users by email address (exact match)',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Search for users by name (exact match)',
      required: false,
    }),
    external_id: Property.Number({
      displayName: 'External ID',
      description: 'Search for users by external ID (exact match)',
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
      description: 'Filter users by organization ID',
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

    // Validate that at least one search parameter is provided when not using user_id
    if (!propsValue.user_id && !propsValue.email && !propsValue.name && !propsValue.external_id && !propsValue.role && !propsValue.organization_id) {
      throw new Error('Please provide at least one search parameter (email, name, external_id, role, or organization_id) or a user_id for direct lookup');
    }

    let url: string;

    if (propsValue.user_id) {
      // Get specific user by ID
      url = `https://${subdomain}.zendesk.com/api/v2/users/${propsValue.user_id}.json`;
    } else {
      // Search users using the list endpoint with filters
      url = `https://${subdomain}.zendesk.com/api/v2/users.json`;
      
      const params = new URLSearchParams();
      
      if (propsValue.email) {
        params.append('email', propsValue.email);
      }
      
      if (propsValue.name) {
        params.append('name', propsValue.name);
      }
      
      if (propsValue.external_id) {
        params.append('external_id', propsValue.external_id.toString());
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