import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';

export const deleteShortLinkAction = createAction({
  auth: shortIoAuth,
  name: 'delete-short-link',
  displayName: 'Delete Short Link',
  description: 'Permanently delete a short link by its unique link ID.',
  props: {
    linkId: Property.ShortText({
      displayName: 'Link ID',
      description: 'The ID of the short link you want to delete (e.g., lnk_61Mb_0dnRUg3vvtmAPZh3dhQh6)',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { linkId } = propsValue;

    if (!linkId || linkId.trim() === '') {
      throw new Error('Link ID is required and cannot be empty');
    }

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.DELETE,
        auth,
        resourceUri: `/links/${linkId}`,
      });

      return {
        success: true,
        message: `Short link with ID ${linkId} deleted successfully`,
        data: response,
      };
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request. Please check the link ID format and try again.'
        );
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API key and permissions.'
        );
      }
      
      if (error.message.includes('404')) {
        throw new Error(
          `Short link with ID ${linkId} not found. It may have already been deleted.`
        );
      }
      
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to delete short link: ${error.message}`);
    }
  },
});
