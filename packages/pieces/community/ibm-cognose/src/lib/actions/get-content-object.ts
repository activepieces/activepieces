import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { contentObjectDropdown } from '../common/content-object-dropdown';

export const getContentObjectAction = createAction({
  auth: ibmCognoseAuth,
  name: 'get_content_object',
  displayName: 'Get Content Object',
  description: 'Get content object details',
  props: {
    objectId: contentObjectDropdown,
    fields: Property.ShortText({
      displayName: 'Extra Fields',
      description: 'Comma-separated list of extra fields (e.g., owner,permissions,children)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { objectId, fields } = propsValue;

    try {
      const client = new CognosClient(auth.props);

      const queryParams = [];
      if (fields && fields.trim()) {
        queryParams.push(`fields=${encodeURIComponent(fields.trim())}`);
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

      const response = await client.makeAuthenticatedRequest(
        `/content/${objectId}${queryString}`, 
        HttpMethod.GET
      );

      if (response.status === 200) {
        return response.body;
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Check your credentials.');
      } else if (response.status === 404) {
        throw new Error(`Content object not found`);
      } else {
        throw new Error(`Failed to retrieve: ${response.status} ${response.body}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to retrieve content object: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});