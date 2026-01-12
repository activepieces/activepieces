import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { contentObjectDropdown } from '../common/content-object-dropdown';

export const copyContentObjectAction = createAction({
  auth: ibmCognoseAuth,
  name: 'copy_content_object',
  displayName: 'Copy Content Object',
  description: 'Copy an object optionally with all its descendants',
  props: {
    sourceId: contentObjectDropdown,
    destinationId: {
      ...contentObjectDropdown,
      displayName: 'Destination Container',
      description: 'Destination container where the object will be copied',
    },
    recursive: Property.Checkbox({
      displayName: 'Recursive Copy',
      description: 'Copy all descendants (child objects)',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { sourceId, destinationId, recursive } = propsValue;

    if (sourceId === destinationId) {
      throw new Error('Source and destination cannot be the same object');
    }

    try {
      const client = new CognosClient(auth.props);

      const copyRequest = {
        source_id: sourceId,
        destination_id: destinationId,
        recursive: recursive !== undefined ? recursive : true,
      };

      const response = await client.makeAuthenticatedRequest(
        '/content/copy', 
        HttpMethod.POST, 
        copyRequest
      );

      if (response.status === 201) {
        return {
          success: true,
          message: `Content object copied successfully${recursive ? ' (including descendants)' : ''}`,
          copiedObject: response.body,
        };
      } else if (response.status === 400) {
        throw new Error(`Bad request: ${response.body?.message || 'Invalid copy operation'}`);
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Check your credentials.');
      } else if (response.status === 403) {
        throw new Error('Permission denied. Insufficient permissions to copy this object.');
      } else if (response.status === 404) {
        throw new Error('Object or parent object not found.');
      } else {
        throw new Error(`Failed to copy: ${response.status} ${response.body}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to copy content object: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});