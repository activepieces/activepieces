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
  displayName: 'Find Organization(s)',
  description: 'Search organizations by name, domain, external ID, or other criteria.',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Choose how to search for organizations',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Search by Name', value: 'name' },
          { label: 'Search by Domain', value: 'domain' },
          { label: 'Search by External ID', value: 'external_id' },
          { label: 'Search by Tag', value: 'tag' },
          { label: 'Search by Details', value: 'details' },
          { label: 'Custom Query', value: 'custom' },
        ],
      },
    }),
    name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'The name of the organization to search for',
      required: false,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Search organizations by domain name',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Search organizations by external ID',
      required: false,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Search organizations containing this tag',
      required: false,
    }),
    details: Property.ShortText({
      displayName: 'Details',
      description: 'Search in organization details/notes',
      required: false,
    }),
    custom_query: Property.LongText({
      displayName: 'Custom Query',
      description: 'Custom search query using Zendesk search syntax (e.g., "type:organization domain:example.com")',
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
      name,
      domain,
      external_id,
      tag,
      details,
      custom_query,
      sort_by,
      sort_order,
    } = propsValue;

    let query = 'type:organization';
    
    switch (search_type) {
      case 'name':
        if (!name) {
          throw new Error('Organization name is required when searching by name.');
        }
        query += ` name:"${name}"`;
        break;
      case 'domain':
        if (!domain) {
          throw new Error('Domain is required when searching by domain.');
        }
        query += ` domain:${domain}`;
        break;
      case 'external_id':
        if (!external_id) {
          throw new Error('External ID is required when searching by external ID.');
        }
        query += ` external_id:${external_id}`;
        break;
      case 'tag':
        if (!tag) {
          throw new Error('Tag is required when searching by tag.');
        }
        query += ` tags:${tag}`;
        break;
      case 'details':
        if (!details) {
          throw new Error('Details are required when searching by details.');
        }
        query += ` details:"${details}"`;
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
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/search.json?${searchParams.toString()}`,
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

      const organizations = responseBody.results.filter(result => result.result_type === 'organization');

      return {
        success: true,
        message: `Found ${organizations.length} organization(s) matching the search criteria`,
        data: response.body,
        organizations,
        search_criteria: {
          type: search_type,
          query: query,
          sort_by: sort_by || 'relevance',
          sort_order: sort_order || 'desc',
        },
        total_count: responseBody.count,
        found_count: organizations.length,
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
          'Authentication failed or insufficient permissions. Please check your API credentials and permissions to search organizations.'
        );
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

      throw new Error(`Failed to search organizations: ${errorMessage}`);
    }
  },
});
