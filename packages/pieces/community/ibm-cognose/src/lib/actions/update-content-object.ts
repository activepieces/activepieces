import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { contentObjectDropdown } from '../common/content-object-dropdown';

export const updateContentObjectAction = createAction({
  auth: ibmCognoseAuth,
  name: 'update_content_object',
  displayName: 'Update Content Object',
  description: 'Update an existing content object',
  props: {
    objectId: contentObjectDropdown,
    type: Property.ShortText({
      displayName: 'Type',
      description: 'Object type (e.g., report, dashboard, folder)',
      required: true,
    }),
    defaultName: Property.ShortText({
      displayName: 'Name',
      description: 'New name for the object',
      required: false,
    }),
    defaultDescriptions: Property.LongText({
      displayName: 'Description',
      description: 'New description for the object',
      required: false,
    }),
    version: Property.Number({
      displayName: 'Version',
      description: 'Current version for optimistic concurrency',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { objectId, defaultName, defaultDescriptions, type, version } = propsValue;

    try {
      const client = new CognosClient(auth.props);

      const updateDefinition: any = { type };
      
      if (defaultName) {
        updateDefinition.defaultName = defaultName;
      }
      
      if (defaultDescriptions) {
        updateDefinition.defaultDescriptions = defaultDescriptions;
      }
      
      if (version !== undefined && version !== null) {
        updateDefinition.version = version;
      }

      const response = await client.makeAuthenticatedRequest(
        `/content/${objectId}`, 
        HttpMethod.PUT, 
        updateDefinition
      );

      if (response.status === 204 || response.status === 200) {
        return {
          success: true,
          message: `Content object updated successfully`,
        };
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Check your credentials.');
      } else if (response.status === 404) {
        throw new Error(`Content object not found`);
      } else if (response.status === 409) {
        throw new Error('Object has changed since you fetched it. Refresh and try again.');
      } else {
        throw new Error(`Failed to update: ${response.status} ${response.body}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to update content object: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});