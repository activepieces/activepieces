import { createAction, Property } from '@activepieces/pieces-framework';
import { zendeskAuth } from '../../index';
import { makeZendeskRequest, validateZendeskAuth, ZENDESK_ERRORS } from '../common/utils';
import { ZendeskAuthProps, ZendeskUser } from '../common/types';
import { sampleUser } from '../common/sample-data';

export const findUser = createAction({
  auth: zendeskAuth,
  name: 'find_user',
  displayName: 'Find User',
  description: 'Retrieve user details by email or ID',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'How to search for the user',
      required: true,
      options: {
        placeholder: 'Select search type',
        options: [
          { label: 'By User ID', value: 'id' },
          { label: 'By Email', value: 'email' },
          { label: 'By External ID', value: 'external_id' },
          { label: 'By Name', value: 'name' },
        ],
      },
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to search for (ID, email, external ID, or name)',
      required: true,
    }),
  },
  sampleData: sampleUser,
  async run(context) {
    const { auth, propsValue } = context;

    if (!validateZendeskAuth(auth)) {
      throw new Error(ZENDESK_ERRORS.INVALID_AUTH);
    }

    const authentication = auth as ZendeskAuthProps;

    try {
      if (propsValue.search_type === 'id') {
        // Direct user lookup by ID
        const response = await makeZendeskRequest<{ user: ZendeskUser }>(
          authentication,
          `/users/${propsValue.search_value}.json`
        );
        return response.user;
      } else {
        // Search using the search API
        let query: string;
        
        switch (propsValue.search_type) {
          case 'email':
            query = `type:user email:${propsValue.search_value}`;
            break;
          case 'external_id':
            query = `type:user external_id:${propsValue.search_value}`;
            break;
          case 'name':
            query = `type:user name:"${propsValue.search_value}"`;
            break;
          default:
            throw new Error('Invalid search type');
        }

        const response = await makeZendeskRequest<{ results: ZendeskUser[] }>(
          authentication,
          `/search.json?query=${encodeURIComponent(query)}`
        );

        if (response.results && response.results.length > 0) {
          return response.results[0]; // Return the first match
        } else {
          throw new Error('User not found');
        }
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(ZENDESK_ERRORS.UNAUTHORIZED);
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.response?.status === 422) {
        throw new Error('Invalid search query. Please check your search parameters.');
      } else if (error.response?.status === 429) {
        throw new Error(ZENDESK_ERRORS.RATE_LIMITED);
      } else if (error.response?.status >= 500) {
        throw new Error(ZENDESK_ERRORS.SERVER_ERROR);
      }
      
      throw new Error(`Failed to find user: ${error.message}`);
    }
  },
});