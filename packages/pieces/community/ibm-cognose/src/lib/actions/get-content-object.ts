import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { contentObjectDropdown } from '../common/content-object-dropdown';

export const getContentObjectAction = createAction({
  auth: ibmCognoseAuth,
  name: 'get_content_object',
  displayName: 'Get Content Object',
  description: 'Retrieves the details of a specific content object from IBM Cognos Analytics',
  props: {
    objectId: contentObjectDropdown,
    fields: Property.ShortText({
      displayName: 'Extra Fields',
      description: 'Optional comma-separated list of extra fields to retrieve (e.g., "owner,permissions,children")',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { objectId, fields } = propsValue;

    // Create Cognos client
    const client = new CognosClient(auth);

    // Build query parameters
    const queryParams = [];
    if (fields && fields.trim()) {
      queryParams.push(`fields=${encodeURIComponent(fields.trim())}`);
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    // Get the content object details
    const response = await client.makeAuthenticatedRequest(
      `/content/${objectId}${queryString}`, 
      HttpMethod.GET
    );

    if (response.status === 200) {
      return {
        success: true,
        contentObject: response.body,
      };
    } else if (response.status === 401) {
      throw new Error('Authentication required. Please check your credentials.');
    } else if (response.status === 404) {
      throw new Error(`Content object with ID '${objectId}' not found`);
    } else {
      throw new Error(`Failed to retrieve content object: ${response.status} ${response.body}`);
    }
  },
});