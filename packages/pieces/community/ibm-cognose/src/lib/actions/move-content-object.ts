import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { contentObjectDropdown } from '../common/content-object-dropdown';

export const moveContentObjectAction = createAction({
  auth: ibmCognoseAuth,
  name: 'move_content_object',
  displayName: 'Move Content Object',
  description: 'Moves a content object with all its descendants to a new location in IBM Cognos Analytics',
  props: {
    sourceId: contentObjectDropdown,
    destinationId: {
      ...contentObjectDropdown,
      displayName: 'Destination Container',
      description: 'Select the destination container where the object will be moved',
    },
  },
  async run({ auth, propsValue }) {
    const { sourceId, destinationId } = propsValue;

    // Validate that source and destination are different
    if (sourceId === destinationId) {
      throw new Error('Source and destination cannot be the same object');
    }

    // Create Cognos client
    const client = new CognosClient(auth);

    // Build the move request body
    const moveRequest = {
      source_id: sourceId,
      destination_id: destinationId,
    };

    // Move the content object
    const response = await client.makeAuthenticatedRequest(
      '/content/move', 
      HttpMethod.PUT, 
      moveRequest
    );

    if (response.status === 204) {
      return {
        success: true,
        message: `Content object '${sourceId}' moved successfully to '${destinationId}'`,
        sourceId,
        destinationId,
      };
    } else if (response.status === 400) {
      throw new Error(`Bad request: ${response.body?.message || 'Invalid move operation'}`);
    } else if (response.status === 401) {
      throw new Error('Authentication required. Please check your credentials.');
    } else if (response.status === 403) {
      throw new Error('Permission denied. You do not have sufficient permissions to move this object.');
    } else if (response.status === 404) {
      throw new Error('Object or parent object not found. Please verify the source and destination IDs.');
    } else {
      throw new Error(`Failed to move content object: ${response.status} ${response.body}`);
    }
  },
});