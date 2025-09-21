import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';

export const findContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Find a person or organisation in Capsule CRM',
  
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Name, email, or other identifier to search for',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'Type of contact to search for',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Person', value: 'person' },
          { label: 'Organisation', value: 'organisation' },
        ],
      },
      defaultValue: '',
    }),
  },

  async run(context) {
    const { searchTerm, type } = context.propsValue;

    let endpoint = `/parties?q=${encodeURIComponent(searchTerm)}`;
    if (type) {
      endpoint += `&filter[type]=${type}`;
    }

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      endpoint
    );

    return {
      parties: response.parties || [],
      total: response.parties?.length || 0,
    };
  },
});
