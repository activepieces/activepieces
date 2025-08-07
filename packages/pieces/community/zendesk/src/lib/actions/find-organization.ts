import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

export const findOrganizationAction = createAction({
  auth: zendeskAuth,
  name: 'find-organization',
  displayName: 'Find Organization',
  description: 'Look up an organization by name or ID.',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Choose whether to search by organization name or external ID',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Search by Name', value: 'name' },
          { label: 'Search by External ID', value: 'external_id' },
        ],
      },
    }),
    name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'The exact name of the organization to search for (case insensitive)',
      required: false,
    })
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      search_type,
      name
    } = propsValue;

    // Validation based on search type
    if (search_type === 'name' && !name) {
      throw new Error('Organization name is required when searching by name.');
    }

    const queryParams = new URLSearchParams();
    if (search_type === 'name' && name) {
      queryParams.append('name', name);
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/organizations/search.json?${queryParams.toString()}`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      const responseBody = response.body as { organizations: Array<Record<string, unknown>> };
      const organizations = responseBody.organizations || [];

      return {
        success: true,
        message: `Found ${organizations.length} organization(s) matching the search criteria`,
        data: response.body,
        organizations,
        search_criteria: {
          type: search_type,
          value: search_type === 'name' ? name : undefined,
        },
        found_count: organizations.length,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your search criteria and try again.'
        );
      }
      
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error(
          'Authentication failed or insufficient permissions. Please check your API credentials and permissions to search organizations.'
        );
      }
      
      if (errorMessage.includes('422')) {
        throw new Error(
          'Validation error. Please check that the search parameters are valid.'
        );
      }
      
      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to search organizations: ${errorMessage}`);
    }
  },
});
