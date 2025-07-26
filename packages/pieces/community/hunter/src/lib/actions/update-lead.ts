import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterIoApiCall } from '../common/client';
import { hunterIoAuth } from '../common/auth';
import {
  leadFormProperties,
  leadIdDropdown
} from '../common/props';

export const updateLeadAction = createAction({
  auth: hunterIoAuth,
  name: 'update_lead',
  displayName: 'Update Lead',
  description: 'Update an existing lead record by lead ID.',
  props: {
    lead_id: leadIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the lead (e.g., john@example.com).',
      required: false,
    }),
    ...leadFormProperties,
  },
  async run({ propsValue, auth }) {
    const { lead_id, ...body } = propsValue;

    const fieldsToUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null && value !== '') {
        fieldsToUpdate[key] = value;
      }
    }

    try {
      const response = await hunterIoApiCall({
        method: HttpMethod.PUT,
        auth,
        resourceUri: `/leads/${lead_id}`,
        body: fieldsToUpdate,
      });

      return {
        success: true,
        message: `Lead updated successfully!`,
        lead_id,
        updated_fields: Object.keys(fieldsToUpdate),
        data: response,
      };
    } catch (error: any) {
      if (error.message.includes('409')) {
        throw new Error(
          'A conflict occurred. This may be due to a duplicate email or other data conflict.'
        );
      }
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request. Please check the format of the provided data.'
        );
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API key and permissions.'
        );
      }
      if (error.message.includes('404')) {
        throw new Error(
          'Not Found. A lead with the specified ID does not exist.'
        );
      }
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to update lead: ${error.message}`);
    }
  },
});
