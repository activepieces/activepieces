import { createAction, Property } from '@activepieces/pieces-framework';
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

export const findUserAction = createAction({
  auth: zendeskAuth,
  name: 'find-user',
  displayName: 'Find User(s)',
  description: 'Search users by email, name, role, or other criteria.',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Choose how to search for users',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Search by Email', value: 'email' },
          { label: 'Search by Name', value: 'name' },
          { label: 'Search by Role', value: 'role' },
          { label: 'Search by Organization', value: 'organization' },
          { label: 'Search by Tag', value: 'tag' },
          { label: 'Search by External ID', value: 'external_id' },
          { label: 'Custom Query', value: 'custom' },
        ],
      },
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the user to search for',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the user to search for',
      required: false,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'Search users by role',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'End User', value: 'end-user' },
          { label: 'Agent', value: 'agent' },
          { label: 'Admin', value: 'admin' },
        ],
      },
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      description: 'Search users by organization name',
      required: false,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Search users containing this tag',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Search users by external ID',
      required: false,
    }),
    custom_query: Property.LongText({
      displayName: 'Custom Query',
      description:
        'Custom search query using Zendesk search syntax (e.g., "type:user role:agent")',
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'How to sort the results',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Relevance (Default)', value: 'relevance' },
          { label: 'Created Date', value: 'created_at' },
          { label: 'Updated Date', value: 'updated_at' },
        ],
      },
    }),
    sort_order: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort order for results',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Descending (Default)', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      search_type,
      email,
      name,
      role,
      organization,
      tag,
      external_id,
      custom_query,
      sort_by,
      sort_order,
    } = propsValue;

    let query = 'type:user';

    switch (search_type) {
      case 'email':
        if (!email) {
          throw new Error('Email address is required when searching by email.');
        }
        query += ` email:${email}`;
        break;
      case 'name':
        if (!name) {
          throw new Error('Name is required when searching by name.');
        }
        query += ` name:"${name}"`;
        break;
      case 'role':
        if (!role) {
          throw new Error('Role is required when searching by role.');
        }
        query += ` role:${role}`;
        break;
      case 'organization':
        if (!organization) {
          throw new Error(
            'Organization is required when searching by organization.'
          );
        }
        query += ` organization:"${organization}"`;
        break;
      case 'tag':
        if (!tag) {
          throw new Error('Tag is required when searching by tag.');
        }
        query += ` tags:${tag}`;
        break;
      case 'external_id':
        if (!external_id) {
          throw new Error(
            'External ID is required when searching by external ID.'
          );
        }
        query += ` external_id:${external_id}`;
        break;
      case 'custom':
        if (!custom_query) {
          throw new Error('Custom query is required when using custom search.');
        }
        query = custom_query;
        break;
      default:
        throw new Error('Invalid search type selected.');
    }

    const searchParams = new URLSearchParams();
    searchParams.append('query', query);

    if (sort_by && sort_by !== 'relevance') {
      searchParams.append('sort_by', sort_by);
    }

    if (sort_order) {
      searchParams.append('sort_order', sort_order);
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${
          authentication.subdomain
        }.zendesk.com/api/v2/search.json?${searchParams.toString()}`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      const responseBody = response.body as {
        results: Array<Record<string, unknown>>;
        count: number;
        next_page?: string;
        previous_page?: string;
        facets?: unknown;
      };

      const users = responseBody.results.filter(
        (result) => result.result_type === 'user'
      );

      return {
        success: true,
        message: `Found ${users.length} user(s) matching the search criteria`,
        data: response.body,
        users,
        search_criteria: {
          type: search_type,
          query: query,
          sort_by: sort_by || 'relevance',
          sort_order: sort_order || 'desc',
        },
        total_count: responseBody.count,
        found_count: users.length,
        has_more: !!responseBody.next_page,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('400')) {
        throw new Error(
          'Invalid search query. Please check your search parameters and try again.'
        );
      }

      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error(
          'Authentication failed or insufficient permissions. Please check your API credentials and permissions to search users.'
        );
      }

      if (errorMessage.includes('404')) {
        return {
          success: true,
          message: 'No users found matching the search criteria',
          data: { results: [], count: 0 },
          users: [],
          search_criteria: {
            type: search_type,
            query: query,
            sort_by: sort_by || 'relevance',
            sort_order: sort_order || 'desc',
          },
          total_count: 0,
          found_count: 0,
          has_more: false,
        };
      }

      if (errorMessage.includes('422')) {
        throw new Error(
          'Search query validation error. Please check your search syntax and parameters.'
        );
      }

      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to search users: ${errorMessage}`);
    }
  },
});
