import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { contentObjectDropdown } from '../common/content-object-dropdown';

export const moveContentObjectAction = createAction({
  auth: ibmCognoseAuth,
  name: 'move_content_object',
  displayName: 'Move Content Object',
  description: 'Move an object with all its descendants',
  props: {
    sourceId: contentObjectDropdown,
    destinationId: {
      ...contentObjectDropdown,
      displayName: 'Destination Container',
      description: 'Destination container where the object will be moved',
    },
  },
  async run({ auth, propsValue }) {
    const { sourceId, destinationId } = propsValue;

    if (sourceId === destinationId) {
      throw new Error('Source and destination cannot be the same object');
    }

    try {
      const client = new CognosClient(auth.props);

      const moveRequest = {
        source_id: sourceId,
        destination_id: destinationId,
      };

      const response = await client.makeAuthenticatedRequest(
        '/content/move', 
        HttpMethod.PUT, 
        moveRequest
      );

      if (response.status === 204) {
        return {
          success: true,
          message: `Content object moved successfully`,
        };
      } else if (response.status === 400) {
        throw new Error(`Bad request: ${response.body?.message || 'Invalid move operation'}`);
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Check your credentials.');
      } else if (response.status === 403) {
        throw new Error('Permission denied. Insufficient permissions to move this object.');
      } else if (response.status === 404) {
        throw new Error('Object or parent object not found.');
      } else {
        throw new Error(`Failed to move: ${response.status} ${response.body}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to move content object: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});