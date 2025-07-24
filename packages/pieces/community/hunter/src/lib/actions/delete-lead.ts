import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterIoApiCall } from '../common/client';
import { hunterIoAuth } from '../common/auth';
import { leadIdDropdown } from '../common/props';

export const deleteLeadAction = createAction({
  auth: hunterIoAuth,
  name: 'delete_lead',
  displayName: 'Delete a Lead',
  description: 'Delete a specific lead record by its ID.',
  props: {
    lead_id: leadIdDropdown,
  },
  async run({ propsValue, auth }) {
    const { lead_id } = propsValue;

    try {
      await hunterIoApiCall({
        method: HttpMethod.DELETE,
        auth,
        resourceUri: `/leads/${lead_id}`,
      });
      return {
        success: true,
      };
    } catch (error: any) {
      if (error.message.includes('409')) {
        throw new Error(
          'A conflict occurred. The resource could not be deleted.'
        );
      }
      if (error.message.includes('400')) {
        throw new Error('Invalid request. Please check the Lead ID.');
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

      throw new Error(`Failed to delete lead: ${error.message}`);
    }
  },
});
