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
import { userIdDropdown } from '../common/props';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

export const findUserAction = createAction({
  auth: zendeskAuth,
  name: 'find-user',
  displayName: 'Find User',
  description: 'Retrieve user details by email or ID.',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Choose whether to search by user ID or email address',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Search by User ID', value: 'user_id' },
          { label: 'Search by Email', value: 'email' },
        ],
      },
    }),
    user_id: userIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the user to search for',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      search_type,
      user_id,
      email,
    } = propsValue;

    // Validation based on search type
    if (search_type === 'user_id' && !user_id) {
      throw new Error('User ID is required when searching by user ID.');
    }
    
    if (search_type === 'email' && !email) {
      throw new Error('Email address is required when searching by email.');
    }

    try {
      let response;
      let searchCriteria;

      if (search_type === 'user_id') {
        // Direct user lookup by ID
        response = await httpClient.sendRequest({
          url: `https://${authentication.subdomain}.zendesk.com/api/v2/users/${user_id}.json`,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BASIC,
            username: authentication.email + '/token',
            password: authentication.token,
          },
        });
        
        searchCriteria = {
          type: 'user_id',
          value: user_id,
        };

        const responseBody = response.body as { user: Record<string, unknown> };
        const user = responseBody.user;

        return {
          success: true,
          message: `Successfully retrieved user with ID ${user_id}`,
          data: response.body,
          user,
          search_criteria: searchCriteria,
        };
      } else {
        if (!email) {
          throw new Error('Email address is required for email search.');
        }
        
        response = await httpClient.sendRequest({
          url: `https://${authentication.subdomain}.zendesk.com/api/v2/users/search.json?query=email:${encodeURIComponent(email)}`,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BASIC,
            username: authentication.email + '/token',
            password: authentication.token,
          },
        });

        searchCriteria = {
          type: 'email',
          value: email,
        };

        const responseBody = response.body as { users: Array<Record<string, unknown>> };
        const users = responseBody.users || [];

        if (users.length === 0) {
          return {
            success: true,
            message: `No user found with email address: ${email}`,
            data: response.body,
            user: null,
            users: [],
            search_criteria: searchCriteria,
            found_count: 0,
          };
        }

        const user = users[0];
        
        return {
          success: true,
          message: `Found ${users.length} user(s) with email address: ${email}`,
          data: response.body,
          user,
          users,
          search_criteria: searchCriteria,
          found_count: users.length,
        };
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your search criteria and try again.'
        );
      }
      
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error(
          'Authentication failed or insufficient permissions. Please check your API credentials and permissions to view users.'
        );
      }
      
      if (errorMessage.includes('404')) {
        if (search_type === 'user_id') {
          throw new Error(
            `User with ID ${user_id} not found. Please verify the user ID.`
          );
        } else {
          throw new Error(
            `No user found with email address: ${email}`
          );
        }
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

      throw new Error(`Failed to find user: ${errorMessage}`);
    }
  },
});
