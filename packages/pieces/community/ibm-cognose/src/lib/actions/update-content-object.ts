import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { contentObjectDropdown } from '../common/content-object-dropdown';

export const updateContentObjectAction = createAction({
  auth: ibmCognoseAuth,
  name: 'update_content_object',
  displayName: 'Update Content Object',
  description: 'Updates an existing content object in IBM Cognos Analytics',
  props: {
    objectId: contentObjectDropdown,
    defaultName: Property.ShortText({
      displayName: 'Default Name',
      description: 'The new default name for the content object',
      required: false,
    }),
    defaultDescriptions: Property.LongText({
      displayName: 'Default Descriptions',
      description: 'The new default descriptions for the content object',
      required: false,
    }),
    type: Property.ShortText({
      displayName: 'Type',
      description: 'The type of the content object (e.g., report, dashboard, folder)',
      required: false,
    }),
    version: Property.Number({
      displayName: 'Version',
      description: 'The version number of the content object',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { objectId, defaultName, defaultDescriptions, type, version } = propsValue;

    // Create Cognos client
    const client = new CognosClient(auth);

    // Build the update definition (only include fields that are provided)
    const updateDefinition: any = {};
    
    if (defaultName) {
      updateDefinition.defaultName = defaultName;
    }
    
    if (defaultDescriptions) {
      updateDefinition.defaultDescriptions = defaultDescriptions;
    }
    
    if (type) {
      updateDefinition.type = type;
    }
    
    if (version !== undefined && version !== null) {
      updateDefinition.version = version;
    }

    // If no fields to update, return early
    if (Object.keys(updateDefinition).length === 0) {
      throw new Error('At least one field must be provided to update the content object');
    }

    // Update the content object
    const response = await client.makeAuthenticatedRequest(
      `/content/${objectId}`, 
      HttpMethod.PUT, 
      updateDefinition
    );

    if (response.status === 204) {
      return {
        success: true,
        message: `Content object '${objectId}' updated successfully`,
        updatedFields: updateDefinition,
      };
    } else if (response.status === 401) {
      throw new Error('Authentication required. Please check your credentials.');
    } else if (response.status === 404) {
      throw new Error(`Content object with ID '${objectId}' not found`);
    } else if (response.status === 409) {
      throw new Error('Object has changed since you fetched it. Please refresh and try again.');
    } else {
      throw new Error(`Failed to update content object: ${response.status} ${response.body}`);
    }
  },
});