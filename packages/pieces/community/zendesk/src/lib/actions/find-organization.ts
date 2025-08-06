import { createAction, Property } from '@activepieces/pieces-framework';
import { zendeskAuth } from '../../index';
import { makeZendeskRequest, validateZendeskAuth, ZENDESK_ERRORS } from '../common/utils';
import { ZendeskAuthProps, ZendeskOrganization } from '../common/types';
import { sampleOrganization } from '../common/sample-data';

export const findOrganization = createAction({
  auth: zendeskAuth,
  name: 'find_organization',
  displayName: 'Find Organization',
  description: 'Look up an organization by name or ID',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'How to search for the organization',
      required: true,
      options: {
        placeholder: 'Select search type',
        options: [
          { label: 'By Organization ID', value: 'id' },
          { label: 'By Name', value: 'name' },
          { label: 'By External ID', value: 'external_id' },
          { label: 'By Domain', value: 'domain' },
        ],
      },
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to search for (ID, name, external ID, or domain)',
      required: true,
    }),
  },
  sampleData: sampleOrganization,
  async run(context) {
    const { auth, propsValue } = context;

    if (!validateZendeskAuth(auth)) {
      throw new Error(ZENDESK_ERRORS.INVALID_AUTH);
    }

    const authentication = auth as ZendeskAuthProps;

    try {
      if (propsValue.search_type === 'id') {
        // Direct organization lookup by ID
        const response = await makeZendeskRequest<{ organization: ZendeskOrganization }>(
          authentication,
          `/organizations/${propsValue.search_value}.json`
        );
        return response.organization;
      } else {
        // Search using the search API
        let query: string;
        
        switch (propsValue.search_type) {
          case 'name':
            query = `type:organization name:"${propsValue.search_value}"`;
            break;
          case 'external_id':
            query = `type:organization external_id:${propsValue.search_value}`;
            break;
          case 'domain':
            query = `type:organization domain:${propsValue.search_value}`;
            break;
          default:
            throw new Error('Invalid search type');
        }

        const response = await makeZendeskRequest<{ results: ZendeskOrganization[] }>(
          authentication,
          `/search.json?query=${encodeURIComponent(query)}`
        );

        if (response.results && response.results.length > 0) {
          return response.results[0]; // Return the first match
        } else {
          throw new Error('Organization not found');
        }
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(ZENDESK_ERRORS.UNAUTHORIZED);
      } else if (error.response?.status === 404) {
        throw new Error('Organization not found');
      } else if (error.response?.status === 422) {
        throw new Error('Invalid search query. Please check your search parameters.');
      } else if (error.response?.status === 429) {
        throw new Error(ZENDESK_ERRORS.RATE_LIMITED);
      } else if (error.response?.status >= 500) {
        throw new Error(ZENDESK_ERRORS.SERVER_ERROR);
      }
      
      throw new Error(`Failed to find organization: ${error.message}`);
    }
  },
});