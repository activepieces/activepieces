import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { contentObjectDropdown } from '../common/content-object-dropdown';

export const copyContentObjectAction = createAction({
  auth: ibmCognoseAuth,
  name: 'copy_content_object',
  displayName: 'Copy Content Object',
  description: 'Copies a content object optionally with all its descendants to a new location in IBM Cognos Analytics',
  props: {
    sourceId: contentObjectDropdown,
    destinationId: {
      ...contentObjectDropdown,
      displayName: 'Destination Container',
      description: 'Select the destination container where the object will be copied',
    },
    recursive: Property.Checkbox({
      displayName: 'Recursive Copy',
      description: 'Whether to copy all descendants (child objects) as well',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { sourceId, destinationId, recursive } = propsValue;

    // Validate that source and destination are different
    if (sourceId === destinationId) {
      throw new Error('Source and destination cannot be the same object');
    }

    // Create Cognos client
    const client = new CognosClient(auth);

    // Build the copy request body
    const copyRequest = {
      source_id: sourceId,
      destination_id: destinationId,
      recursive: recursive !== undefined ? recursive : true,
    };

    // Copy the content object
    const response = await client.makeAuthenticatedRequest(
      '/content/copy', 
      HttpMethod.POST, 
      copyRequest
    );

    if (response.status === 201) {
      return {
        success: true,
        message: `Content object '${sourceId}' copied successfully to '${destinationId}'${recursive ? ' (including descendants)' : ''}`,
        sourceId,
        destinationId,
        recursive,
        copiedObject: response.body,
      };
    } else if (response.status === 400) {
      throw new Error(`Bad request: ${response.body?.message || 'Invalid copy operation'}`);
    } else if (response.status === 401) {
      throw new Error('Authentication required. Please check your credentials.');
    } else if (response.status === 403) {
      throw new Error('Permission denied. You do not have sufficient permissions to copy this object.');
    } else if (response.status === 404) {
      throw new Error('Object or parent object not found. Please verify the source and destination IDs.');
    } else {
      throw new Error(`Failed to copy content object: ${response.status} ${response.body}`);
    }
  },
});