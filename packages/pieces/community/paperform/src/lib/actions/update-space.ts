import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { spaceIdDropdown } from '../common/props';

export const updateSpace = createAction({
  auth: PaperformAuth,
  name: 'updateSpace',
  displayName: 'Update Space',
  description: 'Update an existing space in Paperform',
  props: {
    space_id: spaceIdDropdown,
    name: Property.ShortText({
      displayName: 'Space Name',
      description: 'The name of the space',
      required: false,
    }),
  },
  async run(context) {
    const { space_id, name } = context.propsValue;
    const apiKey = context.auth as string;

    const spaceData: any = {};

    // Only include fields that have values (partial update)
    if (name !== undefined) {
      spaceData.name = name;
    }

    try {
      const response = await makeRequest(
        apiKey,
        HttpMethod.PUT,
        `/spaces/${space_id}`,
        spaceData
      );

      return {
        success: true,
        message: `Successfully updated space ${space_id}`,
        space: response,
      };
    } catch (error: any) {
      if (error.message.includes('400')) {
        return {
          success: false,
          error: 'invalid_data',
          message: 'Invalid space data provided. Please check all fields.',
        };
      }

      if (error.message.includes('404')) {
        return {
          success: false,
          error: 'space_not_found',
          message: `Space with ID "${space_id}" was not found`,
        };
      }

      if (error.message.includes('409')) {
        return {
          success: false,
          error: 'space_exists',
          message: `Space with name "${name}" already exists`,
        };
      }

      throw new Error(`Failed to update space: ${error.message}`);
    }
  },
});
